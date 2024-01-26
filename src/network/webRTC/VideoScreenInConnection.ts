/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { filter, forEach, keyBy } from 'lodash';

import { PeerConnConfig } from './PeerConnConfig';
import SubscriptionsManager from './SubscriptionsManager';
import useStore from '../../store/Store';
import { StreamInfo, StreamMap } from '../../types/network/models/meetingBeTypes';
import { IVideoScreenInConnection } from '../../types/network/webRTC/webRTC';
import { STREAM_TYPE, StreamsSubscriptionMap } from '../../types/store/ActiveMeetingTypes';
import { MeetingsApi } from '../index';

export default class VideoScreenInConnection implements IVideoScreenInConnection {
	peerConn: RTCPeerConnection;

	meetingId: string;

	subscriptionManager: SubscriptionsManager;

	streamsMap: StreamMap;

	constructor(meetingId: string) {
		this.peerConn = new RTCPeerConnection(new PeerConnConfig().getConfig());
		this.peerConn.ontrack = this.onTrack;
		this.meetingId = meetingId;
		this.subscriptionManager = new SubscriptionsManager(meetingId);
		this.streamsMap = {};
	}

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
									MeetingsApi.createMediaAnswer(this.meetingId, rtcSessionDesc.sdp);
								}
							})
							.catch((reason) => console.warn('setLocalDescription failed', reason));
					})
					.catch((reason) => console.warn('createAnswer failed', reason));
			})
			.catch((reason) => console.warn('setRemoteDescription failed', reason));
	}

	public handleParticipantsSubscribed(streamsMap: StreamInfo[]): void {
		forEach(streamsMap, (stream) => {
			const streamsKey = `${stream.userId}-${stream.type.toLowerCase()}`;
			this.streamsMap[streamsKey] = {
				...this.streamsMap[streamsKey],
				userId: stream.userId,
				type: stream.type.toLowerCase() as STREAM_TYPE
			};
		});
		this.updateStreams();
	}

	public removeStream = (streamKey: string): void => {
		forEach(this.streamsMap, () => {
			delete this.streamsMap[`${streamKey}-${STREAM_TYPE.VIDEO}`];
			delete this.streamsMap[`${streamKey}-${STREAM_TYPE.SCREEN}`];
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
			}
		});
		this.updateStreams();
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
		this.peerConn?.close?.();
		this.subscriptionManager.clean();
	}
}
