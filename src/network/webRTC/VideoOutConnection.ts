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
	peerConn: RTCPeerConnection | null;

	meetingId: string;

	rtpSender: RTCRtpSender | null;

	selectedVideoDeviceId: string | undefined;

	constructor(meetingId: string, videoStreamEnabled: boolean, selectedVideoDeviceId?: string) {
		this.peerConn = null;
		this.meetingId = meetingId;
		this.rtpSender = null;

		if (videoStreamEnabled) {
			this.startVideo(selectedVideoDeviceId);
		}
	}

	startVideo(selectedVideoDeviceId?: string): void {
		console.log("OUT Start you're Video...");
		this.peerConn = new RTCPeerConnection(new PeerConnConfig().getConfig());
		this.peerConn.onnegotiationneeded = this.onNegotiationNeeded;
		this.peerConn.oniceconnectionstatechange = this.onIceConnectionStateChange;
		if (selectedVideoDeviceId) {
			this.selectedVideoDeviceId = selectedVideoDeviceId;
		}

		console.log('OUT ...getVideoStream');
		getVideoStream(selectedVideoDeviceId).then((stream) => {
			this.updateLocalStreamTrack(stream).then();
			useStore.getState().setLocalStreams(this.meetingId, STREAM_TYPE.VIDEO, stream);
		});
	}

	stopVideo(): void {
		this.closePeerConnection();
		MeetingsApi.updateMediaOffer(this.meetingId, STREAM_TYPE.VIDEO, false);
	}

	// Create SDP offer, set it as local description and send it to the remote peer
	onNegotiationNeeded = (): void => {
		console.log('OUT ...onNegotiationNeeded');
		if (this.peerConn) {
			this.peerConn
				.createOffer()
				.then((rtcSessionDesc: RTCSessionDescriptionInit) => {
					if (this.peerConn?.signalingState === 'stable') {
						console.log('OUT ...setLocalDescription');
						this.peerConn
							.setLocalDescription(rtcSessionDesc)
							.then(() => {
								console.log('OUT ...send updateMediaOffer');
								MeetingsApi.updateMediaOffer(
									this.meetingId,
									STREAM_TYPE.VIDEO,
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

	onIceConnectionStateChange = (ev: Event): void => {
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

	handleOfferCreated(rtcSessDesc: RTCSessionDescriptionInit): void {
		if (this.peerConn?.signalingState === 'stable' && this.peerConn.localDescription == null) {
			this.peerConn
				.setLocalDescription(rtcSessDesc)
				.then(() =>
					MeetingsApi.updateMediaOffer(this.meetingId, STREAM_TYPE.VIDEO, true, rtcSessDesc.sdp)
				)
				.catch((reason) => console.warn('setLocalDescription failed', reason));
		}
	}

	// Stop the old track and add the new one without a new renegotiation
	updateLocalStreamTrack(mediaStreamTrack: MediaStream): Promise<MediaStreamTrack> {
		return new Promise((resolve) => {
			const videoTrack: MediaStreamTrack = mediaStreamTrack.getVideoTracks()[0];
			if (this.peerConn) {
				if (this.rtpSender == null) {
					this.rtpSender = this.peerConn?.addTrack(
						videoTrack,
						mediaStreamTrack ?? new MediaStream()
					);
				} else if (this.rtpSender?.track) {
					this.rtpSender.track.stop();
					this.rtpSender.replaceTrack(videoTrack).catch((reason) => console.warn(reason));
				}
			}
			resolve(videoTrack);
		});
	}

	closeRtpSenderTrack(): void {
		this.rtpSender?.track?.stop();
		this.rtpSender = null;
	}

	closePeerConnection(): void {
		this.closeRtpSenderTrack();
		this.peerConn?.close();
	}
}
