/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { forEach, keyBy } from 'lodash';

import { PeerConnConfig } from './PeerConnConfig';
import SubscriptionsManager from './SubscriptionsManager';
import useStore from '../../store/Store';
import { IVideoInConnection } from '../../types/network/webRTC/webRTC';
import { STREAM_TYPE, StreamsSubscriptionMap } from '../../types/store/ActiveMeetingTypes';
import { MeetingsApi } from '../index';

export default class VideoInConnection implements IVideoInConnection {
	peerConn: RTCPeerConnection;

	meetingId: string;

	subscriptionManager: SubscriptionsManager;

	answerSdp: string | undefined;

	streamsMap: { user_id: string; type: STREAM_TYPE }[];

	constructor(meetingId: string) {
		this.peerConn = new RTCPeerConnection(new PeerConnConfig().getConfig());
		this.peerConn.ontrack = this.onTrack;
		this.meetingId = meetingId;
		this.subscriptionManager = new SubscriptionsManager(meetingId);
		this.streamsMap = [];
	}

	onTrack = (ev: RTCTrackEvent): void => {
		console.log('onTrack', ev);
		// this.updateStreams();
	};

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
										this.answerSdp = rtcSessionDesc.sdp;
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

	handleParticipantsSubscribed(streamsMap: { user_id: string; type: STREAM_TYPE }[]): void {
		console.log('handleParticipantsSubscribed', streamsMap);
		this.streamsMap = [...streamsMap];
		this.updateStreams();
	}

	private updateStreams(): void {
		const transceiversArray: RTCRtpTransceiver[] = this.peerConn.getTransceivers();
		const mappedByMidTransceivers = keyBy(transceiversArray, (o) => o.mid);

		console.log('streamsMap', this.streamsMap);
		console.log('transceivers', mappedByMidTransceivers);

		const newStreams: StreamsSubscriptionMap = {};
		forEach(this.streamsMap, (stream, key) => {
			const streamsKey = `${stream.user_id}-${stream.type.toLowerCase()}`;
			const transceivers: any = mappedByMidTransceivers[key]; // TODO fix type
			const tracks = transceivers ? [transceivers.receiver.track] : [];
			newStreams[streamsKey] = {
				userId: stream.user_id,
				type: stream.type.toLowerCase() as STREAM_TYPE,
				stream: new MediaStream(tracks)
			};
		});
		useStore.getState().setSubscribedTracks(this.meetingId, newStreams);
	}

	closePeerConnection(): void {
		this.peerConn?.close?.();
		this.subscriptionManager.clean();
	}
}
