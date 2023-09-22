/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { PeerConnConfig } from './PeerConnConfig';
import useStore from '../../store/Store';
import { IScreenOutConnection } from '../../types/network/webRTC/webRTC';
import { STREAM_TYPE } from '../../types/store/ActiveMeetingTypes';
import { getScreenStream } from '../../utils/UserMediaManager';
import MeetingsApi from '../apis/MeetingsApi';

export default class ScreenOutConnection implements IScreenOutConnection {
	meetingId: string;

	peerConn: RTCPeerConnection | null;

	rtpSender: RTCRtpSender | null;

	constructor(meetingId: string) {
		this.meetingId = meetingId;
		this.peerConn = null;
		this.rtpSender = null;
	}

	private createPeerConnection(): void {
		this.peerConn = new RTCPeerConnection(new PeerConnConfig().getConfig());
		this.peerConn.onnegotiationneeded = this.onNegotiationNeeded;
		this.peerConn.oniceconnectionstatechange = this.onIceConnectionStateChange;
	}

	// Create SDP offer, set it as local description and send it to the remote peer
	private onNegotiationNeeded = (): void => {
		if (this.peerConn) {
			this.peerConn
				.createOffer()
				.then((rtcSessionDesc: RTCSessionDescriptionInit) => {
					if (this.peerConn?.signalingState === 'stable') {
						this.peerConn
							.setLocalDescription(rtcSessionDesc)
							.then(() => {
								MeetingsApi.updateMediaOffer(
									this.meetingId,
									STREAM_TYPE.SCREEN,
									true,
									rtcSessionDesc.sdp
								);
							})
							.catch((reason) => console.warn(reason));
					}
				})
				.catch((reason) => console.warn('createOffer failed', reason));
		}
	};

	private onIceConnectionStateChange = (ev: Event): void => {
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		if (ev.target.iceConnectionState === 'failed') {
			this.onNegotiationNeeded();
		}
	};

	// Handle remote answer to the SDP offer arrived from the signaling channel
	handleRemoteAnswer(remoteAnswer: RTCSessionDescriptionInit): void {
		if (this.peerConn?.signalingState !== 'have-remote-offer') {
			const remoteDescription: RTCSessionDescription = new RTCSessionDescription(remoteAnswer);
			this.peerConn?.setRemoteDescription(remoteDescription);
		}
	}

	updateLocalStreamTrack(mediaStreamTrack: MediaStream): Promise<MediaStreamTrack> {
		return new Promise((resolve) => {
			const videoTrack: MediaStreamTrack = mediaStreamTrack.getVideoTracks()[0];
			if (this.peerConn) {
				if (this.rtpSender == null) {
					this.rtpSender = this.peerConn.addTrack(
						videoTrack,
						mediaStreamTrack ?? new MediaStream()
					);
				} else if (this.rtpSender?.track) {
					this.rtpSender.track.stop();
					this.rtpSender.replaceTrack(videoTrack).catch((reason) => console.warn(reason));
				}
			}
			videoTrack.onended = (): void => this.stopScreenShare();
			resolve(videoTrack);
		});
	}

	startScreenShare(): void {
		this.createPeerConnection();
		getScreenStream().then((stream) => {
			this.updateLocalStreamTrack(stream).then(() => {
				useStore.getState().setLocalStreams(this.meetingId, STREAM_TYPE.SCREEN, stream);
			});
		});
	}

	stopScreenShare(): void {
		MeetingsApi.updateMediaOffer(this.meetingId, STREAM_TYPE.SCREEN, false).then(() => {
			this.closePeerConnection();
			useStore.getState().removeLocalStreams(this.meetingId, STREAM_TYPE.SCREEN);
		});
	}

	closePeerConnection(): void {
		this.rtpSender?.track?.stop();
		this.peerConn?.close();
		this.peerConn = null;
		this.rtpSender = null;
	}
}
