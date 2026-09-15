/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { filter, forEach, keyBy } from 'lodash';
import { gte } from 'semver';

import { videoFpsScore, isUnstableQuality } from './connectionQualityScore';
import {
	FeedDownlinkState,
	decideFeedDownlink,
	initialFeedState,
	TOP_RUNG
} from './inboundQualityController';
import { PeerConnConfig } from './PeerConnConfig';
import SubscriptionsManager from './SubscriptionsManager';
import { getUserName } from '../../store/selectors/UsersSelectors';
import useStore from '../../store/Store';
import { StreamInfo, StreamMap } from '../../types/network/models/meetingBeTypes';
import { IVideoScreenInConnection } from '../../types/network/webRTC/webRTC';
import { STREAM_TYPE, StreamsSubscriptionMap } from '../../types/store/ActiveMeetingTypes';
import { rtcTierDebug } from '../../utils/debug';
import { createMediaAnswer, requestVideoQuality, videoIceRestart } from '../apis/MeetingsApi';

// Attribute a downlink request change to network vs resize (+ direction) for the tier log: only the
// ceiling moved (network target unchanged) => resize, otherwise the network drove it.
const reconcileReason = (
	prev: { net: number; ceil: number } | undefined,
	net: number,
	ceil: number,
	from: number,
	to: number
): string =>
	`${ceil !== prev?.ceil && net === prev?.net ? 'resize' : 'network'}-${to > from ? 'up' : 'down'}`;

// Full temporal target: temporal scaling is removed, so every request asks for all temporal layers.
const FULL_TEMPORAL = 2;

const MASK_TICKS_AFTER_CHANGE = 1;
const MIN_PKT = 20; // min packets/tick to trust the reading; below this = HOLD

export default class VideoScreenInConnection implements IVideoScreenInConnection {
	peerConn: RTCPeerConnection;

	meetingId: string;

	subscriptionManager?: SubscriptionsManager;

	streamsMap: StreamMap;

	private videoReceivers = new Map<string, { receiver: RTCRtpReceiver; userId: string }>();

	private feedStates = new Map<string, FeedDownlinkState>();

	private prevStats = new Map<string, { decoded: number; recv: number }>(); // prev inbound-rtp video framesDecoded / packetsReceived per feed

	private maskTicks = new Map<string, number>(); // post-change keyframe mask per feed

	private evalTick = 0;

	// Last substream we actually REQUESTED per feed — de-dupes the per-tick reconcile so we only hit the
	// REST endpoint when a feed's target actually moves (global rung change, a new feed, or a debug cap).
	private lastAppliedRung = new Map<string, number>();

	// Per feed, the (networkTarget, tileCeiling) seen at the last reconcile — to attribute a request
	// change to network vs resize in the downlink tier log.
	private lastReconcile = new Map<string, { net: number; ceil: number }>();

	constructor(meetingId: string) {
		this.peerConn = new RTCPeerConnection(new PeerConnConfig().getConfig());
		this.peerConn.ontrack = this.onTrack;
		this.peerConn.onconnectionstatechange = this.onConnectionStateChange;
		this.meetingId = meetingId;
		this.subscriptionManager = new SubscriptionsManager(meetingId);
		this.streamsMap = {};
	}

	private readonly onConnectionStateChange = (): void => {
		const state = this.peerConn?.connectionState;
		const version = useStore.getState().session.apiVersion;
		if (state === 'failed' && version && gte(version, '1.6.6')) {
			videoIceRestart(this.meetingId);
		}
	};

	// Handle remote offer creating an answer and sending it to the remote peer
	public handleRemoteOffer(sdp: string): void {
		const offer = new RTCSessionDescription({ sdp, type: 'offer' });
		this.peerConn
			.setRemoteDescription(offer)
			.then(() => {
				this.peerConn
					.createAnswer()
					.then((rtcSessionDesc: RTCSessionDescriptionInit) => {
						this.peerConn
							.setLocalDescription(rtcSessionDesc)
							.then(() => {
								if (rtcSessionDesc.sdp) {
									createMediaAnswer(this.meetingId, rtcSessionDesc.sdp);
								}
							})
							.catch((reason) => console.warn('setLocalDescription failed', reason));
					})
					.catch((reason) => console.warn('createAnswer failed', reason));
			})
			.catch((reason) => console.warn('setRemoteDescription failed', reason));
	}

	public handleParticipantsSubscribed(streamsMap: StreamInfo[]): void {
		const temporaryStreams: StreamMap = {};
		forEach(streamsMap, (stream) => {
			const streamsKey = `${stream.userId}-${stream.type.toLowerCase()}`;
			temporaryStreams[streamsKey] = {
				...this.streamsMap[streamsKey],
				userId: stream.userId,
				type: stream.type.toLowerCase() as STREAM_TYPE,
				mid: stream.mid
			};
		});

		this.streamsMap = temporaryStreams;
		this.updateStreams();
		// Apply the current target to freshly-subscribed feeds now that their mids are known, so a
		// feed subscribed while the target is low never lingers at the publisher's top substream.
		this.reconcileFeeds();
	}

	public removeStream = (streamKey: string, streamType: STREAM_TYPE[]): void => {
		forEach(streamType, (type) => {
			const key = `${streamKey}-${type}`;
			delete this.streamsMap[key];
			if (type === STREAM_TYPE.VIDEO) {
				this.videoReceivers.delete(key);
				this.lastAppliedRung.delete(key);
				this.lastReconcile.delete(key);
				this.feedStates.delete(key);
				this.prevStats.delete(key);
				this.maskTicks.delete(key);
			}
		});
	};

	private onTrack = (ev: RTCTrackEvent): void => {
		forEach(ev.streams, (stream) => {
			const userId = stream.id.split('/')[0];
			const type = stream.id.split('/')[1].toLowerCase() as STREAM_TYPE;
			if (userId && type) {
				const streamsKey = `${userId}-${type}`;
				this.streamsMap[streamsKey] = {
					...this.streamsMap[streamsKey],
					stream
				};
				if (type === STREAM_TYPE.VIDEO) {
					this.videoReceivers.set(streamsKey, { receiver: ev.receiver, userId });
				}
			}
		});
		this.updateStreams();
		// A (re)subscribed track just arrived — clamp it to the current floor at once.
		this.reconcileFeeds();
	};

	// Returns the lowest targetRung across all tracked feeds (used to seed a newly subscribed feed
	// so it inherits the room's current lowest tier instead of jumping straight to 720p).
	private roomFloor(): number {
		let m = TOP_RUNG;
		this.feedStates.forEach((s) => {
			if (s.targetRung < m) m = s.targetRung;
		});
		return m;
	}

	// Read the receiver's inbound-rtp video stats and derive the fps-liveness score (0..10), or undefined
	// (HOLD: no evidence) on the first tick, a counter reset, or when almost no data arrives. Also consumes
	// the post-change keyframe mask so the tick right after our own tier change is skipped.
	private async computeFeedScore(
		key: string,
		receiver: RTCRtpReceiver
	): Promise<number | undefined> {
		let stats: RTCStatsReport | null = null;
		try {
			stats = await receiver.getStats();
		} catch {
			stats = null;
		}

		let decoded: number | undefined;
		let recv: number | undefined;
		stats?.forEach(
			(r: RTCStats & { kind?: string; framesDecoded?: number; packetsReceived?: number }) => {
				if (r.type !== 'inbound-rtp' || r.kind !== 'video') return;
				if (r.framesDecoded != null) decoded = r.framesDecoded;
				if (r.packetsReceived != null) recv = r.packetsReceived;
			}
		);

		const prev = this.prevStats.get(key);
		if (decoded != null && recv != null) this.prevStats.set(key, { decoded, recv });

		let score: number | undefined;
		if (decoded == null || recv == null || prev == null) {
			score = undefined; // no counters / first tick
		} else if (decoded < prev.decoded || recv < prev.recv) {
			score = undefined; // counter reset -> reseed, skip
		} else if (recv - prev.recv < MIN_PKT) {
			score = undefined; // almost no data arriving -> HOLD (blackout / paused / trickle)
		} else {
			const fps = (decoded - prev.decoded) / 2; // 2 s tick
			score = videoFpsScore(fps);
		}

		const mask = this.maskTicks.get(key) ?? 0;
		if (mask > 0) {
			this.maskTicks.set(key, mask - 1);
			score = undefined; // skip the keyframe tick right after our own tier change
		}
		return score;
	}

	/** One downlink-quality evaluation per 2 s tick; see decideFeedDownlink for the decision rules. */
	public evaluateQualityTick = async (): Promise<void> => {
		this.evalTick += 1;

		const am = useStore.getState().activeMeeting;
		const cq = am?.connectionQuality ?? {};

		await Promise.all(
			[...this.videoReceivers.entries()].map(async ([key, { receiver, userId }]) => {
				const score = await this.computeFeedScore(key, receiver);

				const q = cq[userId]?.quality;
				const senderOK = q == null ? true : !isUnstableQuality(q);

				const prevState = this.feedStates.get(key) ?? initialFeedState(this.roomFloor());
				// The controller decides only the NETWORK target; the tile-size ceiling is applied as a
				// min() at request time (reconcileFeeds), so a resize adapts without the network backoff.
				const { state } = decideFeedDownlink(prevState, score, senderOK);
				this.feedStates.set(key, state);
			})
		);

		this.reconcileFeeds();
	};

	private desiredSubstream(key: string): number {
		return this.feedStates.get(key)?.targetRung ?? this.roomFloor();
	}

	// Request the current per-feed target for every active feed whose mid is known, de-duped per feed.
	// Run on every 2 s tick AND whenever the feed set changes (a scroll-driven (re)subscribe), so a feed
	// that (re)connects while the target is low is clamped to the target immediately. Janus clamps each
	// request to what the publisher offers.
	private reconcileFeeds(): void {
		const store = useStore.getState();
		const am = store.activeMeeting;
		if (!am || am.meetingId !== this.meetingId) return;
		const ceilings = am.tileCeilings ?? {};
		this.videoReceivers.forEach(({ userId }, key) => {
			const mid = this.streamsMap[key]?.mid;
			if (mid == null) return;
			// Requested tier = the network target capped by the tile-size ceiling. The two change
			// independently; the ceiling has no backoff, so a resize is applied on the very next tick.
			const net = this.desiredSubstream(key);
			const ceil = Math.min(ceilings[key] ?? TOP_RUNG, TOP_RUNG);
			const desired = Math.min(net, ceil);
			const prev = this.lastReconcile.get(key);
			this.lastReconcile.set(key, { net, ceil });
			const applied = this.lastAppliedRung.get(key);
			if (applied === desired) return;
			this.maskTicks.set(key, MASK_TICKS_AFTER_CHANGE);
			if (applied != null) {
				const reason = reconcileReason(prev, net, ceil, applied, desired);
				rtcTierDebug('downlink', applied, desired, getUserName(store, userId), reason);
			}
			this.lastAppliedRung.set(key, desired);
			requestVideoQuality(this.meetingId, userId, mid, desired as 0 | 1 | 2, FULL_TEMPORAL).catch(
				() => {}
			);
		});
	}

	private updateStreams(): void {
		const completeStreams = filter(this.streamsMap, (stream) => !!stream.stream && !!stream.userId);
		const newStreams = keyBy(
			completeStreams,
			(stream) => `${stream.userId}-${stream.type}`
		) as StreamsSubscriptionMap;
		useStore.getState().setSubscribedTracks(this.meetingId, newStreams);
	}

	public closePeerConnection(): void {
		this.videoReceivers.clear();
		this.lastReconcile.clear();
		this.feedStates.clear();
		this.prevStats.clear();
		this.maskTicks.clear();
		this.lastAppliedRung.clear();
		delete this.subscriptionManager;
		this.peerConn?.close?.();
	}
}
