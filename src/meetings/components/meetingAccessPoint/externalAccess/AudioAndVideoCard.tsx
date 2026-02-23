/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
/* eslint-disable jsx-a11y/media-has-caption */
import React, { Dispatch, ReactElement, SetStateAction, useEffect, useRef, useState } from 'react';

import { Container, Row } from '@zextras/carbonio-design-system';

import { MediaStatus } from './MeetingExternalAccessPage';
import AccessTile from '../AccessTile';
import { MicTestButton } from '../MicTestButton';
import { useLocalMediaHandler } from '../useLocalMediaHandler';

type AudioAndVideoCardProps = {
	mediaStatus: MediaStatus;
	setMediaStatus: Dispatch<SetStateAction<MediaStatus>>;
};

const AudioAndVideoCard = ({
	mediaStatus,
	setMediaStatus
}: AudioAndVideoCardProps): ReactElement => {
	const [micTest, setMicTest] = useState(false);
	const videoStreamRef = useRef<HTMLVideoElement>(null);
	const audioStreamRef = useRef<HTMLAudioElement>(null);

	const {
		status: videoStatus,
		deviceId: videoDeviceId,
		HandlerComponent: VideoHandlerComponent
	} = useLocalMediaHandler({
		mediaType: 'video',
		initialStatus: mediaStatus.video.enabled,
		streamRef: videoStreamRef
	});

	const {
		status: audioStatus,
		deviceId: audioDeviceId,
		HandlerComponent: AudioHandlerComponent,
		streamTrack: audioStreamTrack
	} = useLocalMediaHandler({
		mediaType: 'audio',
		initialStatus: mediaStatus.audio.enabled,
		streamRef: audioStreamRef
	});

	useEffect(() => {
		setMediaStatus({
			audio: { enabled: audioStatus, selectedDeviceId: audioDeviceId },
			video: { enabled: videoStatus, selectedDeviceId: videoDeviceId }
		});
	}, [audioDeviceId, audioStatus, setMediaStatus, videoDeviceId, videoStatus]);

	useEffect(() => {
		if (!audioStatus) {
			setMicTest(false);
		}
	}, [audioStatus]);

	return (
		<Row
			orientation="vertical"
			background="gray6"
			height="fill"
			takeAvailableSpace
			padding="extralarge"
			gap="1rem"
			style={{ borderRadius: '1rem' }}
		>
			<AccessTile
				videoStreamRef={videoStreamRef}
				videoPlayerTestMuted
				mediaDevicesEnabled={{
					audio: audioStatus,
					video: videoStatus
				}}
			/>
			<audio ref={audioStreamRef} autoPlay muted={!micTest || !audioStatus} />
			<Container gap="0.5rem" height="fit">
				{VideoHandlerComponent}
				{AudioHandlerComponent}
			</Container>
			<Container height="fit">
				<MicTestButton disabled={!audioStatus} stream={audioStreamTrack} />
			</Container>
		</Row>
	);
};

export default AudioAndVideoCard;
