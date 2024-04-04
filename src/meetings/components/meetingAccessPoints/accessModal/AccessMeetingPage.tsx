/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
	Button,
	Container,
	Icon,
	IconButton,
	Padding,
	Row,
	Text,
	Tooltip
} from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import useEventListener, { EventName } from '../../../../hooks/useEventListener';
import useRouting, { PAGE_INFO_TYPE } from '../../../../hooks/useRouting';
import { MeetingsApi } from '../../../../network';
import {
	getRoomNameSelector,
	getRoomTypeSelector
} from '../../../../store/selectors/RoomsSelectors';
import useStore from '../../../../store/Store';
import { RoomType } from '../../../../types/store/RoomTypes';
import { freeMediaResources } from '../../../../utils/MeetingsUtils';
import { calcScaleDivisor } from '../../../../utils/styleUtils';
import AccessTile from '../mediaHandlers/AccessTile';
import LocalMediaHandler from '../mediaHandlers/LocalMediaHandler';

type AccessMeetingPageProps = {
	hasUserDirectAccess: boolean | undefined;
	meetingId: string;
	roomId: string;
	meetingName: string;
};

const CustomContainer = styled(Container)`
	position: absolute;
	left: 4rem;
	bottom: 3rem;
`;
const AccessMeetingPage: FC<AccessMeetingPageProps> = ({
	hasUserDirectAccess,
	roomId,
	meetingName,
	meetingId
}) => {
	const [t] = useTranslation();
	const conversationTitle = useStore((store) => getRoomNameSelector(store, roomId));

	const playMicLabel = t('meeting.interactions.playMic', 'Start mic test');
	const stopMicLabel = t('meeting.interactions.stopMic', 'Stop mic test');
	const readyToParticipateLabel = t('meeting.waitingRoom.ready', 'Ready to participate');
	const enter = t('action.enter', 'Enter');
	const leave = t('action.leave', 'Leave');
	const readyLabel = t('', "You're ready!");
	const leaveMeetingLabel = t('meeting.interactions.leaveMeeting', 'Leave Meeting');
	const groupTitle = t(
		'meeting.startModal.enterRoomMeetingTitle',
		`Participate to ${conversationTitle} meeting`,
		{ meetingTitle: conversationTitle }
	);
	const oneToOneTitle = t(
		'meeting.startModal.enterOneToOneMeetingTitle',
		`Start meeting with ${conversationTitle}`,
		{ meetingTitle: conversationTitle }
	);
	const howToJoinMeeting = t(
		'meeting.waitingRoom.title',
		`How do you want to join ${meetingName || conversationTitle} meeting?`,
		{ meetingName: meetingName || conversationTitle }
	);
	const setInputDevicesLabel = t(
		'meeting.waitingRoom.setInputs',
		'Set your input devices by choosing them from dropdown menu'
	);
	const clickOnReadyLabel = t(
		'meeting.waitingRoom.welcomeHint',
		'Click on “READY TO PARTICIPATE” to enter the meeting'
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
	const enterButtonDisabledTooltip = t(
		'meeting.startModal.audioAndVideoLoading',
		'Assets are loading'
	);
	const enterInAFewMomentsLabel = t(
		'meeting.waitingRoom.readyHint',
		'You will enter the meeting in a few moments'
	);

	const roomType = useStore((store) => getRoomTypeSelector(store, roomId));
	const chatsBeNetworkStatus = useStore(({ connections }) => connections.status.chats_be);
	const websocketNetworkStatus = useStore(({ connections }) => connections.status.websocket);

	const [streamTrack, setStreamTrack] = useState<MediaStream | null>(null);
	const [enterButtonIsEnabled, setEnterButtonIsEnabled] = useState<boolean>(false);
	const [pageWidth, setPageWidth] = useState(window.innerWidth);
	const [wrapperWidth, setWrapperWidth] = useState<number>((window.innerWidth * 0.33) / 16);
	const [videoPlayerTestMuted, setVideoPlayerTestMuted] = useState<boolean>(true);
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

	const accessTitle = useMemo(() => {
		const roomTypeTitle = roomType === RoomType.ONE_TO_ONE ? oneToOneTitle : groupTitle;
		if (hasUserDirectAccess === undefined) return '';
		if (hasUserDirectAccess) return roomTypeTitle;
		return userIsReady ? enterInAFewMomentsLabel : clickOnReadyLabel;
	}, [
		roomType,
		oneToOneTitle,
		groupTitle,
		hasUserDirectAccess,
		userIsReady,
		enterInAFewMomentsLabel,
		clickOnReadyLabel
	]);

	const handlePageOrientation = useMemo(
		() => (pageWidth <= 1024 ? 'vertical' : 'horizontal'),
		[pageWidth]
	);

	const handleResizeAlignment = useMemo(
		() => (handlePageOrientation === 'vertical' ? 'center' : 'flex-start'),
		[handlePageOrientation]
	);

	const areNetworksUp = useMemo(() => {
		if (chatsBeNetworkStatus !== undefined && websocketNetworkStatus !== undefined) {
			return chatsBeNetworkStatus && websocketNetworkStatus;
		}
		return false;
	}, [chatsBeNetworkStatus, websocketNetworkStatus]);

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

	const enterMeeting = useCallback(() => {
		MeetingsApi.enterMeeting(
			roomId,
			{
				videoStreamEnabled: mediaDevicesEnabled.video,
				audioStreamEnabled: mediaDevicesEnabled.audio
			},
			{ audioDevice: selectedDevicesId.audio, videoDevice: selectedDevicesId.video }
		)
			.then((meetingId) => {
				freeMediaResources(streamTrack);
				goToMeetingPage(meetingId);
			})
			.catch((err) => console.error(err, 'Error on joinMeeting'));
	}, [
		streamTrack,
		roomId,
		mediaDevicesEnabled.video,
		mediaDevicesEnabled.audio,
		selectedDevicesId.audio,
		selectedDevicesId.video,
		goToMeetingPage
	]);

	const joinWaitingRoom = useCallback(() => {
		joinMeeting()
			.then((resp) => {
				if (resp.status === 'WAITING') setUserIsReady(true);
				if (resp.status === 'ACCEPTED') goToMeetingPage(meetingId);
			})
			.catch((err) => console.error(err, 'Error on joinWaitingRoom'));
	}, [goToMeetingPage, joinMeeting, meetingId]);

	const handleAcceptance = useCallback(() => {
		joinMeeting()
			.then(() => {
				freeMediaResources(streamTrack);
				goToMeetingPage(meetingId);
			})
			.catch((err) => console.error(err, 'Error on joinMeeting'));
	}, [goToMeetingPage, joinMeeting, meetingId, streamTrack]);

	const handleRejected = useCallback(() => {
		freeMediaResources(streamTrack);
		goToInfoPage(PAGE_INFO_TYPE.NEXT_TIME_PAGE);
	}, [goToInfoPage, streamTrack]);

	const handleRejoin = useCallback(() => {
		goToInfoPage(PAGE_INFO_TYPE.ALREADY_ACTIVE_MEETING_SESSION);
	}, [goToInfoPage]);

	const handleMeetingEnded = useCallback(() => {
		goToInfoPage(PAGE_INFO_TYPE.MEETING_ENDED);
	}, [goToInfoPage]);

	const handleResize = useCallback(() => {
		setPageWidth(window.innerWidth);
		setWrapperWidth((window.innerWidth * 0.33) / calcScaleDivisor());
	}, []);

	const handleLeave = useCallback(() => {
		freeMediaResources(streamTrack);
		if (userIsReady) MeetingsApi.leaveWaitingRoom(meetingId);
		goToInfoPage(PAGE_INFO_TYPE.HANG_UP_PAGE);
	}, [goToInfoPage, meetingId, streamTrack, userIsReady]);

	useEffect(() => {
		window.addEventListener('resize', handleResize);

		return () => window.removeEventListener('resize', handleResize);
	}, [handleResize]);

	// Leave waiting list on window close
	useEffect(() => {
		window.parent.addEventListener('beforeunload', handleLeave);
		return () => {
			window.parent.removeEventListener('beforeunload', handleLeave);
		};
	}, [handleLeave]);

	useEffect(() => {
		setPageWidth(window.innerWidth);
		setWrapperWidth((window.innerWidth * 0.33) / calcScaleDivisor());
	}, []);

	useEffect(() => {
		if (videoStreamRef.current) {
			videoStreamRef.current.srcObject = streamTrack;
			setEnterButtonIsEnabled(true);
		}
	}, [streamTrack, mediaDevicesEnabled.audio, mediaDevicesEnabled.video]);

	useEventListener(EventName.MEETING_USER_ACCEPTED, handleAcceptance);
	useEventListener(EventName.MEETING_USER_REJECTED, handleRejected);
	useEventListener(EventName.MEETING_WAITING_PARTICIPANT_CLASHED, handleRejoin);
	useEventListener(EventName.MEETING_STOPPED, handleMeetingEnded);

	const enterButton = useMemo(() => {
		if (hasUserDirectAccess === undefined) return undefined;
		if (hasUserDirectAccess)
			return (
				<Tooltip
					label={enterButtonDisabledTooltip}
					disabled={areNetworksUp && enterButtonIsEnabled}
				>
					<Button
						data-testid="enterMeetingButton"
						width="fill"
						label={enter}
						onClick={enterMeeting}
						disabled={!(areNetworksUp && enterButtonIsEnabled)}
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
					onClick={joinWaitingRoom}
					width="fill"
					disabled={!enterButtonIsEnabled}
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
		enterButtonIsEnabled,
		enterMeeting,
		hasUserDirectAccess,
		joinWaitingRoom,
		readyLabel,
		readyToParticipateLabel,
		userIsReady
	]);

	const buttonsWrapper = useMemo(
		() => (
			<Container
				height="fit"
				orientation="horizontal"
				gap="1rem"
				mainAlignment={handleResizeAlignment}
			>
				<Row width={`50%`} minWidth="14rem">
					<Button
						width="fill"
						type="outlined"
						backgroundColor="text"
						icon="Mic"
						iconPlacement="right"
						label={videoPlayerTestMuted ? playMicLabel : stopMicLabel}
						onClick={onToggleAudioTest}
						disabled={!mediaDevicesEnabled.audio}
					/>
				</Row>
				<Row width={`50%`} minWidth="14rem">
					{enterButton}
				</Row>
			</Container>
		),
		[
			enterButton,
			handleResizeAlignment,
			mediaDevicesEnabled.audio,
			onToggleAudioTest,
			playMicLabel,
			stopMicLabel,
			videoPlayerTestMuted
		]
	);

	const leaveButton = useMemo(() => {
		if (hasUserDirectAccess === undefined) {
			return undefined;
		}
		return (
			!hasUserDirectAccess && (
				<CustomContainer
					height="fit"
					width="fit"
					mainAlignment="flex-end"
					crossAlignment="flex-start"
				>
					{handlePageOrientation !== 'vertical' ? (
						<Button
							backgroundColor="error"
							label={leave}
							icon="LogOut"
							iconPlacement="right"
							onClick={handleLeave}
						/>
					) : (
						<Tooltip label={leaveMeetingLabel}>
							<IconButton backgroundColor="error" icon="LogOut" onClick={handleLeave} />
						</Tooltip>
					)}
				</CustomContainer>
			)
		);
	}, [handleLeave, handlePageOrientation, hasUserDirectAccess, leave, leaveMeetingLabel]);

	const waitingRoomLabels = useMemo(() => {
		if (hasUserDirectAccess === undefined) return undefined;
		return (
			!hasUserDirectAccess && (
				<Container height="fit" crossAlignment={handleResizeAlignment}>
					<Text>{userIsReady ? areYouReadyLabel : whenYouAreReadyLabel}</Text>
					<Text>{aModeratorWillLetYouEnterLabel}</Text>
				</Container>
			)
		);
	}, [
		aModeratorWillLetYouEnterLabel,
		areYouReadyLabel,
		handleResizeAlignment,
		hasUserDirectAccess,
		userIsReady,
		whenYouAreReadyLabel
	]);

	return (
		<Container>
			<Container mainAlignment="center" crossAlignment="center" gap="1.5rem">
				<Text size="extralarge" weight="bold">
					{accessTitle}
				</Text>
				<Container
					orientation={handlePageOrientation}
					height="fit"
					width="fit"
					mainAlignment="center"
					crossAlignment="center"
					gap="2rem"
				>
					<Container height="fit" width={`${wrapperWidth}rem`} minWidth="35rem">
						<AccessTile
							videoStreamRef={videoStreamRef}
							videoPlayerTestMuted={videoPlayerTestMuted}
							mediaDevicesEnabled={mediaDevicesEnabled}
						/>
					</Container>
					<Container mainAlignment="flex-start" crossAlignment="flex-start" gap="1rem">
						<Container mainAlignment="center" crossAlignment="center" gap="2rem">
							<Container height="fit" crossAlignment={handleResizeAlignment}>
								<Text size="large">{howToJoinMeeting}</Text>
								<Padding bottom="0.25rem" />
								<Text>{setInputDevicesLabel}</Text>
							</Container>
							<LocalMediaHandler
								streamTrack={streamTrack}
								setStreamTrack={setStreamTrack}
								setEnterButtonIsEnabled={setEnterButtonIsEnabled}
								selectedDevicesId={selectedDevicesId}
								setSelectedDevicesId={setSelectedDevicesId}
								mediaDevicesEnabled={mediaDevicesEnabled}
								setMediaDevicesEnabled={setMediaDevicesEnabled}
							/>
							{buttonsWrapper}
						</Container>
						{waitingRoomLabels}
					</Container>
				</Container>
			</Container>
			{leaveButton}
		</Container>
	);
};

export default AccessMeetingPage;
