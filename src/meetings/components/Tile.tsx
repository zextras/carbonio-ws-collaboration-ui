/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import {
	Avatar,
	Container,
	IconButton,
	Row,
	Shimmer,
	Text,
	Tooltip,
	useTheme
} from '@zextras/carbonio-design-system';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import usePinnedTile from '../../hooks/usePinnedTile';
import { UsersApi } from '../../network';
import { getStream } from '../../store/selectors/ActiveMeetingSelectors';
import {
	getParticipantAudioStatus,
	getParticipantVideoStatus
} from '../../store/selectors/MeetingSelectors';
import { getUserId } from '../../store/selectors/SessionSelectors';
import { getUserName, getUserPictureUpdatedAt } from '../../store/selectors/UsersSelectors';
import useStore from '../../store/Store';
import { STREAM_TYPE } from '../../types/store/ActiveMeetingTypes';
import { calculateAvatarColor } from '../../utils/styleUtils';

type modalTileProps = {
	streamRef: React.MutableRefObject<HTMLVideoElement | null>;
	streamMuted: boolean;
	videoStreamEnabled: boolean;
	audioStreamEnabled: boolean;
};

type TileProps = {
	userId: string | undefined;
	meetingId: string | undefined;
	isScreenShare?: boolean;
	modalProps?: modalTileProps;
};

const HoverContainer = styled(Container)`
	aspect-ratio: 16/9;
	height: auto;
	opacity: 0;
	position: absolute;
	background-color: rgba(255, 255, 255, 0.7);
	z-index: 1;
`;

const CustomTile = styled(Container)`
	position: relative;
	aspect-ratio: 16/9;
	height: auto;
	min-width: 9.375rem;
	border-radius: 8px;
	&:hover {
		${HoverContainer} {
			opacity: 1;
		}
	}
`;

const ActionContainer = styled(Container)`
	height: auto;
	aspect-ratio: 16/9;
	position: absolute;
`;

const VideoEl = styled.video`
	object-fit: cover;
	aspect-ratio: 16/9;
	width: inherit;
	border-radius: 8px;
	&:hover {
		${HoverContainer} {
			opacity: 1;
		}
	}
`;

const StyledAvatar = styled(Avatar)`
	min-height: 3.125rem;
	min-width: 3.125rem;
	height: 49%;
	width: 27.5%;
	aspect-ratio: 1;
	max-height: 8.75rem;
	max-width: 8.75rem;
`;

const StyledShimmerAvatar = styled(Shimmer.Avatar)`
	min-height: 3.125rem;
	min-width: 3.125rem;
	height: 49%;
	width: 27.5%;
	aspect-ratio: 1;
	max-height: 8.75rem;
	max-width: 8.75rem;
`;

const CustomIconButton = styled(IconButton)`
	cursor: default;
	z-index: 1;
	&:hover {
		background-color: ${({ theme }): string => theme.palette.gray0.regular} !important;
		color: ${({ theme }): string => theme.palette.gray6.regular} !important;
	}
`;

const TextContainer = styled(Container)`
	position: absolute;
	max-width: 90%;
	background-color: ${({ theme }): string => theme.palette.text.regular};
	border-radius: 0.25rem;
	padding: 0.25rem 0.5rem;
	z-index: 2;
	user-select: none;
`;

const Tile: React.FC<TileProps> = ({ userId, meetingId, isScreenShare, modalProps }) => {
	const [t] = useTranslation();
	const micOffLabel = t('meetings.interactions.yourMicIsDisabled', 'Your microphone is off');
	const camOffLabel = t('meetings.interactions.yourCamIsDisabled', 'Your camera is off');

	const isSessionTile = useStore(getUserId) === userId;
	const userName = useStore((store) => getUserName(store, userId || ''));
	const audioStatus = useStore((store) => getParticipantAudioStatus(store, meetingId, userId));
	const videoStatus = useStore((store) => getParticipantVideoStatus(store, meetingId, userId));
	const videoStream = useStore((store) =>
		getStream(store, meetingId || '', userId || '', STREAM_TYPE.VIDEO)
	);

	const [picture, setPicture] = useState<false | string>(false);

	const streamRef = useRef<null | HTMLVideoElement>(null);

	const userPictureUpdatedAt: string | undefined = useStore((state) =>
		getUserPictureUpdatedAt(state, userId || '')
	);

	const themeColor = useTheme();

	const { canUsePinFeature, isPinned, switchPinnedTile } = usePinnedTile(
		meetingId || '',
		userId || '',
		isScreenShare
	);

	useEffect(() => {
		if (streamRef && streamRef.current) {
			if (videoStream && videoStatus) {
				streamRef.current.srcObject = videoStream;
			} else {
				streamRef.current.srcObject = null;
			}
		}
	}, [videoStatus, videoStream]);

	useEffect(() => {
		if (userPictureUpdatedAt != null) {
			setPicture(`${UsersApi.getURLUserPicture(userId || '')}?${userPictureUpdatedAt}`);
		} else {
			setPicture(false);
		}
	}, [userId, userPictureUpdatedAt]);

	const finalStreamRef = useMemo(() => {
		if (modalProps) {
			return modalProps.streamRef;
		}
		return streamRef;
	}, [modalProps, streamRef]);

	const audioStreamEnabled = useMemo(() => {
		if (modalProps) {
			return modalProps.audioStreamEnabled;
		}
		return audioStatus;
	}, [audioStatus, modalProps]);

	const videoStreamEnabled = useMemo(() => {
		if (modalProps) {
			return modalProps.videoStreamEnabled;
		}
		return videoStatus;
	}, [modalProps, videoStatus]);

	const userColor = useMemo(() => {
		const color = calculateAvatarColor(userName || '');
		return `${themeColor.avatarColors[color]}`;
	}, [userName, themeColor.avatarColors]);

	const avatarComponent = useMemo(
		() =>
			userName ? (
				<StyledAvatar
					label={userName}
					title={userName}
					shape="round"
					size="extralarge"
					background={userColor}
					picture={picture}
				/>
			) : (
				<StyledShimmerAvatar />
			),
		[picture, userColor, userName]
	);

	const mediaStatusIcons = useMemo(
		() => (
			<>
				{!videoStreamEnabled && (
					<Tooltip label={camOffLabel} disabled={!isSessionTile}>
						<CustomIconButton
							icon="VideoOffOutline"
							iconColor="gray6"
							backgroundColor="gray0"
							size="large"
							onClick={null}
						/>
					</Tooltip>
				)}
				{!audioStreamEnabled && (
					<Tooltip label={micOffLabel} disabled={!isSessionTile}>
						<CustomIconButton
							icon="MicOffOutline"
							iconColor="gray6"
							backgroundColor="gray0"
							size="large"
							onClick={null}
						/>
					</Tooltip>
				)}
				{canUsePinFeature && isPinned && (
					<CustomIconButton
						icon="Pin3Outline"
						iconColor="gray6"
						backgroundColor="gray0"
						size="large"
						onClick={null}
					/>
				)}
			</>
		),
		[
			audioStreamEnabled,
			camOffLabel,
			canUsePinFeature,
			isPinned,
			isSessionTile,
			micOffLabel,
			videoStreamEnabled
		]
	);

	const hoverContainer = useMemo(
		() => (
			<HoverContainer width="100%" data-testid="hover_container" orientation="horizontal">
				{/* {audioStreamEnabled && ( */}
				{/*	<> */}
				{/*		<IconButton */}
				{/*			icon="MicOffOutline" */}
				{/*			iconColor="text" */}
				{/*			backgroundColor="gray6" */}
				{/*			size="large" */}
				{/*			borderRadius="round" */}
				{/*			customSize={{ iconSize: '1.5rem', paddingSize: '0.75rem' }} */}
				{/*			onClick={null} */}
				{/*		/> */}
				{/*		<Padding right="1rem" /> */}
				{/*	</> */}
				{/* )} */}
				{canUsePinFeature && (
					<IconButton
						icon={!isPinned ? 'Pin3Outline' : 'Unpin3Outline'}
						iconColor="text"
						backgroundColor="gray6"
						size="large"
						borderRadius="round"
						customSize={{ iconSize: '1.5rem', paddingSize: '0.75rem' }}
						onClick={switchPinnedTile}
					/>
				)}
			</HoverContainer>
		),
		[canUsePinFeature, isPinned, switchPinnedTile]
	);

	const showHoverContainer = useMemo(() => canUsePinFeature, [canUsePinFeature]);

	return (
		<CustomTile background={'text'} data-testid="tile" width="100%">
			{showHoverContainer && hoverContainer}
			<ActionContainer orientation="horizontal">
				<Row
					orientation="horizontal"
					mainAlignment={'flex-start'}
					crossAlignment={'flex-start'}
					height="fill"
					padding="0.5rem"
					style={{ gap: '0.5rem' }}
				>
					{mediaStatusIcons}
				</Row>
				<Row
					mainAlignment={'flex-end'}
					crossAlignment={'flex-end'}
					height="fill"
					takeAvailableSpace
					padding="0.5rem"
				>
					<TextContainer width={'fit'} height={'fit'} overflow="ellipsis">
						<Text color={'gray6'}>{userName}</Text>
					</TextContainer>
				</Row>
			</ActionContainer>
			{videoStreamEnabled ? (
				<VideoEl
					playsInline
					autoPlay
					muted={modalProps ? modalProps.streamMuted : true}
					controls={false}
					ref={finalStreamRef}
				/>
			) : (
				<Container data-testid="avatar_box">{avatarComponent}</Container>
			)}
		</CustomTile>
	);
};

export default Tile;
