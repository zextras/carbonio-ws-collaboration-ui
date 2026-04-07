/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { PeerConnConfig } from './PeerConnConfig';
import useStore from '../../store/Store';
import { IVideoOutConnection } from '../../types/network/webRTC/webRTC';
import { NetworkQualityLevel, STREAM_TYPE } from '../../types/store/ActiveMeetingTypes';
import { getVideoStream } from '../../utils/UserMediaManager';
import MeetingsApi from '../apis/MeetingsApi';

export default class VideoOutConnection implements IVideoOutConnection {
	peerConn: RTCPeerConnection | null;

	meetingId: string;

	rtpSender: RTCRtpSender | null;

	selectedVideoDeviceId: string | undefined;

	private originalEncodings: RTCRtpEncodingParameters[] | null = null;

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
			this.peerConn.oniceconnectionstatechange = this.onIceConnectionStateChange;

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

	public stopVideo(): void {
		this.closePeerConnection();
		MeetingsApi.updateMediaOffer(this.meetingId, STREAM_TYPE.VIDEO, false);
	}

	// Create SDP offer, set it as local description and send it to the remote peer
	private onNegotiationNeeded = (): void => {
		this.peerConn
			?.createOffer()
			.then((rtcSessionDesc: RTCSessionDescriptionInit) => {
				this.peerConn
					?.setLocalDescription(rtcSessionDesc)
					.then(() => {
						MeetingsApi.updateMediaOffer(
							this.meetingId,
							STREAM_TYPE.VIDEO,
							true,
							rtcSessionDesc.sdp
						);
					})
					.catch((reason) => console.warn(reason));
			})
			.catch((reason) => console.warn('createOffer failed', reason));
	};

	private onIceConnectionStateChange = (ev: Event): void => {
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		if (ev.target.iceConnectionState === 'failed') {
			this.onNegotiationNeeded();
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
		this.peerConn
			?.setRemoteDescription(remoteDescription)
			.then(() => {
				const quality = useStore.getState().activeMeeting?.networkStats?.quality;
				if (quality && quality !== NetworkQualityLevel.UNKNOWN) {
					this.setOutboundQuality(quality).catch((err) =>
						console.warn('Failed to re-apply video outbound quality after reconnection', err)
					);
				}
			})
			.catch((err) => console.warn('Failed to set video remote description', err));
	}

	public closePeerConnection(): void {
		useStore.getState().removeLocalStreams(STREAM_TYPE.VIDEO);
		useStore.getState().removeBackgroundStream();
		this.rtpSender?.track?.stop();
		this.peerConn?.close();
		this.rtpSender = null;
		this.peerConn = null;
		this.originalEncodings = null;
	}

	public async setOutboundQuality(level: NetworkQualityLevel): Promise<void> {
		if (!this.rtpSender) return;
		const params = this.rtpSender.getParameters();
		if (!params.encodings || params.encodings.length === 0) {
			params.encodings = [{}];
		}

		if (level === NetworkQualityLevel.GOOD && this.originalEncodings === null) return;

		if (this.originalEncodings === null) {
			this.originalEncodings = params.encodings.map((enc) => ({ ...enc }));
		}

		if (level === NetworkQualityLevel.GOOD) {
			params.encodings = this.originalEncodings.map((enc) => ({ ...enc }));
		} else if (level === NetworkQualityLevel.FAIR) {
			params.encodings = this.originalEncodings.map((enc) => ({
				...enc,
				maxBitrate: 20_000, // bps
				scaleResolutionDownBy: (enc.scaleResolutionDownBy ?? 1) * 2
			}));
		} else if (level === NetworkQualityLevel.POOR) {
			params.encodings = this.originalEncodings.map((enc) => ({
				...enc,
				maxBitrate: 10_000, // bps
				scaleResolutionDownBy: (enc.scaleResolutionDownBy ?? 1) * 5
			}));
		} else {
			return;
		}

		await this.rtpSender.setParameters(params);
	}
}
