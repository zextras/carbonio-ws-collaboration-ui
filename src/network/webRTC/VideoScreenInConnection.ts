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

export default class VideoScreenInConnection implements IVideoScreenInConnection {
	peerConn: RTCPeerConnection;

	meetingId: string;

	subscriptionManager?: SubscriptionsManager;

	streamsMap: StreamMap;

	private videoReceivers = new Map<string, { receiver: RTCRtpReceiver; userId: string }>();

	private qualityStates = new Map<string, QualityState>();

	private prevStats = new Map<string, { lost: number; recv: number }>();

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
							let lost = 0;
							let recv = 0;
							report.forEach(
								(
									r: RTCStats & {
										packetsLost?: number;
										packetsReceived?: number;
										kind?: string;
									}
								) => {
									if (r.type === 'inbound-rtp' && r.kind === 'video') {
										lost = r.packetsLost ?? 0;
										recv = r.packetsReceived ?? 0;
									}
								}
							);
							const prev = this.prevStats.get(key) ?? { lost: 0, recv: 0 };
							const dLost = Math.max(0, lost - prev.lost);
							const dRecv = Math.max(0, recv - prev.recv);
							this.prevStats.set(key, { lost, recv });
							const lossRate = dLost + dRecv > 0 ? dLost / (dLost + dRecv) : 0;
							rtcDebug(`feed=${key} lossRate=${lossRate.toFixed(3)} dLost=${dLost} dRecv=${dRecv}`);
							const prevState = this.qualityStates.get(key) ?? initialQualityState(2);
							const next = decideSubstream(prevState, { lossRate });
							this.qualityStates.set(key, next);
							if (next.change !== undefined && mid) {
								requestVideoQuality(this.meetingId, userId, mid, next.change).catch(() => {});
								rtcDebug(`feed=${key} -> substream ${next.change}`);
							}
							if (next.off) {
								useStore
									.getState()
									.setRemoveSubscription(this.meetingId, { userId, type: STREAM_TYPE.VIDEO });
								useStore.getState().setLocalVideoSuppressed(this.meetingId, userId, true);
								this.suppressedVideo.set(key, { userId, offAtTick: this.evalTick });
								this.videoReceivers.delete(key);
								this.qualityStates.delete(key);
								this.prevStats.delete(key);
								rtcDebug(`feed=${key} AUTO-OFF (unsubscribe) — sustained bad connection at low`);
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
		delete this.subscriptionManager;
		this.peerConn?.close?.();
	}
}
