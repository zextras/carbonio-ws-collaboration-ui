/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { filter, forEach, keyBy } from 'lodash';
import { gte } from 'semver';

import {
	computeDegradedSummary,
	DownlinkSmState,
	FeedSnapshot,
	initialDownlinkSmState,
	tickDownlinkSm
} from './downlinkStateMachine';
import {
	CentralDownlinkState,
	decideDownlink,
	FPS_LOG_DELTA,
	initialCentralState,
	isReducedFramerate,
	layersOf,
	TOP_RUNG
} from './inboundQualityController';
import { PeerConnConfig } from './PeerConnConfig';
import SubscriptionsManager from './SubscriptionsManager';
import { getUserName } from '../../store/selectors/UsersSelectors';
import useStore from '../../store/Store';
import { StreamInfo, StreamMap } from '../../types/network/models/meetingBeTypes';
import { IVideoScreenInConnection } from '../../types/network/webRTC/webRTC';
import { STREAM_TYPE, StreamsSubscriptionMap } from '../../types/store/ActiveMeetingTypes';
import { rtcDebug } from '../../utils/debug';
import { createMediaAnswer, requestVideoQuality, videoIceRestart } from '../apis/MeetingsApi';

// height label per substream index (resolution-before-framerate ladder).
const heightName = (substream: number): string => ['144', '360', '720'][substream] ?? '?';

type InboundVideoStats = {
	lost: number;
	recv: number;
	jbDelay: number;
	jbEmitted: number;
	totalFreezesDuration: number;
	frameHeight: number;
	framesPerSecond: number;
};

// Cumulative snapshot for the 5 s sliding-window used to compute per-feed vote inputs.
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
		frameHeight: 0,
		framesPerSecond: 0
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
				framesPerSecond?: number;
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
				s.framesPerSecond = r.framesPerSecond ?? 0;
			}
		}
	);
	return s;
};

// Per-feed result collected from getStats before the centralized decision is run.
type FeedTickResult = {
	key: string;
	userId: string;
	mid: string;
	lossRate: number;
	jbdRising: boolean;
	fps: number;
	masked: boolean;
	enoughPackets: boolean;
};

export default class VideoScreenInConnection implements IVideoScreenInConnection {
	peerConn: RTCPeerConnection;

	meetingId: string;

	subscriptionManager?: SubscriptionsManager;

	streamsMap: StreamMap;

	private videoReceivers = new Map<string, { receiver: RTCRtpReceiver; userId: string }>();

	private screenReceiver: RTCRtpReceiver | null = null;

	private centralState: CentralDownlinkState = initialCentralState();

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

	// last fps logged per feed, for delta-gated fps-only logs
	private lastFps = new Map<string, number>();

	private evalTick = 0;

	private qualityIntervalId: ReturnType<typeof setInterval> | null = null;

	private downlinkSmState: DownlinkSmState = initialDownlinkSmState();

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
				this.centralState.feeds.delete(key);
				this.suppressedVideo.delete(key);
				this.maskUntilTick.delete(key);
				this.feedQualityData.delete(key);
				this.feedCumRing.delete(key);
				this.lastFps.delete(key);
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
					// Add the feed to the centralized state at the top rung (fresh subscribe).
					this.centralState.feeds.set(streamsKey, { rung: TOP_RUNG, ticksSinceChange: 0 });
					// A live track means this feed is no longer auto-suppressed.
					this.suppressedVideo.delete(streamsKey);
					// Mask decisions while VP8 simulcast layers ramp up (~first ticks after (re)subscribe).
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

		const activeFeedEntries = Array.from(this.videoReceivers.entries()).filter(
			([key]) => !!this.streamsMap[key]?.mid && !this.suppressedVideo.has(key)
		);

		// Step 1: collect stats for all active feeds concurrently.
		return Promise.all(
			activeFeedEntries.map(([key, { receiver, userId }]) => {
				const mid = this.streamsMap[key]?.mid as string;
				return receiver
					.getStats()
					.then((report) => {
						const {
							lost,
							recv,
							jbDelay,
							jbEmitted,
							totalFreezesDuration,
							frameHeight,
							framesPerSecond
						} = readInboundVideoStats(report);
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
						// per-frame jitter-buffer delay this tick (ms); its DIRECTION confirms congestion.
						const jbdAvg = dJbEmitted > 0 ? (dJbDelay / dJbEmitted) * 1000 : prev.jbdAvg;
						const jbdRising = dJbEmitted > 0 && jbdAvg > prev.jbdAvg;

						// windowed inbound loss rate and freeze fraction for the connection-quality vote.
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

						const masked = (this.maskUntilTick.get(key) ?? 0) > this.evalTick;
						const enoughPackets = dLost + dRecv >= 20;
						const lossRate = dLost + dRecv > 0 ? dLost / (dLost + dRecv) : 0;

						return {
							key,
							userId,
							mid,
							lossRate,
							jbdRising,
							fps: framesPerSecond,
							masked,
							enoughPackets
						} satisfies FeedTickResult;
					})
					.catch((): FeedTickResult | null => null);
			})
		).then((rawResults) => {
			const feedResults = rawResults.filter((r): r is FeedTickResult => r !== null);

			// Step 2: build the samples map from eligible (unmasked + enough packets) feeds.
			const samplesByFeed = new Map<string, { lossRate: number; jbdRising: boolean }>(
				feedResults
					.filter((r) => !r.masked && r.enoughPackets)
					.map((r): [string, { lossRate: number; jbdRising: boolean }] => [
						r.key,
						{ lossRate: r.lossRate, jbdRising: r.jbdRising }
					])
			);

			// Step 3: run the centralized decider — AT MOST one change per tick.
			const { state: nextState, change } = decideDownlink(this.centralState, samplesByFeed);
			this.centralState = nextState;

			// Step 4: apply the single change (if any).
			if (change) {
				if (change.off) {
					const r = feedResults.find((fr) => fr.key === change.key);
					if (r) this.suppressFeed(change.key, r.userId);
				} else if (change.changeSubstream !== undefined) {
					const r = feedResults.find((fr) => fr.key === change.key);
					if (r) {
						requestVideoQuality(
							this.meetingId,
							r.userId,
							r.mid,
							change.changeSubstream!,
							change.changeTemporal
						).catch(() => {});
						// A RESOLUTION switch changes the SSRC -> needs a keyframe; mask 2 ticks.
						// A FRAMERATE step (temporal-layer only) is freeze-free: no mask needed.
						if (change.substreamChanged) this.maskUntilTick.set(change.key, this.evalTick + 2);
						this.lastFps.set(change.key, r.fps);
						const dim = change.substreamChanged ? 'RESOLUTION' : 'FRAMERATE';
						const fromH = heightName(layersOf(change.fromRung).substream);
						const toH = heightName(change.changeSubstream!);
						rtcDebug(
							`DOWNLINK WEBCAM ${this.who(r.userId)} [${dim}]: ${fromH}@${Math.round(r.fps)}fps -> ${toH}@${Math.round(r.fps)}fps`
						);
					}
				}
			}

			// Step 5: delta-gated fps-only logs for feeds that did NOT have a rung change.
			const changedKey = change?.key;
			feedResults
				.filter((r) => r.key !== changedKey && r.fps > 0)
				.forEach((r) => {
					const last = this.lastFps.get(r.key);
					if (last === undefined) {
						this.lastFps.set(r.key, r.fps); // first baseline, no log
					} else if (Math.abs(r.fps - last) >= FPS_LOG_DELTA) {
						rtcDebug(
							`DOWNLINK WEBCAM ${this.who(r.userId)} FPS: ${Math.round(last)} -> ${Math.round(r.fps)}fps`
						);
						this.lastFps.set(r.key, r.fps);
					}
				});

			// Re-probe suppressed feeds after a cooldown.
			Array.from(this.suppressedVideo.entries()).forEach(([key, { userId, offAtTick }]) => {
				if (this.evalTick - offAtTick >= 10) {
					useStore
						.getState()
						.setAddSubscription(this.meetingId, { userId, type: STREAM_TYPE.VIDEO });
					useStore.getState().setLocalVideoSuppressed(this.meetingId, userId, false);
					this.suppressedVideo.delete(key);
					// Re-probe from the bottom rung (the link failed at rung 0 before).
					this.centralState.feeds.set(key, { rung: 0, ticksSinceChange: 0 });
					rtcDebug(`DOWNLINK ${this.who(userId)} AUTO-ON (re-probe)`);
				}
			});

			this.evaluateDownlinkSnackbar(Date.now());
		});
	};

	// Debug logs identify the feed by display name / email, not the raw user id.
	private who(userId: string): string {
		return getUserName(useStore.getState(), userId) || userId;
	}

	private suppressFeed(key: string, userId: string): void {
		useStore.getState().setRemoveSubscription(this.meetingId, { userId, type: STREAM_TYPE.VIDEO });
		useStore.getState().setLocalVideoSuppressed(this.meetingId, userId, true);
		this.suppressedVideo.set(key, { userId, offAtTick: this.evalTick });
		this.videoReceivers.delete(key);
		this.centralState.feeds.delete(key);
		this.prevStats.delete(key);
		this.maskUntilTick.delete(key);
		this.feedQualityData.delete(key);
		this.feedCumRing.delete(key);
		this.lastFps.delete(key);
		rtcDebug(`DOWNLINK ${this.who(userId)} AUTO-OFF (below lowest)`);
	}

	private evaluateDownlinkSnackbar(now: number): void {
		const store = useStore.getState();
		if (!store.activeMeeting || store.activeMeeting.meetingId !== this.meetingId) return;

		const feeds: FeedSnapshot[] = [];

		Array.from(this.videoReceivers.entries())
			.filter(([key]) => !!this.streamsMap[key]?.mid)
			.forEach(([key, { userId }]) => {
				const feedState = this.centralState.feeds.get(key);
				feeds.push({
					userId,
					suppressed: false,
					rung: feedState?.rung
				});
			});

		Array.from(this.suppressedVideo.entries()).forEach(([, { userId }]) => {
			feeds.push({ userId, suppressed: true });
		});

		const { aggregateDegraded, anyFeedSuppressed, maxFailCountAtBoundary } = computeDegradedSummary(
			feeds,
			(userId) => store.activeMeeting?.connectionQuality[userId]?.maxTier,
			this.centralState.failCount
		);

		const { state: nextState, flippedTo } = tickDownlinkSm(this.downlinkSmState, {
			aggregateDegraded,
			anyFeedSuppressed,
			maxFailCountAtBoundary,
			now
		});
		this.downlinkSmState = nextState;

		if (flippedTo !== undefined) {
			store.setDownlinkCompromised(this.meetingId, flippedTo === 'compromised');
		}
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
				const feedState = this.centralState.feeds.get(key);
				const temporalReduced = feedState != null ? isReducedFramerate(feedState.rung) : false;
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
		this.centralState = initialCentralState();
		this.prevStats.clear();
		this.suppressedVideo.clear();
		this.maskUntilTick.clear();
		this.lastFps.clear();
		this.downlinkSmState = initialDownlinkSmState();
		this.screenReceiver = null;
		delete this.subscriptionManager;
		this.peerConn?.close?.();
	}
}
