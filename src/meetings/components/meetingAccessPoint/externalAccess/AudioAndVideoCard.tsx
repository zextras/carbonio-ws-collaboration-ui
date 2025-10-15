/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
/* eslint-disable jsx-a11y/media-has-caption */
import React, {
	Dispatch,
	ReactElement,
	SetStateAction,
	useCallback,
	useEffect,
	useRef,
	useState
} from 'react';

import { Button, Container, Row } from "@zextras/carbonio-design-system";
import { useTranslation } from 'react-i18next';

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
	const [t] = useTranslation();
	const startMicTestLabel = t('meeting.interactions.playMic', 'Start mic test');
	const stopMicTestLabel = t('meeting.interactions.stopMic', 'Stop mic test');

	const [micTest, setMicTest] = useState(false);
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

	useEffect(() => {
		if (!audioStatus) {
			setMicTest(false);
		}
	}, [audioStatus]);

	const toggleMicTest = useCallback(() => {
		setMicTest((prev) => !prev);
	}, []);

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
			<Button
				width="fill"
				label={!micTest ? startMicTestLabel : stopMicTestLabel}
				type="outlined"
				icon="Mic"
				iconPlacement="right"
				onClick={toggleMicTest}
				disabled={!audioStatus}
			/>
		</Row>
	);
};

export default AudioAndVideoCard;
