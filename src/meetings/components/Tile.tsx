/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
	Avatar,
	Container,
	IconButton,
	Padding,
	Row,
	Shimmer,
	Text,
	Tooltip,
	useTheme
} from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import useMuteForAll from '../../hooks/useMuteForAll';
import usePinnedTile from '../../hooks/usePinnedTile';
import { UsersApi } from '../../network';
import { getUserIsTalking, getStream } from '../../store/selectors/ActiveMeetingSelectors';
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
	border-radius: 0.5rem;
	height: auto;
	opacity: 0;
	position: absolute;
	background-color: rgba(255, 255, 255, 0.7);
	z-index: 1;
	-webkit-transition: opacity 200ms linear 300ms;
	-moz-transition: opacity 200ms linear 300ms;
	-o-transition: opacity 200ms linear 300ms;
	transition: opacity 100ms linear 200ms;
`;

const CustomTile = styled(Container)<{ $isTalking: boolean; $isHovering: boolean }>`
	position: relative;
	aspect-ratio: 16/9;
	height: auto;
	min-width: 9.375rem;
	border-radius: 0.5rem;
	${({ $isTalking, theme }): string | false =>
		$isTalking && `outline: 0.125rem solid ${theme.palette.success.regular};`}
	&:hover {
		${HoverContainer} {
			opacity: ${({ $isHovering }): number => ($isHovering ? 1 : 0)};
		}
	}
`;

const InfoContainer = styled(Container)`
	height: auto;
	aspect-ratio: 16/9;
	position: absolute;
`;

const CustomContainer = styled(Container)`
	aspect-ratio: 16/9;
	position: absolute;
`;

const VideoEl = styled.video<{ isScreenShare: boolean }>`
	${({ isScreenShare }): string | false => !isScreenShare && 'object-fit: cover;'}
	aspect-ratio: 16/9;
	width: inherit;
	border-radius: 0.5rem;
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
	const pinVideoLabel = t('tooltip.pinVideo', 'Pin video');
	const unpinVideoLabel = t('tooltip.unpinVideo', 'Unpin video');
	const muteForAllLabel = t('tooltip.muteForAll', 'Mute for all');

	const isSessionTile = useStore(getUserId) === userId;
	const userName = useStore((store) => getUserName(store, userId || ''));
	const audioStatus = useStore((store) => getParticipantAudioStatus(store, meetingId, userId));
	const videoStatus = useStore((store) => getParticipantVideoStatus(store, meetingId, userId));
	const videoStream = useStore((store) =>
		getStream(
			store,
			meetingId || '',
			userId || '',
			!isScreenShare ? STREAM_TYPE.VIDEO : STREAM_TYPE.SCREEN
		)
	);
	const userPictureUpdatedAt: string | undefined = useStore((state) =>
		getUserPictureUpdatedAt(state, userId || '')
	);
	const userIsTalking = useStore((store) => getUserIsTalking(store, meetingId || '', userId || ''));

	const [picture, setPicture] = useState<false | string>(false);
	const [isHoovering, setIsHoovering] = useState<boolean>(false);

	const streamRef = useRef<null | HTMLVideoElement>(null);
	const themeColor = useTheme();

	const { canUsePinFeature, isPinned, switchPinnedTile } = usePinnedTile(
		meetingId || '',
		userId || '',
		isScreenShare
	);

	const hoverRef = useRef<HTMLDivElement>(null);

	const { muteForAllHasToAppear, muteForAll } = useMuteForAll(meetingId, userId);

	let timeout: string | number | NodeJS.Timeout | undefined;

	useEffect(() => {
		if (streamRef && streamRef.current) {
			if (videoStream && (videoStatus || isScreenShare)) {
				streamRef.current.srcObject = videoStream;
			} else {
				streamRef.current.srcObject = null;
			}
		}
	}, [isScreenShare, videoStatus, videoStream]);

	useEffect(() => {
		if (userPictureUpdatedAt != null) {
			setPicture(`${UsersApi.getURLUserPicture(userId || '')}?${userPictureUpdatedAt}`);
		} else {
			setPicture(false);
		}
	}, [userId, userPictureUpdatedAt]);

	const audioStreamEnabled = useMemo(() => {
		if (modalProps) return modalProps.audioStreamEnabled;
		if (isScreenShare) return true;
		return audioStatus;
	}, [audioStatus, isScreenShare, modalProps]);

	const videoStreamEnabled = useMemo(() => {
		if (modalProps) {
			return modalProps.videoStreamEnabled;
		}
		if (isScreenShare) return true;
		return videoStatus;
	}, [isScreenShare, modalProps, videoStatus]);

	const userColor = useMemo(() => {
		const color = calculateAvatarColor(userName || '');
		return `${themeColor.avatarColors[color]}`;
	}, [userName, themeColor.avatarColors]);

	const canUseMuteForAll = useMemo(
		() => !isScreenShare && muteForAllHasToAppear,
		[isScreenShare, muteForAllHasToAppear]
	);

	const showHoverContainer = useMemo(
		() => !modalProps && (canUsePinFeature || muteForAllHasToAppear),
		[canUsePinFeature, modalProps, muteForAllHasToAppear]
	);

	const handleHoverMouseMove = useCallback(() => {
		clearTimeout(timeout);
		setIsHoovering(true);

		// eslint-disable-next-line react-hooks/exhaustive-deps
		timeout = setTimeout(() => {
			setIsHoovering(false);
		}, 2000);
	}, [isHoovering]);

	useEffect(() => {
		let elRef: React.RefObject<HTMLDivElement> | null = hoverRef;
		if (elRef?.current) {
			elRef.current.addEventListener('mousemove', handleHoverMouseMove);
		}

		return (): void => {
			if (elRef?.current) {
				elRef.current.removeEventListener('mousemove', handleHoverMouseMove);
				elRef = null;
			}
		};
	}, [handleHoverMouseMove]);

	const avatarComponent = useMemo(
		() =>
			userName ? (
				<StyledAvatar
					label={userName}
					title={userName}
					shape="round"
					size="extralarge"
					background={userColor}
					picture={picture || ''}
				/>
			) : (
				<StyledShimmerAvatar />
			),
		[picture, userColor, userName]
	);

	const placeHolderFn = (): null => null;

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
							onClick={placeHolderFn}
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
							onClick={placeHolderFn}
						/>
					</Tooltip>
				)}
				{canUsePinFeature && isPinned && (
					<CustomIconButton
						icon="Pin3Outline"
						iconColor="gray6"
						backgroundColor="gray0"
						size="large"
						onClick={placeHolderFn}
					/>
				)}
				{isScreenShare && (
					<CustomIconButton
						icon="ScreenSharingOnOutline"
						iconColor="gray6"
						backgroundColor="gray0"
						size="large"
						onClick={placeHolderFn}
					/>
				)}
			</>
		),
		[
			audioStreamEnabled,
			camOffLabel,
			canUsePinFeature,
			isPinned,
			isScreenShare,
			isSessionTile,
			micOffLabel,
			videoStreamEnabled
		]
	);

	const hoverContainer = useMemo(
		() => (
			<HoverContainer width="100%" data-testid="hover_container" orientation="horizontal">
				{canUseMuteForAll && (
					<Tooltip label={muteForAllLabel} disabled={!isHoovering}>
						<IconButton
							icon="MicOffOutline"
							iconColor="text"
							backgroundColor="gray6"
							size="large"
							borderRadius="round"
							customSize={{ iconSize: '1.5rem', paddingSize: '0.75rem' }}
							onClick={muteForAll}
						/>
					</Tooltip>
				)}
				{canUseMuteForAll && canUsePinFeature && <Padding right="1rem" />}
				{canUsePinFeature && (
					<Tooltip label={isPinned ? unpinVideoLabel : pinVideoLabel} disabled={!isHoovering}>
						<IconButton
							icon={!isPinned ? 'Pin3Outline' : 'Unpin3Outline'}
							iconColor="text"
							backgroundColor="gray6"
							size="large"
							borderRadius="round"
							customSize={{ iconSize: '1.5rem', paddingSize: '0.75rem' }}
							onClick={switchPinnedTile}
						/>
					</Tooltip>
				)}
			</HoverContainer>
		),
		[
			canUseMuteForAll,
			muteForAllLabel,
			isHoovering,
			muteForAll,
			canUsePinFeature,
			isPinned,
			unpinVideoLabel,
			pinVideoLabel,
			switchPinnedTile
		]
	);

	return (
		<CustomTile
			background={'text'}
			data-testid="tile"
			width="100%"
			$isTalking={userIsTalking && !isScreenShare}
			ref={hoverRef}
			$isHovering={isHoovering}
		>
			{showHoverContainer && hoverContainer}
			<InfoContainer orientation="horizontal">
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
					<TextContainer width={'fit'} height={'fit'}>
						<Text color={'gray6'}>{userName}</Text>
					</TextContainer>
				</Row>
			</InfoContainer>
			<VideoEl
				playsInline
				autoPlay
				muted={modalProps ? modalProps.streamMuted : true}
				controls={false}
				ref={modalProps ? modalProps.streamRef : streamRef}
				isScreenShare={!!isScreenShare}
			/>
			{!videoStreamEnabled && (
				<CustomContainer data-testid="avatar_box">{avatarComponent}</CustomContainer>
			)}
		</CustomTile>
	);
};

export default Tile;
