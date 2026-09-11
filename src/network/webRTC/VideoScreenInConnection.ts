/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { filter, forEach, keyBy } from 'lodash';
import { gte } from 'semver';

import {
	CentralDownlinkState,
	decideDownlink,
	initialCentralState,
	TOP_RUNG
} from './inboundQualityController';
import { PeerConnConfig } from './PeerConnConfig';
import SubscriptionsManager from './SubscriptionsManager';
import useStore from '../../store/Store';
import { StreamInfo, StreamMap } from '../../types/network/models/meetingBeTypes';
import { IVideoScreenInConnection } from '../../types/network/webRTC/webRTC';
import { STREAM_TYPE, StreamsSubscriptionMap } from '../../types/store/ActiveMeetingTypes';
import { rtcDebug } from '../../utils/debug';
import { getDownloadCap } from '../../utils/debugStreamCaps';
import { createMediaAnswer, requestVideoQuality, videoIceRestart } from '../apis/MeetingsApi';

// height label per substream index (0 = 144p, 1 = 360p, 2 = 720p).
const heightName = (substream: number): string => ['144', '360', '720'][substream] ?? '?';

// Full temporal target: temporal scaling is removed, so every request asks for all temporal layers.
const FULL_TEMPORAL = 2;

export default class VideoScreenInConnection implements IVideoScreenInConnection {
	peerConn: RTCPeerConnection;

	meetingId: string;

	subscriptionManager?: SubscriptionsManager;

	streamsMap: StreamMap;

	private videoReceivers = new Map<string, { receiver: RTCRtpReceiver; userId: string }>();

	private centralState: CentralDownlinkState = initialCentralState();

	private evalTick = 0;

	// Last substream we actually REQUESTED per feed — de-dupes the per-tick reconcile so we only hit the
	// REST endpoint when a feed's target actually moves (global rung change, a new feed, or a debug cap).
	private lastAppliedRung = new Map<string, number>();

	// Last global target we logged, so a target move is logged once (not per feed).
	private lastLoggedTarget = TOP_RUNG;

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
				this.lastAppliedRung.delete(key);
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
	};

	// Driven by the connection monitor's single 2 s loop. Reads the RAW downlink-loss score, advances the
	// global rung controller, then reconciles EVERY active feed to the global target (one request per feed
	// whose target actually moved). Stateless per feed: we always request the global target and let Janus
	// clamp each feed to what its publisher actually publishes.
	public evaluateQualityTick = (dlScore: number): Promise<void> => {
		this.evalTick += 1;

		const { state, targetRung, changed, signal } = decideDownlink(this.centralState, dlScore);
		this.centralState = state;

		// Desired substream for every feed: the global target, clamped by a manual debug download cap.
		const cap = getDownloadCap();
		const desired = cap !== null ? Math.min(targetRung, cap) : targetRung;

		const store = useStore.getState();
		const am = store.activeMeeting;
		if (am && am.meetingId === this.meetingId) {
			this.videoReceivers.forEach(({ userId }, key) => {
				const mid = this.streamsMap[key]?.mid;
				if (mid == null) return;
				if (this.lastAppliedRung.get(key) === desired) return;
				this.lastAppliedRung.set(key, desired);
				requestVideoQuality(this.meetingId, userId, mid, desired as 0 | 1 | 2, FULL_TEMPORAL).catch(
					() => {}
				);
			});
		}

		if (changed && targetRung !== this.lastLoggedTarget) {
			rtcDebug(
				`[DOWNLINK TARGET] ${heightName(this.lastLoggedTarget)} -> ${heightName(targetRung)} (${signal}, OUR_NETWORK)`
			);
			this.lastLoggedTarget = targetRung;
		}

		return Promise.resolve();
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
		this.videoReceivers.clear();
		this.centralState = initialCentralState();
		this.lastAppliedRung.clear();
		this.lastLoggedTarget = TOP_RUNG;
		delete this.subscriptionManager;
		this.peerConn?.close?.();
	}
}
