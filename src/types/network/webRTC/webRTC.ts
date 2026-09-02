/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import SubscriptionsManager from '../../../network/webRTC/SubscriptionsManager';
import { QualitySignals } from '../../../network/webRTC/voteWindow';
import { STREAM_TYPE } from '../../store/ActiveMeetingTypes';
import { StreamInfo } from '../models/meetingBeTypes';

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
	handleRemoteAnswer(remoteAnswer: RTCSessionDescriptionInit): void;
	updateLocalStreamTrack(mediaStreamTrack: MediaStream): Promise<MediaStreamTrack>;
	updateRemoteStreamAudio(): void;
	muteAudioTrack(): void;
	unmuteAudioTrack(deviceId?: string): Promise<void>;
	closeRtpSenderTrack(): void;
}

export interface IVideoOutConnection extends IPeerConnection {
	rtpSender: RTCRtpSender | null;
	selectedVideoDeviceId: string | undefined;
	startVideo(selectedVideoDeviceId?: string): Promise<void>;
	stopVideo(): Promise<Response>;
	handleRemoteAnswer(remoteAnswer: RTCSessionDescriptionInit): void;
	updateLocalStreamTrack(
		mediaStreamTrack: MediaStream,
		isVirtualBackground?: boolean
	): Promise<MediaStreamTrack | undefined>;
}

export interface IScreenOutConnection extends IPeerConnection {
	rtpSender: RTCRtpSender | null;
	startScreenShare(): void;
	handleRemoteAnswer(remoteAnswer: RTCSessionDescriptionInit): void;
	stopScreenShare(): void;
}

export interface IVideoScreenInConnection extends IPeerConnection {
	subscriptionManager?: SubscriptionsManager;
	handleRemoteOffer(sdp: string): void;
	handleParticipantsSubscribed(streamsMap: StreamInfo[]): void;
	removeStream(streamKey: string, streamType: STREAM_TYPE[]): void;
	// One downlink-quality evaluation per 2 s tick, driven by the connection monitor. Receives the three
	// vote-derived signals (displayBars + the warn/restore N-of-M votes); no store reads for the vote.
	evaluateQualityTick(signals: QualitySignals): Promise<void>;
}
