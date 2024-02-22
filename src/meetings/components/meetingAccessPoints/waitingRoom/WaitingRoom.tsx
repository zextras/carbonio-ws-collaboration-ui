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
import { freeMediaResources } from '../../../../utils/MeetingsUtils';
import { calcScaleDivisor } from '../../../../utils/styleUtils';
import AccessTile from '../mediaHandlers/AccessTile';
import LocalMediaHandler from '../mediaHandlers/LocalMediaHandler';

const CustomButton = styled(Button)`
	border-radius: 0.125rem;
`;

type WaitingRoomProps = {
	meetingId: string;
	meetingName: string;
};
const WaitingRoom: FC<WaitingRoomProps> = ({ meetingId, meetingName }) => {
	const [t] = useTranslation();
	const howToJoinMeeting = t(
		'meeting.waitingRoom.title',
		`How do you want to join ${meetingName} meeting?`,
		{ meetingName }
	);
	const playMicLabel = t('meeting.interactions.playMic', 'Start microphone testing');
	const stopMicLabel = t('meeting.interactions.stopMic', 'Stop microphone testing');
	const setInputDevicesLabel = t(
		'meeting.waitingRoom.setInputs',
		'Set your input devices by choosing them from dropdown menu'
	);
	const enterInAFewMomentsLabel = t(
		'meeting.waitingRoom.readyHint',
		'You will enter the meeting in a few moments'
	);
	const clickOnReadyLabel = t(
		'meeting.waitingRoom.welcomeHint',
		'Click on “READY TO PARTICIPATE” to enter the meeting'
	);
	const hangUpLabel = t('meeting.waitingRoom.hangUp', 'Hang up');
	const readyToParticipateLabel = t('meeting.waitingRoom.ready', 'Ready to participate');
	const areYouReadyLabel = t(
		'meeting.waitingRoom.readyCaption',
		'Everything is set! Make yourself comfortable.'
	);
	const whenYouAreReadyLabel = t(
		'meeting.waitingRoom.welcomeCaption',
		'When you are ready, get comfortable.'
	);
	const aModeratorWillLetYouEnterLabel = t(
		'meeting.waitingRoom.nextStep',
		'A moderator will let you into the meeting as soon as possible.'
	);

	const [streamTrack, setStreamTrack] = useState<MediaStream | null>(null);
	const [enterButtonIsEnabled, setEnterButtonIsEnabled] = useState<boolean>(false);
	const [videoPlayerTestMuted, setVideoPlayerTestMuted] = useState<boolean>(true);
	const [wrapperWidth, setWrapperWidth] = useState<number>((window.innerWidth * 0.33) / 16);
	const [userIsReady, setUserIsReady] = useState<boolean>(false);
	const [selectedDevicesId, setSelectedDevicesId] = useState<{
		audio: string | undefined;
		video: string | undefined;
	}>({ audio: undefined, video: undefined });
	const [mediaDevicesEnabled, setMediaDevicesEnabled] = useState<{
		audio: boolean;
		video: boolean;
	}>({ audio: false, video: false });

	const { goToInfoPage, goToMeetingPage } = useRouting();

	const videoStreamRef = useRef<HTMLVideoElement>(null);

	const onToggleAudioTest = useCallback(() => {
		setVideoPlayerTestMuted((prevState) => !prevState);
	}, []);

	const joinMeeting = useCallback(
		() =>
			MeetingsApi.joinMeeting(
				meetingId,
				{
					videoStreamEnabled: mediaDevicesEnabled.video,
					audioStreamEnabled: mediaDevicesEnabled.audio
				},
				{ audioDevice: selectedDevicesId.audio, videoDevice: selectedDevicesId.video }
			),
		[mediaDevicesEnabled, meetingId, selectedDevicesId]
	);

	const joinWaitingRoom = useCallback(() => {
		joinMeeting()
			.then((resp) => {
				if (resp.status === 'WAITING') setUserIsReady(true);
				if (resp.status === 'ACCEPTED') goToMeetingPage(meetingId);
			})
			.catch((err) => console.error(err, 'Error on joinWaitingRoom'));
	}, [goToMeetingPage, joinMeeting, meetingId]);

	const handleHungUp = useCallback(() => {
		if (userIsReady) MeetingsApi.leaveWaitingRoom(meetingId);
		goToInfoPage(PAGE_INFO_TYPE.HANG_UP_PAGE);
	}, [goToInfoPage, meetingId, userIsReady]);

	const handleAcceptance = useCallback(() => {
		joinMeeting()
			.then(() => {
				freeMediaResources(streamTrack);
				goToMeetingPage(meetingId);
			})
			.catch((err) => console.error(err, 'Error on joinMeeting'));
	}, [goToMeetingPage, joinMeeting, meetingId, streamTrack]);

	const handleRejected = useCallback(() => {
		goToInfoPage(PAGE_INFO_TYPE.NEXT_TIME_PAGE);
	}, [goToInfoPage]);

	const handleRejoin = useCallback(() => {
		goToInfoPage(PAGE_INFO_TYPE.ALREADY_ACTIVE_MEETING_SESSION);
	}, [goToInfoPage]);

	useEventListener(EventName.MEETING_USER_ACCEPTED, handleAcceptance);
	useEventListener(EventName.MEETING_USER_REJECTED, handleRejected);
	useEventListener(EventName.MEETING_WAITING_PARTICIPANT_CLASHED, handleRejoin);

	const handleResize = useCallback(() => {
		setWrapperWidth((window.innerWidth * 0.33) / calcScaleDivisor());
	}, []);

	useEffect(() => {
		window.addEventListener('resize', handleResize);
		return () => {
			window.removeEventListener('resize', handleResize);
		};
	}, [handleResize]);

	// Leave waiting list on window close
	useEffect(() => {
		window.parent.addEventListener('beforeunload', handleHungUp);
		return () => {
			window.parent.removeEventListener('beforeunload', handleHungUp);
		};
	}, [handleHungUp]);

	useEffect(() => {
		if (videoStreamRef.current) {
			videoStreamRef.current.srcObject = streamTrack;
			setEnterButtonIsEnabled(true);
		}
	}, [streamTrack, mediaDevicesEnabled.audio, mediaDevicesEnabled.video]);

	return (
		<Container mainAlignment="center" crossAlignment="center">
			<Container width="fit" height="fit" gap="0.5rem">
				<Text size="extralarge" weight="bold">
					{howToJoinMeeting}
				</Text>
				<Text>{setInputDevicesLabel}</Text>
			</Container>
			<Container
				orientation="horizontal"
				height="fit"
				width="fit"
				gap="1rem"
				padding={{ vertical: '1rem' }}
			>
				<LocalMediaHandler
					streamTrack={streamTrack}
					setStreamTrack={setStreamTrack}
					setEnterButtonIsEnabled={setEnterButtonIsEnabled}
					selectedDevicesId={selectedDevicesId}
					setSelectedDevicesId={setSelectedDevicesId}
					mediaDevicesEnabled={mediaDevicesEnabled}
					setMediaDevicesEnabled={setMediaDevicesEnabled}
				/>
				<Button
					type="outlined"
					backgroundColor="text"
					label={videoPlayerTestMuted ? playMicLabel : stopMicLabel}
					onClick={onToggleAudioTest}
					disabled={!mediaDevicesEnabled.audio}
				/>
			</Container>
			<Container height="fit" width={`${wrapperWidth}rem`} minWidth="25rem">
				<AccessTile
					videoStreamRef={videoStreamRef}
					videoPlayerTestMuted={videoPlayerTestMuted}
					mediaDevicesEnabled={mediaDevicesEnabled}
				/>
			</Container>
			<Padding bottom="1.5rem" />
			<Text size="large">{userIsReady ? enterInAFewMomentsLabel : clickOnReadyLabel}</Text>
			<Container
				orientation="horizontal"
				height="fit"
				width="36%"
				padding={{ vertical: '1.5rem' }}
				gap="1rem"
			>
				<CustomButton
					backgroundColor="error"
					label={hangUpLabel}
					icon="PhoneOff"
					iconPlacement="right"
					onClick={handleHungUp}
					width="fill"
				/>
				{!userIsReady && (
					<CustomButton
						backgroundColor="success"
						label={readyToParticipateLabel}
						icon="CheckmarkOutline"
						iconPlacement="right"
						onClick={joinWaitingRoom}
						width="fill"
						disabled={!enterButtonIsEnabled}
					/>
				)}
			</Container>
			<Container height="fit" gap="0.5rem">
				<Text>{userIsReady ? areYouReadyLabel : whenYouAreReadyLabel}</Text>
				<Text>{aModeratorWillLetYouEnterLabel}</Text>
			</Container>
		</Container>
	);
};

export default WaitingRoom;
