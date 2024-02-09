/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { ReactElement, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
	Button,
	Container,
	Modal,
	Padding,
	Text,
	Tooltip,
	useTheme
} from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import useRouting from '../../../../hooks/useRouting';
import { MeetingsApi } from '../../../../network';
import {
	getRoomNameSelector,
	getRoomTypeSelector
} from '../../../../store/selectors/RoomsSelectors';
import useStore from '../../../../store/Store';
import { RoomType } from '../../../../types/store/RoomTypes';
import { freeMediaResources } from '../../../../utils/MeetingsUtils';
import AccessTile from '../mediaHandlers/AccessTile';
import LocalMediaHandler from '../mediaHandlers/LocalMediaHandler';

type AccessMeetingModalProps = {
	roomId: string;
};

const VideoTile = styled(Container)`
	box-sizing: border-box;
	position: relative;
	list-style: none;
	height: ${({ width }): string => `calc(calc(${width}px / 16) * 9)`};
	width: ${({ width }): string => `${width}px`};
	background: ${({ theme }): string => theme.palette.gray0.regular};
	border-radius: 0.3125rem !important;
	overflow: hidden;
`;

const CustomModal = styled(Modal)`
	cursor: default;
	user-select: none;
`;

const AccessMeetingModal = ({ roomId }: AccessMeetingModalProps): ReactElement => {
	const [t] = useTranslation();
	const enter = t('action.enter', 'Enter');
	const playMicLabel = t('meeting.interactions.playMic', 'Start microphone testing');
	const stopMicLabel = t('meeting.interactions.stopMic', 'Stop microphone testing');
	const joinMeetingDescription = t(
		'meeting.joinMeetingDescription',
		'How do you want to join this meeting?'
	);
	const setInputDescription = t(
		'meeting.setInputDescription',
		'Set your input devices by choosing them from dropdown menu'
	);

	const enterButtonDisabledTooltip = t(
		'meeting.startModal.audioAndVideoLoading',
		'Assets are loading'
	);

	const conversationTitle = useStore((store) => getRoomNameSelector(store, roomId));

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

	const theme = useTheme();

	const { goToMeetingPage } = useRouting();

	const roomType = useStore((store) => getRoomTypeSelector(store, roomId));

	const chatsBeNetworkStatus = useStore(({ connections }) => connections.status.chats_be);
	const websocketNetworkStatus = useStore(({ connections }) => connections.status.websocket);
	const [streamTrack, setStreamTrack] = useState<MediaStream | null>(null);
	const [wrapperWidth, setWrapperWidth] = useState<number>(0);
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

	const wrapperRef = useRef<HTMLDivElement>(null);
	const videoStreamRef = useRef<HTMLVideoElement>(null);

	useEffect(() => {
		if (wrapperRef.current) setWrapperWidth(wrapperRef.current.offsetWidth);
	}, [wrapperRef]);

	useEffect(() => {
		if (videoStreamRef.current) {
			videoStreamRef.current.srcObject = streamTrack;
			setEnterButtonIsEnabled(true);
		}
	}, [streamTrack, mediaDevicesEnabled.audio, mediaDevicesEnabled.video]);

	const areNetworksUp = useMemo(() => {
		if (chatsBeNetworkStatus !== undefined && websocketNetworkStatus !== undefined) {
			return chatsBeNetworkStatus && websocketNetworkStatus;
		}
		return false;
	}, [chatsBeNetworkStatus, websocketNetworkStatus]);

	const modalTitle = useMemo(
		() => (roomType === RoomType.ONE_TO_ONE ? oneToOneTitle : groupTitle),
		[groupTitle, oneToOneTitle, roomType]
	);

	const onToggleAudioTest = useCallback(() => {
		setVideoPlayerTestMuted((prevState) => !prevState);
	}, []);

	const joinMeeting = useCallback(() => {
		freeMediaResources(streamTrack);
		MeetingsApi.enterMeeting(
			roomId,
			{
				videoStreamEnabled: mediaDevicesEnabled.video,
				audioStreamEnabled: mediaDevicesEnabled.audio
			},
			{ audioDevice: selectedDevicesId.audio, videoDevice: selectedDevicesId.video }
		)
			.then((meetingId) => goToMeetingPage(meetingId))
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

	const modalFooter = useMemo(
		() => (
			<Container mainAlignment="space-between" orientation="horizontal">
				<Button
					type="outlined"
					backgroundColor={'text'}
					label={videoPlayerTestMuted ? playMicLabel : stopMicLabel}
					onClick={onToggleAudioTest}
					disabled={!mediaDevicesEnabled.audio}
				/>
				<Tooltip
					label={enterButtonDisabledTooltip}
					disabled={areNetworksUp && enterButtonIsEnabled}
				>
					<Button
						data-testid="enterMeetingButton"
						label={enter}
						onClick={joinMeeting}
						disabled={!(areNetworksUp && enterButtonIsEnabled)}
					/>
				</Tooltip>
			</Container>
		),
		[
			areNetworksUp,
			enter,
			enterButtonDisabledTooltip,
			enterButtonIsEnabled,
			joinMeeting,
			mediaDevicesEnabled.audio,
			onToggleAudioTest,
			playMicLabel,
			stopMicLabel,
			videoPlayerTestMuted
		]
	);

	return (
		<Container background={theme.palette.gray1.hover}>
			<CustomModal
				background={'gray0'}
				open
				size="small"
				showCloseIcon={false}
				title={modalTitle}
				customFooter={modalFooter}
			>
				<Padding top="small" />
				<Container
					padding={{ top: 'small' }}
					ref={wrapperRef}
					height="fit"
					width="fill"
					mainAlignment="flex-start"
				>
					<VideoTile width={wrapperWidth}>
						<AccessTile
							videoStreamRef={videoStreamRef}
							videoPlayerTestMuted={videoPlayerTestMuted}
							mediaDevicesEnabled={mediaDevicesEnabled}
						/>
					</VideoTile>
					<Padding top="1rem" />
					<Text weight="bold">{joinMeetingDescription}</Text>
					<Padding top="1rem" />
					<LocalMediaHandler
						streamTrack={streamTrack}
						setStreamTrack={setStreamTrack}
						setEnterButtonIsEnabled={setEnterButtonIsEnabled}
						selectedDevicesId={selectedDevicesId}
						setSelectedDevicesId={setSelectedDevicesId}
						mediaDevicesEnabled={mediaDevicesEnabled}
						setMediaDevicesEnabled={setMediaDevicesEnabled}
					/>
					<Padding bottom="1rem" />
					<Text size="small">{setInputDescription}</Text>
					<Padding bottom="1rem" />
				</Container>
			</CustomModal>
		</Container>
	);
};

export default AccessMeetingModal;
