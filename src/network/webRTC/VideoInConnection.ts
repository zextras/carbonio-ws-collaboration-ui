/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { PeerConnConfig } from './PeerConnConfig';
import useStore from '../../store/Store';
import { IVideoInConnection } from '../../types/network/webRTC/webRTC';
import { STREAM_TYPE } from '../../types/store/ActiveMeetingTypes';
import { MeetingsApi } from '../index';

export default class VideoInConnection implements IVideoInConnection {
	peerConn: RTCPeerConnection;

	meetingId: string;

	constructor(meetingId: string) {
		this.peerConn = new RTCPeerConnection(new PeerConnConfig().getConfig());
		this.peerConn.ontrack = this.onTrack;
		this.meetingId = meetingId;
	}

	// Handle new tracks
	onTrack = (ev: RTCTrackEvent): void => {
		console.log('VIDEOIN onTrack event', ev);
		// TODO: check if this is the right way to handle the stream
		useStore
			.getState()
			.setSubscribedTrack(this.meetingId, 'userId', ev.streams[0], STREAM_TYPE.VIDEO);
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
	}
}
