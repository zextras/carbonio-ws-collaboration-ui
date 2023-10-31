/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { first } from 'lodash';

import { PeerConnConfig } from './PeerConnConfig';
import useStore from '../../store/Store';
import { IBidirectionalConnectionAudioInOut } from '../../types/network/webRTC/webRTC';
import { STREAM_TYPE } from '../../types/store/ActiveMeetingTypes';
import { getAudioStream } from '../../utils/UserMediaManager';
import MeetingsApi from '../apis/MeetingsApi';

export default class BidirectionalConnectionAudioInOut
	// eslint-disable-next-line prettier/prettier
	implements IBidirectionalConnectionAudioInOut {
	peerConn: RTCPeerConnection;

	meetingId: string;

	rtpSender: RTCRtpSender | null;

	selectedAudioDeviceId: string | undefined;

	initialAudioStatus: boolean;

	oscillatorAudioTrack: MediaStreamTrack | undefined;

	constructor(meetingId: string, audioStreamEnabled: boolean, selectedAudioDeviceId?: string) {
		this.peerConn = new RTCPeerConnection(new PeerConnConfig().getConfig());
		this.peerConn.ontrack = this.onTrack;
		this.peerConn.onnegotiationneeded = this.onNegotiationNeeded;
		this.peerConn.oniceconnectionstatechange = this.onIceConnectionStateChange;

		this.meetingId = meetingId;
		this.rtpSender = null;
		this.selectedAudioDeviceId = selectedAudioDeviceId;
		this.initialAudioStatus = audioStreamEnabled;

		const audioCtx: AudioContext = new window.AudioContext();
		const oscillator: OscillatorNode = audioCtx.createOscillator();
		const dst: AudioNode = oscillator.connect(audioCtx.createMediaStreamDestination());
		oscillator.start();
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		const audioTrack = Object.assign(dst.stream.getAudioTracks()[0], { enabled: false });
		const oscillatorAudioTrack: MediaStream = new MediaStream([audioTrack]);
		this.oscillatorAudioTrack = first(oscillatorAudioTrack.getAudioTracks());

		this.updateRemoteStreamAudio();
		this.updateLocalStreamTrack(oscillatorAudioTrack).then(() => {
			if (audioStreamEnabled) {
				getAudioStream(true, true, selectedAudioDeviceId).then((stream) => {
					this.updateLocalStreamTrack(stream).then();
					useStore.getState().setLocalStreams(this.meetingId, STREAM_TYPE.AUDIO, stream);
				});
			}
		});
	}

	// Handle new tracks
	onTrack = (trackEvent: RTCTrackEvent): void => {
		this.oscillatorAudioTrack = trackEvent.track;
		this.updateRemoteStreamAudio();
	};

	// Create SDP offer, set it as local description and send it to the remote peer
	onNegotiationNeeded = (): void => {
		this.peerConn
			.createOffer()
			.then((rtcSessionDesc: RTCSessionDescriptionInit) => {
				if (this.peerConn.signalingState === 'stable') {
					this.peerConn
						.setLocalDescription(rtcSessionDesc)
						.then(() => {
							if (rtcSessionDesc.sdp) {
								MeetingsApi.createAudioOffer(this.meetingId, rtcSessionDesc.sdp).then(() => {
									MeetingsApi.updateAudioStreamStatus(this.meetingId, this.initialAudioStatus);
								});
							}
						})
						.catch((reason) => console.warn(reason));
				}
			})
			.catch((reason) => console.warn('createOffer failed', reason));
	};

	onIceConnectionStateChange = (ev: Event): void => {
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		if (ev.target.iceConnectionState === 'failed') {
			this.onNegotiationNeeded();
		}
	};

	// Handle remote answer to the SDP offer arrived from the signaling channel
	handleRemoteAnswer(remoteAnswer: RTCSessionDescriptionInit): void {
		if (this.peerConn.signalingState !== 'have-remote-offer') {
			const remoteDescription: RTCSessionDescription = new RTCSessionDescription(remoteAnswer);
			this.peerConn.setRemoteDescription(remoteDescription);
		}
	}

	// TODO check its usage
	handleOfferCreated(rtcSessDesc: RTCSessionDescriptionInit): void {
		if (this.peerConn.signalingState === 'stable' && this.peerConn.localDescription == null) {
			this.peerConn
				.setLocalDescription(rtcSessDesc)
				.then(() => {
					if (rtcSessDesc.sdp) {
						MeetingsApi.createAudioOffer(this.meetingId, rtcSessDesc.sdp).then(() => {
							MeetingsApi.updateAudioStreamStatus(this.meetingId, this.initialAudioStatus);
						});
					}
				})
				.catch((reason) => console.warn(reason));
		}
	}

	/**
	 * Stop the old track and add the new one selected to the sender without the need
	 * to perform a new renegotiation due to the switch of resource
	 * @param mediaStreamTrack
	 */
	updateLocalStreamTrack(mediaStreamTrack: MediaStream): Promise<MediaStreamTrack> {
		return new Promise((resolve) => {
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

	updateRemoteStreamAudio(): void {
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
	}

	closeRtpSenderTrack(): void {
		this.rtpSender?.track?.stop();
	}

	closePeerConnection(): void {
		this.closeRtpSenderTrack();
		this.oscillatorAudioTrack?.stop?.();
		this.peerConn?.close?.();
	}
}
