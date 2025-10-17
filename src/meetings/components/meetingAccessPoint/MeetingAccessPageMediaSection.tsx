/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
/* eslint-disable jsx-a11y/media-has-caption */
import React, { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import styled from '@emotion/styled';
import {
	Button,
	Container,
	Icon,
	Padding,
	Row,
	Text,
	Tooltip
} from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

import AccessTile from './mediaHandlers/AccessTile';
import { useLocalAudioHandler } from './mediaHandlers/useLocalAudioHandler';
import { useLocalVideoHandler } from './mediaHandlers/useLocalVideoHandler';
import { MEETINGS_PATH } from '../../../constants/appConstants';
import useEventListener, { EventName } from '../../../hooks/useEventListener';
import useLocalStorage from '../../../hooks/useLocalStorage';
import { getRoomIdByMeetingId } from '../../../store/selectors/MeetingSelectors';
import { getRoomNameSelector } from '../../../store/selectors/RoomsSelectors';
import useStore from '../../../store/Store';
import { LOCAL_STORAGE_NAMES, MeetingStorageType } from '../../../utils/localStorageUtils';

type AccessMeetingPageMediaSectionProps = {
	hasUserDirectAccess: boolean | undefined;
	userIsReady: boolean;
	meetingName: string;
	wrapperWidth: number;
	handleEnterMeeting: (
		mediaDevicesEnabled?: { audio: boolean; video: boolean },
		selectedDevicesId?: { audio?: string; video?: string }
	) => void;
	handleWaitingRoom: (
		mediaDevicesEnabled?: { audio: boolean; video: boolean },
		selectedDevicesId?: { audio?: string; video?: string }
	) => void;
};

const ResizeWrapper = styled(Container)`
	display: flex;
	flex-direction: row;
	@media only screen and (max-width: 1024px) {
		flex-direction: column;
	}
`;

const AlignWrapper = styled(Container)`
	align-items: flex-start;
	@media only screen and (max-width: 1024px) {
		align-items: center;
	}
`;

const MeetingAccessPageMediaSection: FC<AccessMeetingPageMediaSectionProps> = ({
	hasUserDirectAccess,
	userIsReady,
	meetingName,
	wrapperWidth,
	handleEnterMeeting,
	handleWaitingRoom
}) => {
	const [micTest, setMicTest] = useState(false);

	const meetingId = useMemo(() => document.location.pathname.split(MEETINGS_PATH)[1], []);
	const roomId = useStore((store) => getRoomIdByMeetingId(store, meetingId) ?? ``);
	const conversationTitle = useStore((store) => getRoomNameSelector(store, roomId));
	const chatsBeNetworkStatus = useStore(({ connections }) => connections.status.chats_be);
	const websocketNetworkStatus = useStore(({ connections }) => connections.status.websocket);

	const [t] = useTranslation();
	const playMicLabel = t('meeting.interactions.playMic', 'Start mic test');
	const stopMicLabel = t('meeting.interactions.stopMic', 'Stop mic test');
	const readyToParticipateLabel = t('meeting.waitingRoom.ready', 'Ready to participate');
	const enter = t('action.enter', 'Enter');
	const howToJoinMeeting = t(
		'meeting.waitingRoom.title',
		`How do you want to join ${meetingName || conversationTitle} meeting?`,
		{ meetingName: meetingName || conversationTitle }
	);
	const setInputDevicesLabel = t(
		'meeting.waitingRoom.setInputs',
		'Set your input devices by choosing them from dropdown menu'
	);
	const readyLabel = t('meeting.waitingRoom.userIsReady', "You're ready!");
	const enterButtonDisabledTooltip = t(
		'meeting.startModal.audioAndVideoLoading',
		'Assets are loading'
	);
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

	const [meetingStorage, setMeetingStorage] = useLocalStorage<MeetingStorageType>(
		LOCAL_STORAGE_NAMES.MEETINGS
	);

	const videoStreamRef = useRef<HTMLVideoElement>(null);
	const audioStreamRef = useRef<HTMLAudioElement>(null);

	const { videoStatus, videoDeviceId, VideoHandlerComponent } = useLocalVideoHandler({
		initialStatus: meetingStorage.EnableCamera,
		streamRef: videoStreamRef
	});

	const { audioStatus, audioDeviceId, AudioHandlerComponent } = useLocalAudioHandler({
		initialStatus: meetingStorage.EnableMicrophone,
		streamRef: audioStreamRef
	});

	useEffect(() => {
		setMeetingStorage({ EnableCamera: videoStatus, EnableMicrophone: audioStatus });
	}, [audioStatus, setMeetingStorage, videoStatus]);

	useEffect(() => {
		if (!audioStatus) {
			setMicTest(false);
		}
	}, [audioStatus]);

	const toggleMicTest = useCallback(() => {
		setMicTest((prev) => !prev);
	}, []);

	const areNetworksUp = useMemo(() => {
		if (chatsBeNetworkStatus !== undefined && websocketNetworkStatus !== undefined) {
			return chatsBeNetworkStatus && websocketNetworkStatus;
		}
		return false;
	}, [chatsBeNetworkStatus, websocketNetworkStatus]);

	const waitingRoomLabels = useMemo(() => {
		if (hasUserDirectAccess === undefined) return undefined;
		return (
			!hasUserDirectAccess && (
				<AlignWrapper height="fit">
					<Text>{userIsReady ? areYouReadyLabel : whenYouAreReadyLabel}</Text>
					<Text>{aModeratorWillLetYouEnterLabel}</Text>
				</AlignWrapper>
			)
		);
	}, [
		aModeratorWillLetYouEnterLabel,
		areYouReadyLabel,
		hasUserDirectAccess,
		userIsReady,
		whenYouAreReadyLabel
	]);

	// handle waiting room flow and events
	const waitingRoomHandler = useCallback(
		() =>
			handleWaitingRoom(
				{ audio: audioStatus, video: videoStatus },
				{ audio: audioDeviceId, video: videoDeviceId }
			),
		[audioDeviceId, audioStatus, handleWaitingRoom, videoDeviceId, videoStatus]
	);

	const enterMeeting = useCallback(
		() =>
			handleEnterMeeting(
				{ audio: audioStatus, video: videoStatus },
				{ audio: audioDeviceId, video: videoDeviceId }
			),
		[audioDeviceId, audioStatus, handleEnterMeeting, videoDeviceId, videoStatus]
	);

	const enterButton = useMemo(() => {
		if (hasUserDirectAccess === undefined) return undefined;
		if (hasUserDirectAccess)
			return (
				<Tooltip label={enterButtonDisabledTooltip} disabled={areNetworksUp}>
					<Button
						data-testid="enterMeetingButton"
						width="fill"
						label={enter}
						onClick={enterMeeting}
						disabled={!areNetworksUp}
					/>
				</Tooltip>
			);
		if (!userIsReady)
			return (
				<Button
					backgroundColor="success"
					label={readyToParticipateLabel}
					icon="CheckmarkOutline"
					iconPlacement="right"
					onClick={waitingRoomHandler}
					width="fill"
				/>
			);
		return (
			<Container orientation="horizontal" gap="0.5rem" mainAlignment="flex-start">
				<Icon icon="CheckmarkCircle2" color="success" size="large" />
				<Text weight="bold" size="extralarge">
					{readyLabel}
				</Text>
			</Container>
		);
	}, [
		areNetworksUp,
		enter,
		enterButtonDisabledTooltip,
		enterMeeting,
		hasUserDirectAccess,
		waitingRoomHandler,
		readyLabel,
		readyToParticipateLabel,
		userIsReady
	]);

	useEventListener(EventName.MEETING_WAITING_PARTICIPANT_ACCEPTED, waitingRoomHandler);

	return (
		<ResizeWrapper
			height="fit"
			width="fit"
			mainAlignment="center"
			crossAlignment="center"
			gap="2rem"
		>
			<Container height="fit" width={`${wrapperWidth}rem`} minWidth="35rem">
				<AccessTile
					videoStreamRef={videoStreamRef}
					videoPlayerTestMuted
					mediaDevicesEnabled={{
						audio: audioStatus,
						video: videoStatus
					}}
				/>
				<audio ref={audioStreamRef} autoPlay muted={!micTest || !audioStatus} />
			</Container>
			<Container mainAlignment="flex-start" crossAlignment="flex-start" gap="1rem">
				<Container mainAlignment="center" crossAlignment="center" gap="2rem">
					<AlignWrapper height="fit">
						<Text size="large" overflow="break-word">
							{howToJoinMeeting}
						</Text>
						<Padding bottom="0.25rem" />
						<Text>{setInputDevicesLabel}</Text>
					</AlignWrapper>
					<Container gap="0.5rem" height="fit">
						{VideoHandlerComponent}
						{AudioHandlerComponent}
					</Container>
					<Container height="fit" orientation="horizontal" gap="1rem" mainAlignment="flex-start">
						<Row width={`50%`} minWidth="14rem">
							<Button
								width="fill"
								type="outlined"
								backgroundColor="text"
								icon="Mic"
								iconPlacement="right"
								label={!micTest ? playMicLabel : stopMicLabel}
								onClick={toggleMicTest}
								disabled={!audioStatus}
							/>
						</Row>
						<Row width={`50%`} minWidth="14rem">
							{enterButton}
						</Row>
					</Container>
				</Container>
				{waitingRoomLabels}
			</Container>
		</ResizeWrapper>
	);
};

export default MeetingAccessPageMediaSection;
