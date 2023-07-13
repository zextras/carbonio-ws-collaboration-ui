/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
/* eslint-disable no-param-reassign */

import { size } from 'lodash';

import { PeerConnConfig } from './PeerConnConfig';
import { IBidirectionalConnectionAudioInOut } from '../../types/network/webRTC/webRTC';
import MeetingsApi from '../apis/MeetingsApi';

export default class BidirectionalConnectionAudioInOut
	implements IBidirectionalConnectionAudioInOut
{
	peerConn: RTCPeerConnection;

	meetingId: string;

	localStreamAudioTrack: MediaStreamTrack | null;

	oscillatorAudioTrack: MediaStreamTrack | null;

	rtpSender: RTCRtpSender | null;

	constructor(peerConnConfig: PeerConnConfig, meetingId: string) {
		this.peerConn = new RTCPeerConnection(peerConnConfig.getConfig());
		this.localStreamAudioTrack = null;
		this.rtpSender = null;
		this.meetingId = meetingId;
		this.peerConn.ontrack = this.handleOnTrack;
		this.peerConn.onnegotiationneeded = this.handleOnNegotiationNeeded;
		this.peerConn.onicecandidate = this.handleOnIceCandidate;
		this.peerConn.onconnectionstatechange = this.handleOnConnectionStateChange;
		this.peerConn.oniceconnectionstatechange = this.handleOnIceConnectionStateChange;
		this.peerConn.onicegatheringstatechange = this.handleOnIceGatheringStateChange;
		this.peerConn.onsignalingstatechange = this.handleOnSignalingStateChange;

		const audioCtx = new window.AudioContext();
		const oscillator = audioCtx.createOscillator();
		const dst = oscillator.connect(audioCtx.createMediaStreamDestination());
		oscillator.start();
		const oscillatorAudioTrack = new MediaStream([
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			Object.assign(dst.stream.getAudioTracks()[0], { enabled: false })
		]);
		// eslint-disable-next-line prefer-destructuring
		this.oscillatorAudioTrack = oscillatorAudioTrack.getAudioTracks()[0];
	}

	handleOnTrack = (trackEvent: RTCTrackEvent): void => {
		console.log('AudioInOut ontrack', trackEvent);

		trackEvent.track.addEventListener('onmute', (ev) => this.handleOnMuteTrack(ev));
		trackEvent.track.addEventListener('onunmute', (ev) => this.handleOnUnMuteTrack(ev));
		trackEvent.track.addEventListener('onended', (ev) => this.handleOnRemoveTrack(ev));
		// trackEvent.track.onmute = this.handleOnMuteTrack;
		// trackEvent.track.onunmute = this.handleOnUnMuteTrack;
		// trackEvent.track.onended = this.handleOnRemoveTrack;

		this.oscillatorAudioTrack = trackEvent.track;
		this.updateRemoteStreamAudio();
	};

	handleOnMuteTrack = (trackEvent: Event): void => {
		console.log('AudioInOut mute', trackEvent);
		// never used
		this.oscillatorAudioTrack = null;
	};

	handleOnUnMuteTrack = (trackEvent: Event): void => {
		console.log('AudioInOut unmute', trackEvent);
		// used only when entering the meeting the first time and when I create the local track audio
		this.oscillatorAudioTrack = trackEvent.target as MediaStreamTrack;
	};

	handleOnRemoveTrack = (trackEvent: Event): void => {
		console.log('AudioInOut remove track', trackEvent);
		// usato quando esco dal meeting
		this.oscillatorAudioTrack = null;
	};

	handleOnNegotiationNeeded: (ev: Event) => void = (ev) => {
		console.log('AudioInOut handleOnNegotiationNeeded ', ev);
		this.peerConn.createOffer().then((RTCsessionDesc: any) => {
			if (this.peerConn.signalingState === 'stable') {
				this.peerConn.setLocalDescription(RTCsessionDesc).then((RTCSessionDescInit: any) => {
					this.handleLocalDescriptionSet(RTCSessionDescInit);
				});
			}
		});
	};

	handleOnIceCandidate: (ev: Event) => void = (ev) => {
		console.log('AudioInOut handleOnIceCandidate ', ev);
	};

	handleOnConnectionStateChange: (ev: Event) => void = (ev) => {
		console.log('AudioInOut handleOnConnectionStateChange ', ev);
	};

	handleOnIceConnectionStateChange: (ev: Event) => void = (ev) => {
		console.log('AudioInOut handleOnIceConnectionStateChange ', ev);
		// if (ev.target?.iceConnectionState === 'failed') { // TODO CHECK STATUS IF IS UPDATED IN THE PEERCONN OR IF WE NEED TO USE THIS ONE FROM EVENT
		if (this.peerConn.iceConnectionState === 'failed') {
			this.handleOnNegotiationNeeded(ev);
		}
	};

	handleOnIceGatheringStateChange: (ev: Event) => void = (ev) => {
		console.log('AudioInOut handleOnIceGatheringStateChange ', ev);
	};

	handleOnSignalingStateChange: (ev: Event) => void = (ev) => {
		console.log('AudioInOut handleOnSignalingStateChange ', ev);
	};

	handleLocalDescriptionSet = (rtcSessionDescription: RTCSessionDescriptionInit): void => {
		// todo send BE the local description offer rtcsdp
		MeetingsApi.createAudioOffer(this.meetingId, rtcSessionDescription);
		console.log(rtcSessionDescription);
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

	updateRemoteStreamAudio: () => void = () => {
		if (this.oscillatorAudioTrack != null && size(this.oscillatorAudioTrack) === 1) {
			console.log('setting remote audio');
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

	// chiamabile quando si aggiorna sia l'oscillator sia la track normale
	updateLocalStreamTrack = (mediaStreamTrack: MediaStream, type: 'oscillator' | 'local'): void => {
		const audioTrack: MediaStreamTrack = mediaStreamTrack.getAudioTracks()[0];
		if (this.rtpSender == null) {
			this.rtpSender = this.peerConn.addTrack(
				audioTrack.clone(),
				mediaStreamTrack ?? new MediaStream()
			);
		} else if (this.rtpSender?.track) {
			console.log('simply replace track if not the same', this.rtpSender);
			if (this.rtpSender.track.id !== audioTrack.id) {
				this.rtpSender.track.stop();
				this.rtpSender
					.replaceTrack(audioTrack.clone())
					.then(() => console.log('track replaced'))
					.catch((reason) => console.warn(reason));
			}
		}
		if (type === 'oscillator') {
			this.oscillatorAudioTrack = audioTrack;
		} else if (type === 'local') {
			this.localStreamAudioTrack = audioTrack;
		}
	};
}
