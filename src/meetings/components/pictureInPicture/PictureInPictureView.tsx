/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { ReactElement, useCallback, useContext, useEffect, useState } from 'react';

import styled from '@emotion/styled';
import { Button, Container, Icon, Padding, Text } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

import useMediaDevices from '../../../hooks/useMediaDevices';
import useTilesOrder from '../../../hooks/useTilesOrder';
import { updateAudioStreamStatus, updateMediaOffer } from '../../../network';
import {
	getNameOfFirstTalkingUser,
	getSelectedAudioDeviceId,
	getSelectedVideoDeviceId
} from '../../../store/selectors/ActiveMeetingSelectors';
import {
	getMeeting,
	getParticipantAudioStatus,
	getParticipantVideoStatus
} from '../../../store/selectors/MeetingSelectors';
import { getUserId } from '../../../store/selectors/SessionSelectors';
import useStore from '../../../store/Store';
import { STREAM_TYPE } from '../../../types/store/ActiveMeetingTypes';
import { getAudioStream, getVideoStream } from '../../../utils/UserMediaManager';
import { RouterContext } from '../../contexts/routerContext';
import LeaveMeetingButton from '../meetingActionsBar/LeaveMeetingButton';
import MeetingDuration from '../meetingActionsBar/MeetingDuration';
import Tile from '../tile/Tile';

const PipContainer = styled(Container)`
	background-color: ${({ theme }): string => theme.palette.gray0.regular};
	position: absolute;
`;

const CustomActionBar = styled(Container)`
	border-radius: 0.5rem;
`;

const CustomText = styled(Text)<{ $whoIsSpeaking: string | undefined }>`
	${({ $whoIsSpeaking }): string | false => !$whoIsSpeaking && 'font-style: italic;'};
	color: ${({ theme, $whoIsSpeaking }): string =>
		!$whoIsSpeaking ? theme.palette.secondary.regular : theme.palette.gray6.regular};
`;

const PictureInPictureView = (): ReactElement => {
	const { meetingId } = useContext(RouterContext);
	const [t] = useTranslation();

	const noOneTalking = t('meeting.pip.noTalking', "Nobody's talking right now.");

	const myUserId = useStore(getUserId);
	const meeting = useStore((store) => getMeeting(store, meetingId!));
	const whoIsSpeaking = useStore(getNameOfFirstTalkingUser);
	const videoOutConn = useStore((store) => store.activeMeeting?.videoOutConn);
	const videoStatus = useStore((store) => getParticipantVideoStatus(store, meetingId, myUserId));
	const selectedVideoDeviceId = useStore(getSelectedVideoDeviceId);
	const audioStatus = useStore((store) => getParticipantAudioStatus(store, meetingId, myUserId));
	const selectedAudioDeviceId = useStore(getSelectedAudioDeviceId);
	const websocketNetworkStatus = useStore(({ connections }) => connections.status.websocket);
	const bidirectionalAudioConn = useStore((store) => store.activeMeeting?.bidirectionalAudioConn);

	const { permission: audioPermission } = useMediaDevices('audio');
	const { permission: videoPermission } = useMediaDevices('video');

	const isSpeakingLabel = t('meeting.pip.speaking', `${whoIsSpeaking} is speaking.`, {
		userName: whoIsSpeaking
	});

	const [isSpeaking, setIsSpeaking] = useState<string | boolean | undefined>(true);

	useEffect(() => {
		setIsSpeaking(whoIsSpeaking);
	}, [whoIsSpeaking]);

	const toggleAudioStream = useCallback(
		(event: { stopPropagation: () => void }) => {
			event.stopPropagation();
			if (!audioStatus) {
				getAudioStream(selectedAudioDeviceId)
					.then((stream) => {
						bidirectionalAudioConn?.updateLocalStreamTrack(stream).then(() => {
							updateAudioStreamStatus(meetingId!, !audioStatus);
						});
					})
					.catch((e) => {
						console.log(e);
					});
			} else {
				bidirectionalAudioConn?.closeRtpSenderTrack();
				updateAudioStreamStatus(meetingId!, !audioStatus);
			}
		},
		[audioStatus, bidirectionalAudioConn, meetingId, selectedAudioDeviceId]
	);

	const toggleVideoStream = useCallback(
		(event: React.MouseEvent<HTMLButtonElement, MouseEvent> | KeyboardEvent) => {
			event.stopPropagation();
			if (!videoStatus) {
				if (!videoOutConn?.peerConn) {
					videoOutConn?.startVideo(selectedVideoDeviceId).catch(() => {});
				} else {
					getVideoStream(selectedVideoDeviceId)
						.then((stream) => {
							videoOutConn
								?.updateLocalStreamTrack(stream)
								.then(() => updateMediaOffer(meetingId!, STREAM_TYPE.VIDEO, true));
						})
						.catch((e) => {
							console.log(e);
						});
				}
			} else {
				videoOutConn?.stopVideo();
			}
		},
		[videoStatus, videoOutConn, selectedVideoDeviceId, meetingId]
	);

	const { centralTile } = useTilesOrder(meetingId!);

	return (
		<PipContainer
			padding="1rem"
			gap="0.5rem"
			mainAlignment="space-between"
			crossAlignment="flex-start"
		>
			<Container width="fill" height="fit" gap="0.5rem" crossAlignment="flex-start">
				<Text size="large" color="gray6">
					{meeting?.name}
				</Text>
				<Container mainAlignment="flex-start" height="fit" orientation="horizontal">
					{isSpeaking && (
						<>
							<Icon icon="VolumeUp" size="small" color="success" />
							<Padding right="0.5rem" />
						</>
					)}
					<CustomText
						size="small"
						weight="light"
						overflow="ellipsis"
						color="gray6"
						$whoIsSpeaking={whoIsSpeaking}
					>
						{whoIsSpeaking ? isSpeakingLabel : noOneTalking}
					</CustomText>
				</Container>
			</Container>
			<Tile
				userId={centralTile.userId}
				meetingId={meetingId}
				isScreenShare={centralTile.type === STREAM_TYPE.SCREEN}
				isPip
			/>
			<Container width="fill" height="fit" orientation="horizontal" mainAlignment="space-between">
				<CustomActionBar
					background={'text'}
					gap="0.5rem"
					padding="0.5rem"
					width="fit"
					orientation="horizontal"
				>
					<Button
						onClick={toggleVideoStream}
						icon={videoStatus ? 'Video' : 'VideoOff'}
						disabled={!websocketNetworkStatus || videoPermission !== 'granted'}
						size={'large'}
					/>
					<Button
						onClick={toggleAudioStream}
						icon={audioStatus ? 'Mic' : 'MicOff'}
						disabled={!websocketNetworkStatus || audioPermission !== 'granted'}
						size="large"
					/>
				</CustomActionBar>
				<CustomActionBar
					background={'text'}
					padding="0.5rem"
					gap="0.5rem"
					width="fit"
					orientation="horizontal"
				>
					<MeetingDuration meetingId={meetingId} isPip />
					<LeaveMeetingButton isHoovering oneClickLeave isPip />
				</CustomActionBar>
			</Container>
		</PipContainer>
	);
};

export default PictureInPictureView;
