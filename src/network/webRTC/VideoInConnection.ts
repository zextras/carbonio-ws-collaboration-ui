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

	streamsMap: { user_id: string; type: STREAM_TYPE; mid: string }[];

	constructor(meetingId: string) {
		this.peerConn = new RTCPeerConnection(new PeerConnConfig().getConfig());
		this.peerConn.ontrack = this.onTrack;
		this.meetingId = meetingId;
		this.subscriptionManager = new SubscriptionsManager(meetingId);
		this.streamsMap = [];
		console.log('IN | Open to receive video...');
	}

	onTrack = (ev: RTCTrackEvent): void => {
		console.log('IN | ...onTrack', ev);
		this.updateStreams();
	};

	// Handle remote offer creating an answer and sending it to the remote peer
	handleRemoteOffer(sdp: string): void {
		console.log('IN | ...handleRemoteOffer');
		const offer = new RTCSessionDescription({ sdp, type: 'offer' });
		console.log('IN | ...setRemoteDescription');
		this.peerConn
			.setRemoteDescription(offer)
			.then(() => {
				this.peerConn
					.createAnswer()
					.then((rtcSessionDesc: RTCSessionDescriptionInit) => {
						console.log('IN | ...setLocalDescription');
						this.peerConn
							.setLocalDescription(rtcSessionDesc)
							.then(() => {
								if (rtcSessionDesc.sdp) {
									console.log('IN | ...createMediaAnswer');
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

	handleParticipantsSubscribed(
		streamsMap: { user_id: string; type: STREAM_TYPE; mid: string }[]
	): void {
		console.log('IN | ...handleParticipantsSubscribed');
		this.streamsMap = [...streamsMap];
		this.updateStreams();
	}

	private updateStreams(): void {
		const transceiversArray: RTCRtpTransceiver[] = this.peerConn.getTransceivers();
		const mappedByMidTransceivers = keyBy(transceiversArray, (o) => o.mid);

		console.log('IN | ...streamsMap:', this.streamsMap);
		console.log('IN | ...transceivers:', mappedByMidTransceivers);

		if (this.streamsMap.length === transceiversArray.length) {
			const newStreams: StreamsSubscriptionMap = {};
			forEach(this.streamsMap, (stream) => {
				const streamsKey = `${stream.user_id}-${stream.type.toLowerCase()}`;
				const transceivers: any = mappedByMidTransceivers[stream.mid]; // TODO fix type
				const tracks = transceivers ? [transceivers.receiver.track] : [];
				newStreams[streamsKey] = {
					userId: stream.user_id,
					type: stream.type.toLowerCase() as STREAM_TYPE,
					stream: new MediaStream(tracks)
				};
			});
			useStore.getState().setSubscribedTracks(this.meetingId, newStreams);
		}
	}

	closePeerConnection(): void {
		console.log('IN | ...closePeerConnection');
		this.peerConn?.close?.();
		this.subscriptionManager.clean();
	}
}
