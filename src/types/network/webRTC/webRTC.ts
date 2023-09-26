/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import SubscriptionsManager from '../../../network/webRTC/SubscriptionsManager';
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
	onTrack: (trackEvent: RTCTrackEvent) => void;
	onNegotiationNeeded: () => void;
	onIceConnectionStateChange: (ev: Event) => void;
	handleRemoteAnswer(remoteAnswer: RTCSessionDescriptionInit): void;
	updateLocalStreamTrack(mediaStreamTrack: MediaStream): Promise<MediaStreamTrack>;
	updateRemoteStreamAudio(): void;
	closeRtpSenderTrack(): void;
}

export interface IVideoOutConnection extends IPeerConnection {
	rtpSender: RTCRtpSender | null;
	selectedVideoDeviceId: string | undefined;
	startVideo(selectedVideoDeviceId?: string): void;
	stopVideo(): void;
	onNegotiationNeeded: () => void;
	onIceConnectionStateChange: (ev: Event) => void;
	handleRemoteAnswer(remoteAnswer: RTCSessionDescriptionInit): void;
	updateLocalStreamTrack(mediaStreamTrack: MediaStream): Promise<MediaStreamTrack | undefined>;
	closeRtpSenderTrack(): void;
}

export interface IVideoInConnection extends IPeerConnection {
	onTrack: (ev: RTCTrackEvent) => void;
	subscriptionManager: SubscriptionsManager;
	handleRemoteOffer(sdp: string): void;
	handleParticipantsSubscribed(
		streamsMap: { user_id: string; type: STREAM_TYPE; mid: string }[]
	): void;
}
