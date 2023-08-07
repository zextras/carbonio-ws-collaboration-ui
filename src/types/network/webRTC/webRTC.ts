/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export interface IPeerConnConfig {
	addIceServer(iceServer: RTCIceServer): void;
	getConfig(): RTCConfiguration;
}

export interface IPeerConnection {
	peerConn: RTCPeerConnection;
	meetingId: string;
	rtpSender: RTCRtpSender | null;
	handleOnNegotiationNeeded: (ev: Event) => void;
	handleOnIceCandidate: (ev: Event) => void;
	handleOnConnectionStateChange: (ev: Event) => void;
	handleOnIceConnectionStateChange: (ev: Event) => void;
	handleOnIceGatheringStateChange: (ev: Event) => void;
	handleOnSignalingStateChange: (ev: Event) => void;
	handleRemoteAnswer: (remoteAnswer: any) => void;
	handleOfferCreated: (rtcSessionDescription: RTCSessionDescriptionInit) => void;
	handleLocalDescriptionSet: (rtcSessionDescription: RTCSessionDescriptionInit) => void;
}

export interface IBidirectionalConnectionAudioInOut extends IPeerConnection {
	oscillatorAudioTrack: MediaStreamTrack | null;
	updateRemoteStreamAudio: () => void;
	handleOnTrack: (trackEvent: RTCTrackEvent) => void;
	updateLocalStreamTrack(mediaStreamTrack: MediaStream): Promise<MediaStreamTrack>;
	closeRtpSenderTrack: () => void;
	closePeerConnection: () => void;
}

export interface IVideoOutConnection extends IPeerConnection {
	localStreamVideoOutTrack: MediaStreamTrack | null;
	updateLocalStreamTrack(mediaStreamTrack: MediaStream): Promise<MediaStreamTrack>;
	closePeerConnection: () => void;
	closeRtpSenderTrack: () => void;
}

export interface IVideoInConnection {
	peerConn: RTCPeerConnection;
	meetingId: string;
	closePeerConnection: () => void;
}
