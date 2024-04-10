/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, {
	Dispatch,
	FC,
	SetStateAction,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState
} from 'react';

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
import styled from 'styled-components';

import AccessTile from './mediaHandlers/AccessTile';
import LocalMediaHandler from './mediaHandlers/LocalMediaHandler';
import { MEETINGS_PATH } from '../../../constants/appConstants';
import useEventListener, { EventName } from '../../../hooks/useEventListener';
import useRouting from '../../../hooks/useRouting';
import { MeetingsApi } from '../../../network';
import { getRoomIdFromMeeting } from '../../../store/selectors/MeetingSelectors';
import { getRoomNameSelector } from '../../../store/selectors/RoomsSelectors';
import useStore from '../../../store/Store';
import { freeMediaResources } from '../../../utils/MeetingsUtils';

type AccessMeetingPageMediaSectionProps = {
	streamTrack: MediaStream | null;
	setStreamTrack: Dispatch<SetStateAction<MediaStream | null>>;
	hasUserDirectAccess: boolean | undefined;
	userIsReady: boolean;
	setUserIsReady: Dispatch<SetStateAction<boolean>>;
	meetingName: string;
	wrapperWidth: number;
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

const AccessMeetingPageMediaSection: FC<AccessMeetingPageMediaSectionProps> = ({
	streamTrack,
	setStreamTrack,
	hasUserDirectAccess,
	userIsReady,
	setUserIsReady,
	meetingName,
	wrapperWidth
}) => {
	const [t] = useTranslation();
	const meetingId = useMemo(() => document.location.pathname.split(MEETINGS_PATH)[1], []);
	const roomId = useStore((store) => getRoomIdFromMeeting(store, meetingId) ?? ``);
	const conversationTitle = useStore((store) => getRoomNameSelector(store, roomId));

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

	const { goToMeetingPage } = useRouting();

	const chatsBeNetworkStatus = useStore(({ connections }) => connections.status.chats_be);
	const websocketNetworkStatus = useStore(({ connections }) => connections.status.websocket);

	const [videoPlayerTestMuted, setVideoPlayerTestMuted] = useState<boolean>(true);
	const [enterButtonIsEnabled, setEnterButtonIsEnabled] = useState<boolean>(false);
	const [selectedDevicesId, setSelectedDevicesId] = useState<{
		audio: string | undefined;
		video: string | undefined;
	}>({ audio: undefined, video: undefined });
	const [mediaDevicesEnabled, setMediaDevicesEnabled] = useState<{
		audio: boolean;
		video: boolean;
	}>({ audio: false, video: false });

	const videoStreamRef = useRef<HTMLVideoElement>(null);

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

	const onToggleAudioTest = useCallback(() => {
		setVideoPlayerTestMuted((prevState) => !prevState);
	}, [setVideoPlayerTestMuted]);

	// handle waiting room flow and events
	const waitingRoomHandler = useCallback(() => {
		MeetingsApi.joinMeeting(
			meetingId,
			{
				videoStreamEnabled: mediaDevicesEnabled.video,
				audioStreamEnabled: mediaDevicesEnabled.audio
			},
			{ audioDevice: selectedDevicesId.audio, videoDevice: selectedDevicesId.video }
		)
			.then((resp) => {
				if (resp.status === 'WAITING') setUserIsReady(true);
				if (resp.status === 'ACCEPTED') {
					freeMediaResources(streamTrack);
					goToMeetingPage(meetingId);
				}
			})
			.catch((err) => console.error(err, 'Error on waitingRoomHandler'));
	}, [
		goToMeetingPage,
		mediaDevicesEnabled,
		meetingId,
		selectedDevicesId,
		setUserIsReady,
		streamTrack
	]);

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
					onClick={waitingRoomHandler}
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
		waitingRoomHandler,
		readyLabel,
		readyToParticipateLabel,
		userIsReady
	]);

	const buttonsWrapper = useMemo(
		() => (
			<Container height="fit" orientation="horizontal" gap="1rem" mainAlignment="flex-start">
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
			mediaDevicesEnabled.audio,
			onToggleAudioTest,
			playMicLabel,
			stopMicLabel,
			videoPlayerTestMuted
		]
	);

	// handle change of video stream
	useEffect(() => {
		if (videoStreamRef.current) {
			videoStreamRef.current.srcObject = streamTrack;
			setEnterButtonIsEnabled(true);
		}
	}, [streamTrack, mediaDevicesEnabled, setEnterButtonIsEnabled]);

	useEventListener(EventName.MEETING_USER_ACCEPTED, waitingRoomHandler);

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
					videoPlayerTestMuted={videoPlayerTestMuted}
					mediaDevicesEnabled={mediaDevicesEnabled}
				/>
			</Container>
			<Container mainAlignment="flex-start" crossAlignment="flex-start" gap="1rem">
				<Container mainAlignment="center" crossAlignment="center" gap="2rem">
					<AlignWrapper height="fit">
						<Text size="large">{howToJoinMeeting}</Text>
						<Padding bottom="0.25rem" />
						<Text>{setInputDevicesLabel}</Text>
					</AlignWrapper>
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
		</ResizeWrapper>
	);
};

export default AccessMeetingPageMediaSection;
