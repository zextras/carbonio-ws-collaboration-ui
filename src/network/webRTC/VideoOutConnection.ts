/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { gte } from 'semver';

import { PeerConnConfig } from './PeerConnConfig';
import useStore from '../../store/Store';
import { IVideoOutConnection } from '../../types/network/webRTC/webRTC';
import { STREAM_TYPE } from '../../types/store/ActiveMeetingTypes';
import { getVideoStream } from '../../utils/UserMediaManager';
import { videoIceRestart, updateMediaOffer } from '../apis/MeetingsApi';

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

	public startVideo(selectedVideoDeviceId?: string): Promise<void> {
		return new Promise((resolve, reject) => {
			this.peerConn = new RTCPeerConnection(new PeerConnConfig().getConfig());
			this.peerConn.onnegotiationneeded = this.onNegotiationNeeded;
			this.peerConn.onconnectionstatechange = this.onConnectionStateChange;

			if (selectedVideoDeviceId) this.selectedVideoDeviceId = selectedVideoDeviceId;

			getVideoStream(selectedVideoDeviceId)
				.then((stream) => {
					this.updateLocalStreamTrack(stream);
					useStore.getState().setLocalStreams(STREAM_TYPE.VIDEO, stream);
					resolve();
				})
				.catch((err) => {
					reject(new Error(`Error while requesting video track, reason: ${err}`));
				});
		});
	}

	public stopVideo(): Promise<Response> {
		this.closePeerConnection();
		return updateMediaOffer(this.meetingId, STREAM_TYPE.VIDEO, false);
	}

	// Create SDP offer, set it as local description and send it to the remote peer
	private onNegotiationNeeded = (): void => {
		this.peerConn
			?.createOffer()
			.then((rtcSessionDesc: RTCSessionDescriptionInit) => {
				this.peerConn
					?.setLocalDescription(rtcSessionDesc)
					.then(() => {
						updateMediaOffer(this.meetingId, STREAM_TYPE.VIDEO, true, rtcSessionDesc.sdp);
					})
					.catch((reason) => console.warn(reason));
			})
			.catch((reason) => console.warn('createOffer failed', reason));
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
								videoIceRestart(this.meetingId, localDesc.sdp);
							}
						})
						.catch((reason) => console.warn('setLocalDescription failed', reason));
				})
				.catch((reason) => console.warn('createOffer with iceRestart failed', reason));
		}
	};

	// Stop the old track and add the new one without a new renegotiation
	public updateLocalStreamTrack(
		mediaStreamTrack: MediaStream,
		isVirtualBackground?: boolean
	): Promise<MediaStreamTrack> {
		return new Promise((resolve) => {
			const videoTrack: MediaStreamTrack = mediaStreamTrack.getVideoTracks()[0];
			if (this.peerConn) {
				if (this.rtpSender == null) {
					this.rtpSender = this.peerConn?.addTrack(
						videoTrack,
						mediaStreamTrack ?? new MediaStream()
					);
				} else if (this.rtpSender?.track) {
					if (isVirtualBackground) {
						this.rtpSender.replaceTrack(videoTrack).catch((reason) => console.warn(reason));
					} else {
						this.rtpSender.track.stop();
						this.rtpSender.replaceTrack(videoTrack).catch((reason) => console.warn(reason));
					}
				}
			}
			resolve(videoTrack);
		});
	}

	// Handle remote answer to the SDP offer arrived from the signaling channel
	public handleRemoteAnswer(remoteAnswer: RTCSessionDescriptionInit): void {
		const remoteDescription: RTCSessionDescription = new RTCSessionDescription(remoteAnswer);
		this.peerConn?.setRemoteDescription(remoteDescription);
	}

	public closePeerConnection(): void {
		useStore.getState().removeLocalStreams(STREAM_TYPE.VIDEO);
		useStore.getState().removeBackgroundStream();
		this.rtpSender?.track?.stop();
		this.peerConn?.close();
		this.rtpSender = null;
		this.peerConn = null;
	}
}
