/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { STREAM_TYPE } from '../../store/ActiveMeetingTypes';

export interface IPeerConnConfig {
	addIceServer(iceServer: RTCIceServer): void;
	getConfig(): RTCConfiguration;
}

export interface IPeerConnection {
	peerConn: RTCPeerConnection | null;
	meetingId: string;
	closePeerConnection(): void;
}

export interface IBidirectionalConnectionAudioInOut extends IPeerConnection {
	rtpSender: RTCRtpSender | null;
	selectedAudioDeviceId: string | undefined;
	initialAudioStatus: boolean;
	oscillatorAudioTrack: MediaStreamTrack | undefined;
	handleRemoteAnswer(remoteAnswer: RTCSessionDescriptionInit): void;
	updateLocalStreamTrack(mediaStreamTrack: MediaStream): Promise<MediaStreamTrack>;
	updateRemoteStreamAudio(): void;
	closeRtpSenderTrack(): void;
}

export interface IVideoOutConnection extends IPeerConnection {
	rtpSender: RTCRtpSender | null;
	selectedVideoDeviceId: string | undefined;
	handleRemoteAnswer(remoteAnswer: RTCSessionDescriptionInit): void;
	handleOfferCreated(rtcSessionDescription: RTCSessionDescriptionInit): void;
	updateLocalStreamTrack(mediaStreamTrack: MediaStream): Promise<MediaStreamTrack>;
	closeRtpSenderTrack(): void;
}

export interface IScreenOutConnection extends IPeerConnection {
	handleRemoteAnswer(remoteAnswer: RTCSessionDescriptionInit): void;
	startScreenShare(): void;
	stopScreenShare(): void;
}

export interface IVideoInConnection extends IPeerConnection {
	onTrack: (ev: RTCTrackEvent) => void;
	handleStreams(streamsMap: { user_id: string; type: STREAM_TYPE }[]): void;
	handleRemoteOffer(sdp: string): void;
}
