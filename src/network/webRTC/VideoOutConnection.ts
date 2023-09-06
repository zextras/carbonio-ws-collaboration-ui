/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { PeerConnConfig } from './PeerConnConfig';
import useStore from '../../store/Store';
import { IVideoOutConnection } from '../../types/network/webRTC/webRTC';
import { STREAM_TYPE } from '../../types/store/ActiveMeetingTypes';
import { getVideoStream } from '../../utils/UserMediaManager';
import MeetingsApi from '../apis/MeetingsApi';

export default class VideoOutConnection implements IVideoOutConnection {
	peerConn: RTCPeerConnection;

	meetingId: string;

	rtpSender: RTCRtpSender | null;

	localStreamVideoOutTrack: MediaStreamTrack | null;

	selectedVideoDeviceId: string | undefined;

	constructor(meetingId: string, videoStreamEnabled: boolean, selectedVideoDeviceId?: string) {
		this.peerConn = new RTCPeerConnection(new PeerConnConfig().getConfig());
		this.peerConn.onnegotiationneeded = this.handleOnNegotiationNeeded;
		this.peerConn.oniceconnectionstatechange = this.handleOnIceConnectionStateChange;
		// this.peerConn.onicecandidate = this.handleOnIceCandidate;
		// this.peerConn.onconnectionstatechange = this.handleOnConnectionStateChange;
		// this.peerConn.onicegatheringstatechange = this.handleOnIceGatheringStateChange;
		// this.peerConn.onsignalingstatechange = this.handleOnSignalingStateChange;

		this.meetingId = meetingId;
		this.rtpSender = null;

		this.localStreamVideoOutTrack = null;

		this.selectedVideoDeviceId = selectedVideoDeviceId;

		if (videoStreamEnabled) {
			getVideoStream(selectedVideoDeviceId).then((stream) => {
				this.updateLocalStreamTrack(stream).then();
				useStore.getState().setLocalStreams(this.meetingId, STREAM_TYPE.VIDEO, stream);
			});
		}
	}

	handleOnNegotiationNeeded: (ev: Event) => void = () => {
		this.peerConn.createOffer().then((RTCsessionDesc: any) => {
			if (this.peerConn.signalingState === 'stable') {
				this.peerConn
					.setLocalDescription(RTCsessionDesc)
					.then(() => this.handleLocalDescriptionSet(RTCsessionDesc));
			}
		});
	};

	handleOnIceConnectionStateChange: (ev: Event) => void = (ev) => {
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		if (ev.target.iceConnectionState === 'failed') {
			this.handleOnNegotiationNeeded(ev);
		}
	};

	handleLocalDescriptionSet = (
		rtcSessionDescription: void | RTCSessionDescriptionInit
	): void | RTCSessionDescriptionInit => {
		if (rtcSessionDescription && rtcSessionDescription.sdp) {
			MeetingsApi.updateMediaOffer(
				this.meetingId,
				STREAM_TYPE.VIDEO,
				true,
				rtcSessionDescription.sdp
			).then();
		}
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

	handleRemoteAnswer = (remoteAnswer: RTCSessionDescriptionInit): void => {
		if (this.peerConn.signalingState !== 'have-remote-offer') {
			this.peerConn.setRemoteDescription(remoteAnswer).catch((reason) => console.warn(reason));
		}
	};

	handleOfferCreated = (rtcSessDesc: RTCSessionDescriptionInit): void => {
		if (this.peerConn.signalingState === 'stable' && this.peerConn.localDescription == null) {
			this.peerConn
				.setLocalDescription(rtcSessDesc)
				.then((rtcSessionDescription: void) => {
					this.handleLocalDescriptionSet(rtcSessionDescription);
				})
				.catch((reason) => console.warn(reason));
		}
	};

	closeRtpSenderTrack: () => void = () => {
		this.rtpSender?.track?.stop();
	};

	/**
	 * Stop the old track and add the new one selected to the sender without the need
	 * to perform a new renegotiation due to the switch of resource
	 * @param mediaStreamTrack
	 */
	updateLocalStreamTrack = (mediaStreamTrack: MediaStream): Promise<MediaStreamTrack> =>
		new Promise((resolve) => {
			const videoTrack: MediaStreamTrack = mediaStreamTrack.getVideoTracks()[0];
			if (this.rtpSender == null) {
				this.rtpSender = this.peerConn.addTrack(videoTrack, mediaStreamTrack ?? new MediaStream());
			} else if (this.rtpSender?.track) {
				this.rtpSender.track.stop();
				this.rtpSender.replaceTrack(videoTrack).catch((reason) => console.warn(reason));
			}
			resolve(videoTrack);
		});
}
