/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { PeerConnConfig } from './PeerConnConfig';
import { IVideoOutConnection } from '../../types/network/webRTC/webRTC';
import MeetingsApi from '../apis/MeetingsApi';

export default class VideoOutConnection implements IVideoOutConnection {
	peerConn: RTCPeerConnection;

	meetingId: string;

	localStreamVideoOutTrack: MediaStreamTrack | null;

	rtpSender: RTCRtpSender | null;

	selectedVideoDeviceId: string | undefined;

	constructor(peerConnConfig: PeerConnConfig, meetingId: string, selectedVideoDeviceId?: string) {
		this.peerConn = new RTCPeerConnection(peerConnConfig.getConfig());
		this.localStreamVideoOutTrack = null;
		this.rtpSender = null;
		this.meetingId = meetingId;
		this.peerConn.onnegotiationneeded = this.handleOnNegotiationNeeded;
		this.peerConn.onicecandidate = this.handleOnIceCandidate;
		this.peerConn.onconnectionstatechange = this.handleOnConnectionStateChange;
		this.peerConn.oniceconnectionstatechange = this.handleOnIceConnectionStateChange;
		this.peerConn.onicegatheringstatechange = this.handleOnIceGatheringStateChange;
		this.peerConn.onsignalingstatechange = this.handleOnSignalingStateChange;
		this.selectedVideoDeviceId = selectedVideoDeviceId;
	}

	handleOnNegotiationNeeded: (ev: Event) => void = (ev) => {
		console.log('VideoOut handleOnNegotiationNeeded ', ev);
		this.peerConn.createOffer().then((RTCsessionDesc: any) => {
			if (this.peerConn.signalingState === 'stable') {
				this.peerConn.setLocalDescription(RTCsessionDesc).then((RTCSessionDescInit: any) => {
					this.handleLocalDescriptionSet(RTCSessionDescInit);
				});
			}
		});
	};

	handleOnIceCandidate: (ev: Event) => void = (ev) => {
		console.log('VideoOut handleOnIceCandidate ', ev);
	};

	handleOnConnectionStateChange: (ev: Event) => void = (ev) => {
		console.log('VideoOut handleOnConnectionStateChange ', ev);
	};

	handleOnIceConnectionStateChange: (ev: Event) => void = (ev) => {
		console.log('VideoOut handleOnIceConnectionStateChange ', ev);
		// if (ev.target?.iceConnectionState === 'failed') { // TODO CHECK STATUS IF IS UPDATED IN THE PEERCONN OR IF WE NEED TO USE THIS ONE FROM EVENT
		if (this.peerConn.iceConnectionState === 'failed') {
			this.handleOnNegotiationNeeded(ev);
		}
	};

	handleOnIceGatheringStateChange: (ev: Event) => void = (ev) => {
		console.log('VideoOut handleOnIceGatheringStateChange ', ev);
	};

	handleOnSignalingStateChange: (ev: Event) => void = (ev) => {
		console.log('VideoOut handleOnSignalingStateChange ', ev);
	};

	handleLocalDescriptionSet = (rtcSessionDescription: RTCSessionDescriptionInit): void => {
		// todo send BE the local description offer rtcsdp
		MeetingsApi.createVideoOffer(this.meetingId, rtcSessionDescription).then(() =>
			console.log(rtcSessionDescription)
		);
		/*
		* old flow
		* const meetingAudioOfferParams: IMeetingAudioOfferParams= {
			meeting_id: this._meeting_id,
			rtc_session_description: sessionDescriptionInit,
			type: 'meeting_audio_offer'
		};
		this._apiClient.send(meetingAudioOfferParams);
		* */
	};

	/**
	 * close all tracks and peerConnection
	 */
	closePeerConnection: () => void = () => {
		if (this.rtpSender != null && this.rtpSender.track != null) {
			this.rtpSender.track.stop();
		}
		this.peerConn.close();
	};

	handleRemoteAnswer = ({ remoteAnswer }: { remoteAnswer: any }): void => {
		console.log('handleRemoteAnswer ', remoteAnswer);
		if (this.peerConn.signalingState !== 'have-remote-offer') {
			this.peerConn.setRemoteDescription(remoteAnswer).catch((reason) => console.warn(reason));
		}
	};

	handleOfferCreated = (rtcSessDesc: RTCSessionDescriptionInit): void => {
		if (this.peerConn.signalingState === 'stable' && this.peerConn.localDescription == null) {
			this.peerConn
				.setLocalDescription(rtcSessDesc)
				.then((rtcSessionDescription: any) => {
					this.handleLocalDescriptionSet(rtcSessionDescription);
				})
				.catch((reason) => console.warn(reason));
		}
	};
}
