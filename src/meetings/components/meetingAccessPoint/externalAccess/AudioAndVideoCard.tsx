/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { Dispatch, ReactElement, SetStateAction, useEffect, useRef, useState } from 'react';

import { Container } from '@zextras/carbonio-design-system';

import { MediaStatus } from './MeetingExternalAccessPage';
import AccessTile from '../mediaHandlers/AccessTile';

type AudioAndVideoCardProps = {
	mediaStatus: MediaStatus;
	setMediaStatus: Dispatch<SetStateAction<MediaStatus>>;
};

const AudioAndVideoCard = ({
	mediaStatus,
	setMediaStatus
}: AudioAndVideoCardProps): ReactElement => {
	const [streamTrack, setStreamTrack] = useState<MediaStream | null>(null);
	const videoStreamRef = useRef<HTMLVideoElement>(null);

	useEffect(() => {
		if (videoStreamRef.current) {
			if (mediaStatus.video.enabled) {
				videoStreamRef.current.srcObject = streamTrack;
			} else {
				videoStreamRef.current.srcObject = null;
			}
		}
	}, [streamTrack, mediaStatus.video.enabled]);

	return (
		<Container
			background={'gray6'}
			width="fit"
			padding="extralarge"
			style={{ borderRadius: '1rem' }}
		>
			<AccessTile
				videoStreamRef={videoStreamRef}
				videoPlayerTestMuted
				mediaDevicesEnabled={{
					audio: mediaStatus.audio.enabled,
					video: mediaStatus.video.enabled
				}}
			/>
			{/*<LocalMediaHandler*/}
			{/*	streamTrack={streamTrack}*/}
			{/*	setStreamTrack={setStreamTrack}*/}
			{/*	setEnterButtonIsEnabled={() => {}}*/}
			{/*	mediaStatus={mediaStatus}*/}
			{/*	setMediaStatus={setMediaStatus}*/}
			{/*/>*/}
		</Container>
	);
};

export default AudioAndVideoCard;
