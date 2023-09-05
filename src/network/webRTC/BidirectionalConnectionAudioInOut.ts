/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
/* eslint-disable no-param-reassign */

import { first } from 'lodash';

import { PeerConnConfig } from './PeerConnConfig';
import { IBidirectionalConnectionAudioInOut } from '../../types/network/webRTC/webRTC';
import { getAudioStream } from '../../utils/UserMediaManager';
import MeetingsApi from '../apis/MeetingsApi';

export default class BidirectionalConnectionAudioInOut
	implements IBidirectionalConnectionAudioInOut
{
	meetingId: string;

	rtpSender: RTCRtpSender | null;

	peerConn: RTCPeerConnection;

	oscillatorAudioTrack: MediaStreamTrack | undefined;

	constructor(meetingId: string, audioStreamEnabled: boolean, selectedAudioDeviceId?: string) {
		this.meetingId = meetingId;
		this.rtpSender = null;

		this.peerConn = new RTCPeerConnection(new PeerConnConfig().getConfig());
		this.peerConn.ontrack = this.handleOnTrack;
		this.peerConn.onnegotiationneeded = this.handleOnNegotiationNeeded;
		this.peerConn.oniceconnectionstatechange = this.handleOnIceConnectionStateChange;
		// this.peerConn.onicecandidate = this.handleOnIceCandidate;
		// this.peerConn.onconnectionstatechange = this.handleOnConnectionStateChange;
		// this.peerConn.onicegatheringstatechange = this.handleOnIceGatheringStateChange;
		// this.peerConn.onsignalingstatechange = this.handleOnSignalingStateChange;

		const audioCtx = new window.AudioContext();
		const oscillator = audioCtx.createOscillator();
		const dst = oscillator.connect(audioCtx.createMediaStreamDestination());
		oscillator.start();
		const oscillatorAudioTrack = new MediaStream([
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			Object.assign(dst.stream.getAudioTracks()[0], { enabled: false })
		]);

		this.oscillatorAudioTrack = first(oscillatorAudioTrack.getAudioTracks());
		this.updateRemoteStreamAudio();
		this.updateLocalStreamTrack(oscillatorAudioTrack).then(() => {
			if (audioStreamEnabled) {
				getAudioStream(true, true, selectedAudioDeviceId).then((stream) => {
					this.updateLocalStreamTrack(stream).then();
				});
			}
		});
	}

	handleOnTrack = (trackEvent: RTCTrackEvent): void => {
		this.oscillatorAudioTrack = trackEvent.track;
		this.updateRemoteStreamAudio();
	};

	handleOnNegotiationNeeded: (ev: Event) => void = (/* ev */) => {
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
			MeetingsApi.createAudioOffer(this.meetingId, rtcSessionDescription.sdp).then();
		}
	};

	/**
	 * close all tracks and the peerConnection
	 */
	closePeerConnection: () => void = () => {
		this.rtpSender?.track?.stop();
		this.oscillatorAudioTrack?.stop?.();
		this.peerConn?.close?.();
	};

	closeRtpSenderTrack: () => void = () => {
		this.rtpSender?.track?.stop();
	};

	updateRemoteStreamAudio: () => void = () => {
		if (this.oscillatorAudioTrack != null) {
			const fragment = window!.top!.document.createDocumentFragment();
			const audio = window!.top!.document.createElement('audio');
			audio.autoplay = true;
			audio.muted = false;
			audio.controls = false;
			audio.id = 'bidirectionalAudioMeeting';
			fragment.appendChild(audio);
			const mediaStream = new MediaStream();
			mediaStream.addTrack(this.oscillatorAudioTrack);
			audio.srcObject = mediaStream;
		}
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

	/**
	 * Stop the old track and add the new one selected to the sender without the need
	 * to perform a new renegotiation due to the switch of resource
	 * @param mediaStreamTrack
	 */
	updateLocalStreamTrack = (mediaStreamTrack: MediaStream): Promise<MediaStreamTrack> =>
		new Promise((resolve) => {
			const audioTrack: MediaStreamTrack = mediaStreamTrack.getAudioTracks()[0];
			if (this.rtpSender == null) {
				this.rtpSender = this.peerConn.addTrack(audioTrack, mediaStreamTrack ?? new MediaStream());
			} else if (this.rtpSender.track) {
				this.rtpSender.track.stop();
				this.rtpSender.replaceTrack(audioTrack).catch((reason) => console.warn(reason));
			}
			this.oscillatorAudioTrack = audioTrack;
			resolve(audioTrack);
		});
}
