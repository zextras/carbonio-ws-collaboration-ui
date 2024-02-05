/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC, useCallback, useEffect, useRef, useState } from 'react';

import { Button, Container, Padding, Text } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import useEventListener, { EventName } from '../../../../hooks/useEventListener';
import useRouting, { PAGE_INFO_TYPE } from '../../../../hooks/useRouting';
import { MeetingsApi } from '../../../../network';
import { getRoomIdByMeetingId } from '../../../../store/selectors/MeetingSelectors';
import useStore from '../../../../store/Store';
import AccessTile from '../mediaHandlers/AccessTile';
import LocalMediaHandler from '../mediaHandlers/LocalMediaHandler';

const CustomButton = styled(Button)<{ $userIsReady?: boolean }>`
	width: ${({ $userIsReady }): string => ($userIsReady ? '36rem' : '17.5rem')};
	border-radius: 0.125rem;
`;

type WaitingRoomProps = {
	meetingId: string;
};

const WaitingRoom: FC<WaitingRoomProps> = ({ meetingId }) => {
	const [t] = useTranslation();
	const playMicLabel = t('meeting.interactions.playMic', 'Start microphone testing');
	const stopMicLabel = t('meeting.interactions.stopMic', 'Stop microphone testing');

	const roomId = useStore((store) => getRoomIdByMeetingId(store, meetingId));
	const [streamTrack, setStreamTrack] = useState<MediaStream | null>(null);
	const [enterButtonIsEnabled, setEnterButtonIsEnabled] = useState<boolean>(false);
	const [videoPlayerTestMuted, setVideoPlayerTestMuted] = useState<boolean>(true);
	const [meetingName, setMeetingName] = useState<string>('');
	const [wrapperWidth, setWrapperWidth] = useState<number>((window.innerWidth * 0.33) / 16);
	const [userIsReady, setUserIsready] = useState<boolean>(false);
	const [selectedDevicesId, setSelectedDevicesId] = useState<{
		audio: string | undefined;
		video: string | undefined;
	}>({ audio: undefined, video: undefined });
	const [mediaDevicesEnabled, setMediaDevicesEnabled] = useState<{
		audio: boolean;
		video: boolean;
	}>({ audio: false, video: false });
	const { goToInfoPage, goToMeetingPage } = useRouting();

	const title = `How do you want to join ${meetingName} meeting?`;
	const subtitle = 'Set your input devices by choosing them from dropdown menu';

	const videoStreamRef = useRef<HTMLVideoElement>(null);

	const onToggleAudioTest = useCallback(() => {
		setVideoPlayerTestMuted((prevState) => !prevState);
	}, []);

	const handleHungUp = useCallback(() => {
		goToInfoPage(PAGE_INFO_TYPE.HUNG_UP_PAGE);
	}, [goToInfoPage]);

	// TODO handle the change of the width in case of resize from settings
	const handleResize = useCallback(() => {
		setWrapperWidth((window.innerWidth * 0.33) / 16);
	}, []);

	const joinMeetingRoom = useCallback(() => {
		MeetingsApi.joinWaitingRoom(meetingId).then(() => {
			console.log('Joined Waiting Room');
			setUserIsready(true);
		});
	}, [meetingId]);

	const handleAcceptance = useCallback(() => {
		MeetingsApi.enterMeeting(
			roomId || '',
			{
				videoStreamEnabled: mediaDevicesEnabled.video,
				audioStreamEnabled: mediaDevicesEnabled.audio
			},
			{ audioDevice: selectedDevicesId.audio, videoDevice: selectedDevicesId.video }
		)
			.then((meetingId) => goToMeetingPage(meetingId))
			.catch((err) => console.error(err, 'Error on joinMeeting'));
	}, [
		goToMeetingPage,
		mediaDevicesEnabled.audio,
		mediaDevicesEnabled.video,
		roomId,
		selectedDevicesId.audio,
		selectedDevicesId.video
	]);

	const handleRejected = useCallback(() => {
		goToInfoPage(PAGE_INFO_TYPE.NEXT_TIME_PAGE);
	}, [goToInfoPage]);

	useEventListener(EventName.MEETING_USER_ACCEPTED, handleAcceptance);
	useEventListener(EventName.MEETING_USER_REJECTED, handleRejected);

	useEffect(() => {
		window.addEventListener('resize', handleResize);
		return () => {
			window.removeEventListener('resize', handleResize);
		};
	}, [handleResize]);

	useEffect(() => {
		if (videoStreamRef.current) {
			videoStreamRef.current.srcObject = streamTrack;
			setEnterButtonIsEnabled(true);
		}
	}, [streamTrack, mediaDevicesEnabled.audio, mediaDevicesEnabled.video]);

	useEffect(() => {
		MeetingsApi.getScheduledMeetingName(meetingId).then((name) => setMeetingName(name));
	}, [goToInfoPage, meetingId]);

	return (
		<Container mainAlignment="center" crossAlignment="center">
			<Text size="extralarge" weight="bold">
				{title}
			</Text>
			<Padding bottom={'0.5rem'} />
			<Text>{subtitle}</Text>
			<Padding bottom={'1rem'} />
			<Container orientation="horizontal" height="fit" width={'fit'}>
				<LocalMediaHandler
					streamTrack={streamTrack}
					setStreamTrack={setStreamTrack}
					setEnterButtonIsEnabled={setEnterButtonIsEnabled}
					selectedDevicesId={selectedDevicesId}
					setSelectedDevicesId={setSelectedDevicesId}
					mediaDevicesEnabled={mediaDevicesEnabled}
					setMediaDevicesEnabled={setMediaDevicesEnabled}
				/>
				<Padding right={'1rem'} />
				<Button
					type="outlined"
					backgroundColor={'text'}
					label={videoPlayerTestMuted ? playMicLabel : stopMicLabel}
					onClick={onToggleAudioTest}
					disabled={!mediaDevicesEnabled.audio}
				/>
			</Container>
			<Padding bottom={'1rem'} />
			<Container height={'fit'} width={`${wrapperWidth}rem`} minWidth={'25rem'}>
				<AccessTile
					videoStreamRef={videoStreamRef}
					videoPlayerTestMuted={videoPlayerTestMuted}
					mediaDevicesEnabled={mediaDevicesEnabled}
				/>
			</Container>
			<Padding bottom={'1.5rem'} />
			<Text size="large">
				{userIsReady
					? 'You will enter the meeting in a few moments'
					: 'Click on “READY TO PARTICIPATE” to enter the meeting'}
			</Text>
			<Padding bottom={'1.5rem'} />
			<Container orientation="horizontal" height="fit" width="fit">
				<CustomButton
					backgroundColor={'error'}
					label={'Hang up'}
					icon="PhoneOff"
					iconPlacement="right"
					onClick={handleHungUp}
					size="extralarge"
					$userIsReady={userIsReady}
				/>
				{!userIsReady && (
					<>
						<Padding right={'1rem'} />
						<CustomButton
							backgroundColor={'success'}
							label={'Ready to participate'}
							icon="CheckmarkOutline"
							iconPlacement="right"
							onClick={joinMeetingRoom}
							size="extralarge"
							disabled={!enterButtonIsEnabled}
						/>
					</>
				)}
			</Container>

			<Padding bottom={'1.5rem'} />
			<Text>
				{userIsReady
					? 'Are you ready? Make yourself comfortable.'
					: 'When you are ready, get comfortable.'}
			</Text>
			<Padding bottom={'0.5rem'} />
			<Text>A moderator will let you into the meeting as soon as possible.</Text>
		</Container>
	);
};

export default WaitingRoom;
