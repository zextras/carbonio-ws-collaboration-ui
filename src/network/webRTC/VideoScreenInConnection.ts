/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { filter, forEach, keyBy } from 'lodash';
import { gte } from 'semver';

import { decideSubstream, initialQualityState, QualityState } from './inboundQualityController';
import { PeerConnConfig } from './PeerConnConfig';
import SubscriptionsManager from './SubscriptionsManager';
import useStore from '../../store/Store';
import { StreamInfo, StreamMap } from '../../types/network/models/meetingBeTypes';
import { IVideoScreenInConnection } from '../../types/network/webRTC/webRTC';
import { STREAM_TYPE, StreamsSubscriptionMap } from '../../types/store/ActiveMeetingTypes';
import { rtcDebug } from '../../utils/debug';
import { createMediaAnswer, requestVideoQuality, videoIceRestart } from '../apis/MeetingsApi';

type InboundVideoStats = { lost: number; recv: number; jbDelay: number; jbEmitted: number };

const readInboundVideoStats = (report: RTCStatsReport): InboundVideoStats => {
	const s: InboundVideoStats = { lost: 0, recv: 0, jbDelay: 0, jbEmitted: 0 };
	report.forEach(
		(
			r: RTCStats & {
				packetsLost?: number;
				packetsReceived?: number;
				jitterBufferDelay?: number;
				jitterBufferEmittedCount?: number;
				kind?: string;
			}
		) => {
			if (r.type === 'inbound-rtp' && r.kind === 'video') {
				s.lost = r.packetsLost ?? 0;
				s.recv = r.packetsReceived ?? 0;
				s.jbDelay = r.jitterBufferDelay ?? 0;
				s.jbEmitted = r.jitterBufferEmittedCount ?? 0;
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

	private qualityStates = new Map<string, QualityState>();

	private prevStats = new Map<
		string,
		{ lost: number; recv: number; jbDelay: number; jbEmitted: number; jbdAvg: number }
	>();

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
							const { lost, recv, jbDelay, jbEmitted } = readInboundVideoStats(report);
							const prev = this.prevStats.get(key) ?? {
								lost: 0,
								recv: 0,
								jbDelay: 0,
								jbEmitted: 0,
								jbdAvg: 0
							};
							const dLost = Math.max(0, lost - prev.lost);
							const dRecv = Math.max(0, recv - prev.recv);
							const dJbDelay = Math.max(0, jbDelay - prev.jbDelay);
							const dJbEmitted = Math.max(0, jbEmitted - prev.jbEmitted);
							// per-frame jitter-buffer delay this tick (ms); its DIRECTION confirms congestion
							// (rejects Wi-Fi/cellular random loss) — no magnitude threshold on purpose.
							const jbdAvg = dJbEmitted > 0 ? (dJbDelay / dJbEmitted) * 1000 : prev.jbdAvg;
							const jbdRising = dJbEmitted > 0 && jbdAvg > prev.jbdAvg;
							this.prevStats.set(key, { lost, recv, jbDelay, jbEmitted, jbdAvg });

							// too few packets this tick => not statistically meaningful; keep baselines, skip
							if (dLost + dRecv < 20) return;
							// settle mask right after a layer switch / (re)subscribe (keyframe + VP8 ramp)
							if ((this.maskUntilTick.get(key) ?? 0) > this.evalTick) return;

							const lossRate = dLost / (dLost + dRecv);
							rtcDebug(
								`feed=${key} loss=${lossRate.toFixed(3)} jbdAvg=${jbdAvg.toFixed(
									1
								)} rising=${jbdRising}`
							);
							const prevState = this.qualityStates.get(key) ?? initialQualityState(2);
							const next = decideSubstream(prevState, { lossRate, jbdRising });
							this.qualityStates.set(key, next);
							if (next.change !== undefined && mid) {
								requestVideoQuality(this.meetingId, userId, mid, next.change).catch(() => {});
								// +2: after a switch the same-SSRC cumulative jitterBufferDelay spans both layers
								// for one tick, so mask 2 ticks to get a clean same-layer jbdAvg baseline (not just
								// the keyframe settle) — reducing this to +1 would fabricate a spurious jbdRising.
								this.maskUntilTick.set(key, this.evalTick + 2);
								rtcDebug(`feed=${key} -> substream ${next.change}`);
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
					rtcDebug(`feed=${key} AUTO-ON re-probe (re-subscribe) after cooldown`);
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
		rtcDebug(`feed=${key} AUTO-OFF (unsubscribe) — sustained bad connection at low`);
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
		if (this.qualityIntervalId != null) {
			clearInterval(this.qualityIntervalId);
			this.qualityIntervalId = null;
		}
		this.videoReceivers.clear();
		this.qualityStates.clear();
		this.prevStats.clear();
		this.suppressedVideo.clear();
		this.maskUntilTick.clear();
		delete this.subscriptionManager;
		this.peerConn?.close?.();
	}
}
