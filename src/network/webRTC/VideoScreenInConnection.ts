/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { filter, forEach, keyBy } from 'lodash';
import { gte } from 'semver';

import { isConnectionQualitySupported, videoFpsScore } from './connectionQualityScore';
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
import { RootStore } from '../../types/store/StoreTypes';
import { rtcDebug } from '../../utils/debug';
import { createMediaAnswer, requestVideoQuality, videoIceRestart } from '../apis/MeetingsApi';

// Attribute a change of the SHOWN tier (= min(our request, the publisher's maxTier)) for the [DOWNLINK]
// log: our controller moved the network target => our-network; only the tile ceiling moved => tile-resize;
// neither of ours moved, so the publisher raised/lowered what it sends (Janus clamps us) => their-network.
const shownReason = (prev: { net: number; ceil: number }, net: number, ceil: number): string => {
	if (net !== prev.net) return 'our-network';
	if (ceil !== prev.ceil) return 'tile-resize';
	return 'their-network';
};

// Every request asks for all the temporal layers: only the spatial substream is adapted.
const FULL_TEMPORAL = 2;

const MASK_TICKS_AFTER_CHANGE = 1;
const MIN_PKT = 20; // min packets/tick to trust the reading; below this = HOLD
const TICK_SEC = 2;
// Eval ticks a never-served feed waits for its tile ceiling before falling back to an uncapped request,
// so the first request is already the capped tier (no HIGH-then-drop) yet a feed is never withheld forever.
const CEILING_WAIT_TICKS = 2;
// Upper bound of the doubling wait (in eval ticks) before a failed quality request is sent again
const REQUEST_RETRY_MAX_TICKS = 16;

type InboundCounters = { decoded: number; recv: number; timestamp?: number };

// framesDecoded / packetsReceived of the received webcam, undefined when the counters are missing
const readInboundVideoCounters = (stats: RTCStatsReport | null): InboundCounters | undefined => {
	let decoded: number | undefined;
	let recv: number | undefined;
	let timestamp: number | undefined;
	stats?.forEach(
		(r: RTCStats & { kind?: string; framesDecoded?: number; packetsReceived?: number }) => {
			if (r.type !== 'inbound-rtp' || r.kind !== 'video') return;
			if (r.framesDecoded != null) decoded = r.framesDecoded;
			if (r.packetsReceived != null) recv = r.packetsReceived;
			if (r.timestamp != null) timestamp = r.timestamp;
		}
	);
	if (decoded == null || recv == null) return undefined;
	return { decoded, recv, timestamp };
};

// fps-liveness score (0..10) between two samples, undefined (HOLD: no evidence) when it can't be trusted
const fpsScoreBetween = (
	prev: InboundCounters | undefined,
	cur: InboundCounters | undefined
): number | undefined => {
	if (cur == null || prev == null) return undefined; // no counters / first tick
	if (cur.decoded < prev.decoded || cur.recv < prev.recv) return undefined; // counter reset -> reseed, skip
	if (cur.recv - prev.recv < MIN_PKT) return undefined; // almost no data arriving -> HOLD (blackout / paused / trickle)
	// Real interval between the two readings: timers drift (background throttling, overlapping ticks)
	const elapsedSec =
		cur.timestamp != null && prev.timestamp != null
			? (cur.timestamp - prev.timestamp) / 1000
			: TICK_SEC;
	if (elapsedSec <= 0) return undefined;
	return videoFpsScore((cur.decoded - prev.decoded) / elapsedSec);
};

const readReceiverStats = async (receiver: RTCRtpReceiver): Promise<RTCStatsReport | null> => {
	try {
		return await receiver.getStats();
	} catch {
		return null;
	}
};

// Shed only when the sender is at/above its HARDWARE ceiling (the freeze is OUR downlink); HOLD when the
// network shed them BELOW their hardware ceiling (their uplink), so a low-resolution camera is not
// mistaken for a congested sender.
const isSenderOK = (
	maxUplinkTier: number | null | undefined,
	maxHardwareTier: number | null | undefined
): boolean => {
	if (maxUplinkTier == null) return true;
	if (maxHardwareTier == null) return maxUplinkTier > 0;
	return maxUplinkTier >= maxHardwareTier;
};

export default class VideoScreenInConnection implements IVideoScreenInConnection {
	peerConn: RTCPeerConnection;

	meetingId: string;

	subscriptionManager?: SubscriptionsManager;

	streamsMap: StreamMap;

	private readonly videoReceivers = new Map<string, { receiver: RTCRtpReceiver; userId: string }>();

	private readonly feedStates = new Map<string, FeedDownlinkState>();

	private readonly prevStats = new Map<string, { decoded: number; recv: number }>(); // prev inbound-rtp video framesDecoded / packetsReceived per feed

	private readonly maskTicks = new Map<string, number>(); // post-change keyframe mask per feed

	private evalTick = 0;

	// Last substream we actually REQUESTED per feed — de-dupes the per-tick reconcile so we only hit the
	// REST endpoint when a feed's target actually moves (global rung change, a new feed, or a debug cap).
	private readonly lastAppliedRung = new Map<string, number>();

	// Per feed, the (networkTarget, tileCeiling, shownTier) seen at the last reconcile — to log every change
	// of the SHOWN tier (min(request, publisher maxTier)) and attribute it to our controller / resize / them.
	private readonly lastReconcile = new Map<string, { net: number; ceil: number; shown: number }>();

	// Eval tick at which a never-served feed first started waiting for its tile ceiling (deferral window).
	private readonly ceilingWaitSince = new Map<string, number>();

	// Per feed whose last quality request failed: the eval tick before which it is not sent again, and the
	// current wait, doubled on every consecutive failure so a failing endpoint is not hit on every reconcile.
	private readonly requestBackoff = new Map<string, { retryTick: number; delay: number }>();

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

		// A feed that left the subscription (or came back on another mid) starts again from Janus' default
		// substream, so what we requested for it before no longer holds and must be requested again
		forEach(this.streamsMap, (previous, key) => {
			if (previous.type !== STREAM_TYPE.VIDEO || previous.mid == null) return;
			if (temporaryStreams[key]?.mid !== previous.mid) this.resetFeedRequest(key);
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
				this.feedStates.delete(key);
				this.resetFeedRequest(key);
			}
		});
	};

	// Forget what was requested and measured for a feed, keeping its learned network target (feedStates)
	private resetFeedRequest(key: string): void {
		this.lastAppliedRung.delete(key);
		this.lastReconcile.delete(key);
		this.ceilingWaitSince.delete(key);
		this.prevStats.delete(key);
		this.maskTicks.delete(key);
		this.requestBackoff.delete(key);
	}

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

	// A receiver and its learned state outlive a scroll-driven unsubscribe (Janus may reuse the transceiver),
	// but only the feeds in the current subscription carry a mid
	private isSubscribed(key: string): boolean {
		return this.streamsMap[key]?.mid != null;
	}

	// Returns the lowest targetRung across the subscribed feeds (used to seed a newly subscribed feed
	// so it inherits the room's current lowest tier instead of jumping straight to 720p).
	private roomFloor(): number {
		let m = TOP_RUNG;
		this.feedStates.forEach((s, key) => {
			if (this.isSubscribed(key) && s.targetRung < m) m = s.targetRung;
		});
		return m;
	}

	// Derive the fps-liveness score (0..10) from the receiver's inbound-rtp video stats, or undefined
	// (HOLD: no evidence) on the first tick, a counter reset, or when almost no data arrives. Also consumes
	// the post-change keyframe mask so the tick right after our own tier change is skipped.
	private computeFeedScore(key: string, stats: RTCStatsReport | null): number | undefined {
		const cur = readInboundVideoCounters(stats);
		const prev = this.prevStats.get(key);
		if (cur) this.prevStats.set(key, cur);

		const mask = this.maskTicks.get(key) ?? 0;
		if (mask > 0) {
			this.maskTicks.set(key, mask - 1);
			return undefined; // skip the keyframe tick right after our own tier change
		}
		return fpsScoreBetween(prev, cur);
	}

	/** One downlink-quality evaluation per 2 s tick; see decideFeedDownlink for the decision rules. */
	public evaluateQualityTick = async (): Promise<void> => {
		this.evalTick += 1;

		const am = useStore.getState().activeMeeting;
		const cq = am?.connectionQuality ?? {};

		const subscribedReceivers = [...this.videoReceivers.entries()].filter(([key]) =>
			this.isSubscribed(key)
		);
		await Promise.all(
			subscribedReceivers.map(async ([key, { receiver, userId }]) => {
				const stats = await readReceiverStats(receiver);
				// removed, re-subscribed or unsubscribed while the stats were being read: its state must stay deleted
				if (this.videoReceivers.get(key)?.receiver !== receiver || !this.isSubscribed(key)) return;
				const score = this.computeFeedScore(key, stats);

				const senderOK = isSenderOK(cq[userId]?.maxUplinkTier, cq[userId]?.maxHardwareTier);

				const prevState = this.feedStates.get(key) ?? initialFeedState(this.roomFloor());
				// The controller decides only the NETWORK target; the tile-size ceiling is applied as a
				// min() at request time (reconcileFeeds), so a resize adapts without the network backoff.
				this.feedStates.set(key, decideFeedDownlink(prevState, score, senderOK));
			})
		);

		this.reconcileFeeds();
	};

	private desiredSubstream(key: string): number {
		return this.feedStates.get(key)?.targetRung ?? this.roomFloor();
	}

	// Defer a feed's FIRST request until its tile publishes a ceiling, so that first request is already the
	// capped tier (no HIGH probe that the next reconcile clamps down). Bounded: after CEILING_WAIT_TICKS eval
	// ticks with no ceiling the feed is served uncapped, so video is never permanently withheld.
	private deferForCeiling(
		key: string,
		applied: number | undefined,
		ceilingKnown: boolean
	): boolean {
		if (applied != null || ceilingKnown) {
			this.ceilingWaitSince.delete(key);
			return false;
		}
		const since = this.ceilingWaitSince.get(key) ?? this.evalTick;
		this.ceilingWaitSince.set(key, since);
		if (this.evalTick - since < CEILING_WAIT_TICKS) return true;
		this.ceilingWaitSince.delete(key);
		return false;
	}

	// Request the current per-feed target for every active feed whose mid is known, de-duped per feed.
	// Run on every 2 s tick AND whenever the feed set changes (a scroll-driven (re)subscribe), so a feed
	// that (re)connects while the target is low is clamped to the target immediately. Janus clamps each
	// request to what the publisher offers.
	private reconcileFeeds(): void {
		const store = useStore.getState();
		if (!isConnectionQualitySupported(store.session.apiVersion)) return;
		const am = store.activeMeeting;
		if (am?.meetingId !== this.meetingId) return;
		const ceilings = am.tileCeilings ?? {};
		const cq = am.connectionQuality ?? {};
		this.videoReceivers.forEach(({ userId }, key) => {
			const mid = this.streamsMap[key]?.mid;
			if (mid == null) return;
			const applied = this.lastAppliedRung.get(key);
			if (this.deferForCeiling(key, applied, ceilings[key] != null)) return;
			// Requested tier = the network target capped by the tile-size ceiling. Janus then clamps it to the
			// publisher's maxTier server-side, so the tier we actually SHOW is min(request, sender maxTier).
			const net = this.desiredSubstream(key);
			const ceil = Math.min(ceilings[key] ?? TOP_RUNG, TOP_RUNG);
			const desired = Math.min(net, ceil);
			const senderMax = cq[userId]?.maxUplinkTier ?? TOP_RUNG;
			const shown = Math.min(desired, senderMax);
			this.trackShownTier(store, key, userId, { net, ceil, shown });
			// Request path unchanged: only hit Janus (and mask the keyframe) when OUR request actually moves.
			if (applied === desired) return;
			if ((this.requestBackoff.get(key)?.retryTick ?? 0) > this.evalTick) return;
			this.maskTicks.set(key, MASK_TICKS_AFTER_CHANGE);
			this.lastAppliedRung.set(key, desired);
			requestVideoQuality(this.meetingId, userId, mid, desired as 0 | 1 | 2, FULL_TEMPORAL)
				.then(() => this.requestBackoff.delete(key))
				.catch(() => this.onRequestFailed(key, desired));
		});
	}

	// The tier did not change, so there is no keyframe to mask; ask again (unless a newer request
	// superseded this one) only after a wait that doubles on every consecutive failure
	private onRequestFailed(key: string, rung: number): void {
		if (this.lastAppliedRung.get(key) !== rung) return;
		this.lastAppliedRung.delete(key);
		this.maskTicks.delete(key);
		const previousDelay = this.requestBackoff.get(key)?.delay;
		const delay = previousDelay ? Math.min(previousDelay * 2, REQUEST_RETRY_MAX_TICKS) : 1;
		this.requestBackoff.set(key, { retryTick: this.evalTick + delay, delay });
	}

	// Log every change of the SHOWN tier, attributed (our-network / tile-resize / their-network).
	private trackShownTier(
		store: RootStore,
		key: string,
		userId: string,
		current: { net: number; ceil: number; shown: number }
	): void {
		const prev = this.lastReconcile.get(key);
		if (prev != null && current.shown !== prev.shown) {
			rtcDebug(
				`[DOWNLINK] ${getUserName(store, userId)} tier ${prev.shown} -> ${current.shown} (${shownReason(prev, current.net, current.ceil)})`
			);
		}
		this.lastReconcile.set(key, current);
	}

	private updateStreams(): void {
		const completeStreams = filter(this.streamsMap, (stream) => !!stream.stream && !!stream.userId);
		const newStreams = keyBy(
			completeStreams,
			(stream) => `${stream.userId}-${stream.type}`
		) as StreamsSubscriptionMap;
		useStore.getState().setSubscribedTracks(this.meetingId, newStreams);
	}

	// Downlink shortfall: mean per-feed shortfall (theirMaxUplinkTier - myNetTarget).
	// 0 when there are no active feeds or all tiers unknown.
	// Read-only — does NOT alter any controller decision.
	public downlinkShortfall(): number {
		const cq = useStore.getState().activeMeeting?.connectionQuality ?? {};
		const perFeed: number[] = [];
		this.videoReceivers.forEach(({ userId }, key) => {
			if (!this.isSubscribed(key)) return;
			const theirMaxUplinkTier = cq[userId]?.maxUplinkTier;
			if (theirMaxUplinkTier == null) return;
			const netTarget = this.feedStates.get(key)?.targetRung;
			if (netTarget == null) return;
			perFeed.push(Math.max(0, theirMaxUplinkTier - netTarget));
		});
		if (perFeed.length === 0) return 0;
		// Mean over the received webcams
		return perFeed.reduce((sum, v) => sum + v, 0) / perFeed.length;
	}

	public closePeerConnection(): void {
		this.videoReceivers.clear();
		this.lastReconcile.clear();
		this.ceilingWaitSince.clear();
		this.feedStates.clear();
		this.prevStats.clear();
		this.maskTicks.clear();
		this.lastAppliedRung.clear();
		this.requestBackoff.clear();
		delete this.subscriptionManager;
		this.peerConn?.close?.();
	}
}
