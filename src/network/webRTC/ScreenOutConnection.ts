/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { gte } from 'semver';

import { PeerConnConfig } from './PeerConnConfig';
import useStore from '../../store/Store';
import { IScreenOutConnection } from '../../types/network/webRTC/webRTC';
import { STREAM_TYPE } from '../../types/store/ActiveMeetingTypes';
import { getScreenStream } from '../../utils/UserMediaManager';
import { updateMediaOffer, screenIceRestart } from '../apis/MeetingsApi';

export default class ScreenOutConnection implements IScreenOutConnection {
	peerConn: RTCPeerConnection | null;

	meetingId: string;

	rtpSender: RTCRtpSender | null;

	constructor(meetingId: string) {
		this.peerConn = null;
		this.meetingId = meetingId;
		this.rtpSender = null;
	}

	// Create SDP offer, set it as local description and send it to the remote peer
	private readonly onNegotiationNeeded = (): void => {
		this.peerConn
			?.createOffer()
			.then((rtcSessionDesc: RTCSessionDescriptionInit) => {
				if (this.peerConn?.signalingState === 'stable') {
					this.peerConn
						.setLocalDescription(rtcSessionDesc)
						.then(() => {
							updateMediaOffer(this.meetingId, STREAM_TYPE.SCREEN, true, rtcSessionDesc.sdp);
						})
						.catch((reason) => console.warn(reason));
				}
			})
			.catch((reason) => console.warn('createOffer failed', reason));
	};

	private updateLocalStreamTrack(mediaStreamTrack: MediaStream): Promise<MediaStreamTrack> {
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

	public startScreenShare(): void {
		this.peerConn = new RTCPeerConnection(new PeerConnConfig().getConfig());
		this.peerConn.onnegotiationneeded = this.onNegotiationNeeded;
		this.peerConn.onconnectionstatechange = this.onConnectionStateChange;

		getScreenStream().then((stream) => {
			this.updateLocalStreamTrack(stream);
			useStore.getState().setLocalStreams(STREAM_TYPE.SCREEN, stream);
		});
	}

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
							if (localDesc?.sdp && version && gte(version, '1.6.13')) {
								screenIceRestart(this.meetingId, localDesc.sdp);
							}
						})
						.catch((reason) => console.warn('setLocalDescription failed', reason));
				})
				.catch((reason) => console.warn('createOffer with iceRestart failed', reason));
		}
	};

	// Handle remote answer to the SDP offer arrived from the signaling channel
	public handleRemoteAnswer(remoteAnswer: RTCSessionDescriptionInit): void {
		const remoteDescription: RTCSessionDescription = new RTCSessionDescription(remoteAnswer);
		this.peerConn?.setRemoteDescription(remoteDescription);
	}

	public stopScreenShare(): void {
		this.closePeerConnection();
		updateMediaOffer(this.meetingId, STREAM_TYPE.SCREEN, false);
	}

	public closePeerConnection(): void {
		useStore.getState().removeLocalStreams(STREAM_TYPE.SCREEN);
		this.rtpSender?.track?.stop();
		this.peerConn?.close();
		this.peerConn = null;
		this.rtpSender = null;
	}
}
