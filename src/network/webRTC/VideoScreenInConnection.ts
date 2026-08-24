/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { filter, forEach, keyBy } from 'lodash';
import { gte } from 'semver';

import {
	decideQuality,
	initialQualityState,
	isReducedFramerate,
	layersOf,
	QualityState
} from './inboundQualityController';
import { PeerConnConfig } from './PeerConnConfig';
import SubscriptionsManager from './SubscriptionsManager';
import useStore from '../../store/Store';
import { StreamInfo, StreamMap } from '../../types/network/models/meetingBeTypes';
import { IVideoScreenInConnection } from '../../types/network/webRTC/webRTC';
import { STREAM_TYPE, StreamsSubscriptionMap } from '../../types/store/ActiveMeetingTypes';
import { rtcDebug } from '../../utils/debug';
import { createMediaAnswer, requestVideoQuality, videoIceRestart } from '../apis/MeetingsApi';

// downlink debug-log helpers: substream index -> tier name, temporal target -> fps label
const tierName = (substream: number): string => ['low', 'medium', 'high'][substream] ?? '?';
const fpsLabel = (temporal: number | undefined): string => (temporal === 0 ? 'base' : 'full');

type InboundVideoStats = {
	lost: number;
	recv: number;
	jbDelay: number;
	jbEmitted: number;
	totalFreezesDuration: number;
	frameHeight: number;
};

// Cumulative snapshot for the 5 s sliding-window used to compute per-feed vote inputs.
// Mirrors the monitor's Timed<T> / winPush pattern; ts is wall-clock Date.now().
type FeedCumSnap = { ts: number; lost: number; recv: number; totalFreezesDuration: number };

const FEED_WINDOW_MS = 5000;

function feedWinPush(ring: FeedCumSnap[], snap: FeedCumSnap): void {
	ring.push(snap);
	while (ring.length > 1 && snap.ts - ring[0].ts > FEED_WINDOW_MS) {
		ring.shift();
	}
}

const readInboundVideoStats = (report: RTCStatsReport): InboundVideoStats => {
	const s: InboundVideoStats = {
		lost: 0,
		recv: 0,
		jbDelay: 0,
		jbEmitted: 0,
		totalFreezesDuration: 0,
		frameHeight: 0
	};
	report.forEach(
		(
			r: RTCStats & {
				packetsLost?: number;
				packetsReceived?: number;
				jitterBufferDelay?: number;
				jitterBufferEmittedCount?: number;
				totalFreezesDuration?: number;
				frameHeight?: number;
				kind?: string;
			}
		) => {
			if (r.type === 'inbound-rtp' && r.kind === 'video') {
				s.lost = r.packetsLost ?? 0;
				s.recv = r.packetsReceived ?? 0;
				s.jbDelay = r.jitterBufferDelay ?? 0;
				s.jbEmitted = r.jitterBufferEmittedCount ?? 0;
				s.totalFreezesDuration = r.totalFreezesDuration ?? 0;
				s.frameHeight = r.frameHeight ?? 0;
			}
		}
	);
	return s;
};

export default class VideoScreenInConnection implements IVideoScreenInConnection {
	peerConn: RTCPeerConnection;

	meetingId: string;

	subscriptionManager?: SubscriptionsManager;

	streamsMap: StreamMap;

	private videoReceivers = new Map<string, { receiver: RTCRtpReceiver; userId: string }>();

	private screenReceiver: RTCRtpReceiver | null = null;

	private qualityStates = new Map<string, QualityState>();

	private prevStats = new Map<
		string,
		{
			lost: number;
			recv: number;
			jbDelay: number;
			jbEmitted: number;
			jbdAvg: number;
			totalFreezesDuration: number;
		}
	>();

	// per-feed quality data for the connection-quality vote (windowed over 5 s)
	private feedQualityData = new Map<string, { inboundLossRate: number; frameHeight: number }>();

	// per-feed 5 s sliding window of cumulative stats for windowed vote computation
	private feedCumRing = new Map<string, FeedCumSnap[]>();

	private maskUntilTick = new Map<string, number>();

	private suppressedVideo = new Map<string, { userId: string; offAtTick: number }>();

	private evalTick = 0;

	private qualityIntervalId: ReturnType<typeof setInterval> | null = null;

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
	}

	public removeStream = (streamKey: string, streamType: STREAM_TYPE[]): void => {
		forEach(streamType, (type) => {
			const key = `${streamKey}-${type}`;
			delete this.streamsMap[key];
			if (type === STREAM_TYPE.VIDEO) {
				this.videoReceivers.delete(key);
				this.prevStats.delete(key);
				this.qualityStates.delete(key);
				this.suppressedVideo.delete(key);
				this.maskUntilTick.delete(key);
				this.feedQualityData.delete(key);
				this.feedCumRing.delete(key);
			}
			if (type === STREAM_TYPE.SCREEN) {
				this.screenReceiver = null;
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
					// a live track means this feed is no longer auto-suppressed (avoid the cooldown filter
					// skipping a freshly re-subscribed receiver)
					this.suppressedVideo.delete(streamsKey);
					// mask decisions while VP8 simulcast layers ramp up (~first ticks after (re)subscribe)
					this.maskUntilTick.set(streamsKey, this.evalTick + 4);
					if (this.qualityIntervalId == null) {
						this.qualityIntervalId = setInterval(this.evaluateQuality, 2000);
					}
				}
				if (type === STREAM_TYPE.SCREEN) {
					this.screenReceiver = ev.receiver;
				}
			}
		});
		this.updateStreams();
	};

	private evaluateQuality = (): Promise<void> => {
		this.evalTick += 1;
		return Promise.all(
			Array.from(this.videoReceivers.entries())
				.filter(([key]) => !!this.streamsMap[key]?.mid && !this.suppressedVideo.has(key))
				.map(([key, { receiver, userId }]) => {
					const mid = this.streamsMap[key]?.mid as string;
					return receiver
						.getStats()
						.then((report) => {
							const { lost, recv, jbDelay, jbEmitted, totalFreezesDuration, frameHeight } =
								readInboundVideoStats(report);
							const prev = this.prevStats.get(key) ?? {
								lost: 0,
								recv: 0,
								jbDelay: 0,
								jbEmitted: 0,
								jbdAvg: 0,
								totalFreezesDuration: 0
							};
							const dLost = Math.max(0, lost - prev.lost);
							const dRecv = Math.max(0, recv - prev.recv);
							const dJbDelay = Math.max(0, jbDelay - prev.jbDelay);
							const dJbEmitted = Math.max(0, jbEmitted - prev.jbEmitted);
							// per-frame jitter-buffer delay this tick (ms); its DIRECTION confirms congestion
							// (rejects Wi-Fi/cellular random loss) — no magnitude threshold on purpose.
							const jbdAvg = dJbEmitted > 0 ? (dJbDelay / dJbEmitted) * 1000 : prev.jbdAvg;
							const jbdRising = dJbEmitted > 0 && jbdAvg > prev.jbdAvg;
							// windowed inbound loss rate and freeze fraction for the connection-quality vote.
							// Uses a 5 s ring (same WINDOW_MS semantics as the monitor) so both signals
							// smooth over the same horizon. The per-2 s tick lossRate below is kept for
							// the substream controller — that consumer has its own decision cadence.
							const now = Date.now();
							const ring = this.feedCumRing.get(key) ?? [];
							feedWinPush(ring, { ts: now, lost, recv, totalFreezesDuration });
							this.feedCumRing.set(key, ring);
							const base = ring[0];
							const dLostW = Math.max(0, lost - base.lost);
							const dRecvW = Math.max(0, recv - base.recv);
							this.feedQualityData.set(key, {
								inboundLossRate: dLostW + dRecvW > 0 ? dLostW / (dLostW + dRecvW) : 0,
								frameHeight
							});
							this.prevStats.set(key, {
								lost,
								recv,
								jbDelay,
								jbEmitted,
								jbdAvg,
								totalFreezesDuration
							});

							// too few packets this tick => not statistically meaningful; keep baselines, skip
							if (dLost + dRecv < 20) return;
							// settle mask right after a layer switch / (re)subscribe (keyframe + VP8 ramp)
							if ((this.maskUntilTick.get(key) ?? 0) > this.evalTick) return;

							const lossRate = dLost / (dLost + dRecv);
							const prevState = this.qualityStates.get(key) ?? initialQualityState();
							const next = decideQuality(prevState, { lossRate, jbdRising });
							this.qualityStates.set(key, next);
							if (next.changeSubstream !== undefined && mid) {
								requestVideoQuality(
									this.meetingId,
									userId,
									mid,
									next.changeSubstream,
									next.changeTemporal
								).catch(() => {});
								// A RESOLUTION switch changes the SSRC/substream -> needs a keyframe (brief freeze),
								// and the same-SSRC cumulative jitterBufferDelay spans both layers for one tick; mask
								// 2 ticks for the keyframe + a clean jbdAvg baseline. A FRAMERATE step (temporal-layer
								// drop) is freeze-free and same-SSRC, so it needs NO mask — keep evaluating.
								if (next.substreamChanged) this.maskUntilTick.set(key, this.evalTick + 2);
								const dim = next.substreamChanged ? 'RESOLUTION' : 'FRAMERATE';
								const from = layersOf(prevState.rung);
								rtcDebug(
									`DOWNLINK WEBCAM feed=${key} [${dim}]: showing ${tierName(from.substream)}@${fpsLabel(from.temporal)} -> ${tierName(next.changeSubstream)}@${fpsLabel(next.changeTemporal)}`
								);
							}
							if (next.off) {
								this.suppressFeed(key, userId);
							}
						})
						.catch(() => {});
				})
		).then(() => {
			Array.from(this.suppressedVideo.entries()).forEach(([key, { userId, offAtTick }]) => {
				if (this.evalTick - offAtTick >= 10) {
					useStore
						.getState()
						.setAddSubscription(this.meetingId, { userId, type: STREAM_TYPE.VIDEO });
					useStore.getState().setLocalVideoSuppressed(this.meetingId, userId, false);
					this.suppressedVideo.delete(key);
					this.qualityStates.set(key, initialQualityState(0));
					rtcDebug(`DOWNLINK feed=${key} AUTO-ON (re-probe)`);
				}
			});
		});
	};

	private suppressFeed(key: string, userId: string): void {
		useStore.getState().setRemoveSubscription(this.meetingId, { userId, type: STREAM_TYPE.VIDEO });
		useStore.getState().setLocalVideoSuppressed(this.meetingId, userId, true);
		this.suppressedVideo.set(key, { userId, offAtTick: this.evalTick });
		this.videoReceivers.delete(key);
		this.qualityStates.delete(key);
		this.prevStats.delete(key);
		this.maskUntilTick.delete(key);
		this.feedQualityData.delete(key);
		this.feedCumRing.delete(key);
		rtcDebug(`DOWNLINK feed=${key} AUTO-OFF (below lowest)`);
	}

	private updateStreams(): void {
		const completeStreams = filter(this.streamsMap, (stream) => !!stream.stream && !!stream.userId);
		const newStreams = keyBy(
			completeStreams,
			(stream) => `${stream.userId}-${stream.type}`
		) as StreamsSubscriptionMap;
		useStore.getState().setSubscribedTracks(this.meetingId, newStreams);
	}

	public getVideoFeedsForQuality(): Array<{
		userId: string;
		frameHeight: number;
		inboundLossRate: number;
		temporalReduced: boolean;
	}> {
		const feeds: Array<{
			userId: string;
			frameHeight: number;
			inboundLossRate: number;
			temporalReduced: boolean;
		}> = [];
		Object.keys(this.streamsMap).forEach((key) => {
			if (!key.endsWith('-video')) return;
			// suppressed feeds are excluded — active feeds only
			if (this.suppressedVideo.has(key)) return;
			const entry = this.videoReceivers.get(key);
			if (entry != null) {
				const qd = this.feedQualityData.get(key) ?? { inboundLossRate: 0, frameHeight: 0 };
				// framerate (temporal) is not observable from frameHeight, so the vote reads the controller's
				// current temporal target for this feed: reduced == our controller forced the framerate down.
				const state = this.qualityStates.get(key);
				const temporalReduced = state != null ? isReducedFramerate(state.rung) : false;
				feeds.push({ userId: entry.userId, ...qd, temporalReduced });
			}
		});
		return feeds;
	}

	public getScreenReceiver(): RTCRtpReceiver | null {
		return this.screenReceiver;
	}

	public hasScreenFeed(): boolean {
		return Object.keys(this.streamsMap).some((k) => k.endsWith('-screen'));
	}

	public closePeerConnection(): void {
		if (this.qualityIntervalId != null) {
			clearInterval(this.qualityIntervalId);
			this.qualityIntervalId = null;
		}
		this.videoReceivers.clear();
		this.qualityStates.clear();
		this.prevStats.clear();
		this.suppressedVideo.clear();
		this.maskUntilTick.clear();
		this.screenReceiver = null;
		delete this.subscriptionManager;
		this.peerConn?.close?.();
	}
}
