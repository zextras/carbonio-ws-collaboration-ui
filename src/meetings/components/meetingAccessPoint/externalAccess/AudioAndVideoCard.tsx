/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
/* eslint-disable jsx-a11y/media-has-caption */
import React, { Dispatch, ReactElement, SetStateAction, useEffect, useRef } from 'react';

import { Container } from '@zextras/carbonio-design-system';

import { MediaStatus } from './MeetingExternalAccessPage';
import AccessTile from '../mediaHandlers/AccessTile';
import { useLocalAudioHandler } from '../mediaHandlers/useLocalAudioHandler';
import { useLocalVideoHandler } from '../mediaHandlers/useLocalVideoHandler';

type AudioAndVideoCardProps = {
	mediaStatus: MediaStatus;
	setMediaStatus: Dispatch<SetStateAction<MediaStatus>>;
};

const AudioAndVideoCard = ({
	mediaStatus,
	setMediaStatus
}: AudioAndVideoCardProps): ReactElement => {
	const videoStreamRef = useRef<HTMLVideoElement>(null);
	const audioStreamRef = useRef<HTMLAudioElement>(null);

	const { videoStatus, videoDeviceId, VideoHandlerComponent } = useLocalVideoHandler({
		initialStatus: mediaStatus.video.enabled,
		streamRef: videoStreamRef
	});

	const { audioStatus, audioDeviceId, AudioHandlerComponent } = useLocalAudioHandler({
		initialStatus: mediaStatus.audio.enabled,
		streamRef: audioStreamRef
	});

	useEffect(() => {
		setMediaStatus({
			audio: { enabled: audioStatus, selectedDeviceId: audioDeviceId },
			video: { enabled: videoStatus, selectedDeviceId: videoDeviceId }
		});
	}, [audioDeviceId, audioStatus, setMediaStatus, videoDeviceId, videoStatus]);

	return (
		<Container
			background="gray6"
			width="fit"
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
			<audio ref={audioStreamRef} autoPlay />
			<Container gap="0.5rem">
				{VideoHandlerComponent}
				{AudioHandlerComponent}
			</Container>
		</Container>
	);
};

export default AudioAndVideoCard;
