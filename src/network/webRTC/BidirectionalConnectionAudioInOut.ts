/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { first } from 'lodash';
import { gte } from 'semver';

import { PeerConnConfig } from './PeerConnConfig';
import useStore from '../../store/Store';
import { IBidirectionalConnectionAudioInOut } from '../../types/network/webRTC/webRTC';
import { STREAM_TYPE } from '../../types/store/ActiveMeetingTypes';
import { getAudioStream } from '../../utils/UserMediaManager';
import { audioIceRestart, createAudioOffer, updateAudioStreamStatus } from '../apis/MeetingsApi';

export default class BidirectionalConnectionAudioInOut implements IBidirectionalConnectionAudioInOut {
	peerConn: RTCPeerConnection;

	meetingId: string;

	rtpSender: RTCRtpSender | null;

	selectedAudioDeviceId: string | undefined;

	initialAudioStatus: boolean;

	oscillatorAudioTrack: MediaStreamTrack | undefined;

	// Reference to the oscillator placeholder track, never reassigned:
	// used to tell the real microphone track apart from the placeholder
	private readonly placeholderAudioTrack: MediaStreamTrack | undefined;

	// Desired mute state, read when async stream acquisitions resolve
	private muted: boolean;

	constructor(meetingId: string, audioStreamEnabled: boolean, selectedAudioDeviceId?: string) {
		this.peerConn = new RTCPeerConnection(new PeerConnConfig().getConfig());
		this.peerConn.ontrack = this.onTrack;
		this.peerConn.onconnectionstatechange = this.onConnectionStateChange;

		this.meetingId = meetingId;
		this.rtpSender = null;
		this.selectedAudioDeviceId = selectedAudioDeviceId;
		this.initialAudioStatus = audioStreamEnabled;
		this.muted = !audioStreamEnabled;

		const audioCtx: AudioContext = new window.AudioContext();
		const oscillator: OscillatorNode = audioCtx.createOscillator();
		const dst: AudioNode = oscillator.connect(audioCtx.createMediaStreamDestination());
		oscillator.start();
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		const audioTrack = Object.assign(dst.stream.getAudioTracks()[0], { enabled: false });
		const oscillatorAudioTrack: MediaStream = new MediaStream([audioTrack]);
		this.oscillatorAudioTrack = first(oscillatorAudioTrack.getAudioTracks());
		this.placeholderAudioTrack = this.oscillatorAudioTrack;

		this.updateRemoteStreamAudio();
		this.init();
	}

	private init(): void {
		if (!this.oscillatorAudioTrack) return;
		this.updateLocalStreamTrack(new MediaStream([this.oscillatorAudioTrack]))
			.then(() => this.negotiate())
			.then(() =>
				// The stream is acquired even when starting muted, to keep the
				// Bluetooth HFP profile active and avoid the 1-2 second audio gap
				// caused by A2DP ↔ HFP profile switching on unmute
				getAudioStream(this.selectedAudioDeviceId).then((stream) => this.applyAudioStream(stream))
			)
			.catch((reason) => console.warn(reason));
	}

	// Handle new tracks
	onTrack = (trackEvent: RTCTrackEvent): void => {
		this.oscillatorAudioTrack = trackEvent.track;
		this.updateRemoteStreamAudio();
	};

	// Create the SDP offer, set it as local description and send it to the remote peer
	private readonly negotiate = async (): Promise<void> => {
		const offer = await this.peerConn.createOffer();
		if (this.peerConn.signalingState !== 'stable') return;
		await this.peerConn.setLocalDescription(offer);
		if (!offer.sdp) return;
		await createAudioOffer(this.meetingId, offer.sdp);
		// Read the current muted state (not initialAudioStatus) to honor a
		// mute/unmute requested while the negotiation was still in flight
		await updateAudioStreamStatus(this.meetingId, !this.muted);
	};

	private readonly onConnectionStateChange = (): void => {
		const state = this.peerConn?.connectionState;
		if (state === 'failed') {
			this.peerConn
				?.createOffer({ iceRestart: true })
				.then((rtcSessionDesc) => {
					this.peerConn
						?.setLocalDescription(rtcSessionDesc)
						.then(() => {
							const localDesc = this.peerConn?.localDescription;
							const version = useStore.getState().session.apiVersion;
							if (localDesc?.sdp && version && gte(version, '1.6.6')) {
								audioIceRestart(this.meetingId, localDesc.sdp);
							}
						})
						.catch((reason) => console.warn('setLocalDescription failed', reason));
				})
				.catch((reason) => console.warn('createOffer with iceRestart failed', reason));
		}
	};

	// Handle remote answer to the SDP offer arrived from the signaling channel
	handleRemoteAnswer(remoteAnswer: RTCSessionDescriptionInit): void {
		if (this.peerConn.signalingState !== 'have-remote-offer') {
			const remoteDescription: RTCSessionDescription = new RTCSessionDescription(remoteAnswer);
			this.peerConn.setRemoteDescription(remoteDescription);
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

	/**
	 * Replace the sender track with the given microphone stream, applying the
	 * current muted state. The track is disabled before being attached to the
	 * sender so that no audio frame can leak while muted, and the state is read
	 * again once attached to honor a mute/unmute requested during acquisition.
	 */
	private applyAudioStream(stream: MediaStream): Promise<void> {
		const streamTrack = first(stream.getAudioTracks());
		if (streamTrack) {
			streamTrack.enabled = !this.muted;
		}
		return this.updateLocalStreamTrack(stream).then(() => {
			if (streamTrack) {
				streamTrack.enabled = !this.muted;
			}
			useStore.getState().setLocalStreams(STREAM_TYPE.AUDIO, stream);
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

	/**
	 * Mute the audio track by disabling it instead of stopping it.
	 * This keeps the Bluetooth HFP profile active, avoiding the 1-2 second
	 * audio gap caused by A2DP ↔ HFP profile switching.
	 */
	muteAudioTrack(): void {
		// The flag is set unconditionally so that an acquisition still in
		// flight (e.g. init()) picks up the muted state when it resolves
		this.muted = true;
		if (this.rtpSender?.track) {
			this.rtpSender.track.enabled = false;
		}
	}

	/**
	 * Unmute the audio track by re-enabling it if still alive,
	 * or acquiring a new stream if the sender track is missing, ended or
	 * still the oscillator placeholder (microphone never acquired yet).
	 */
	async unmuteAudioTrack(deviceId?: string): Promise<void> {
		this.muted = false;
		const track = this.rtpSender?.track;
		if (track && track !== this.placeholderAudioTrack && track.readyState === 'live') {
			track.enabled = true;
		} else {
			// A concurrent acquisition (e.g. init() still in flight) is harmless:
			// updateLocalStreamTrack always stops the previous sender track
			try {
				const stream = await getAudioStream(deviceId ?? this.selectedAudioDeviceId);
				await this.applyAudioStream(stream);
				if (deviceId) {
					this.selectedAudioDeviceId = deviceId;
				}
			} catch (reason) {
				this.muted = true;
				throw reason;
			}
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
