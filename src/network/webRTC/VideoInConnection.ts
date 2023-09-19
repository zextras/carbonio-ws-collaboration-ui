/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { forEach } from 'lodash';

import { PeerConnConfig } from './PeerConnConfig';
import SubscriptionsManager from './SubscriptionsManager';
import useStore from '../../store/Store';
import { IVideoInConnection } from '../../types/network/webRTC/webRTC';
import { STREAM_TYPE, StreamsSubscriptionMap } from '../../types/store/ActiveMeetingTypes';
import { MeetingsApi } from '../index';

export default class VideoInConnection implements IVideoInConnection {
	peerConn: RTCPeerConnection;

	meetingId: string;

	streams: MediaStream[] = [];

	subscriptionManager: SubscriptionsManager;

	constructor(meetingId: string) {
		this.peerConn = new RTCPeerConnection(new PeerConnConfig().getConfig());
		this.peerConn.ontrack = this.onTrack;
		this.meetingId = meetingId;
		this.streams = [];
		this.subscriptionManager = new SubscriptionsManager(meetingId);
	}

	// Handle new tracks
	onTrack = (ev: RTCTrackEvent): void => {
		this.streams = [...ev.streams];
	};

	handleStreams(streamsMap: { user_id: string; type: STREAM_TYPE }[]): void {
		const newStreams: StreamsSubscriptionMap = {};
		forEach(streamsMap, (stream, key) => {
			const streamsKey = `${stream.user_id}-${stream.type.toLowerCase()}`;
			newStreams[streamsKey] = {
				userId: stream.user_id,
				type: stream.type.toLowerCase() as STREAM_TYPE,
				stream: this.streams[key]
			};
		});
		useStore.getState().setSubscribedTracks(this.meetingId, newStreams);
	}

	// Handle remote offer creating an answer and sending it to the remote peer
	handleRemoteOffer(sdp: string): void {
		if (this.peerConn.signalingState !== 'have-remote-offer') {
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
	}

	closePeerConnection(): void {
		this.peerConn?.close?.();
		this.subscriptionManager.clean();
	}
}
