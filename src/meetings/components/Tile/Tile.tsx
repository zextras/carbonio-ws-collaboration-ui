/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import {
	Avatar,
	Container,
	IconButton,
	Padding,
	Text,
	useTheme
} from '@zextras/carbonio-design-system';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';

import { UsersApi } from '../../../network';
import { getStream } from '../../../store/selectors/ActiveMeetingSelectors';
import {
	getParticipantAudioStatus,
	getParticipantVideoStatus
} from '../../../store/selectors/MeetingSelectors';
// import { getUserId } from '../../../store/selectors/SessionSelectors';
import { getUserName, getUserPictureUpdatedAt } from '../../../store/selectors/UsersSelectors';
import useStore from '../../../store/Store';
import { STREAM_TYPE } from '../../../types/store/ActiveMeetingTypes';
import { calculateAvatarColor } from '../../../utils/styleUtils';

type modalTileProps = {
	streamRef: React.MutableRefObject<HTMLVideoElement | null>;
	streamMuted: boolean;
	videoStreamEnabled: boolean;
	audioStreamEnabled: boolean;
};

type TileProps = {
	memberId: string | undefined;
	meetingId: string | undefined;
	// isScreenShare?: boolean;
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

const StyledAvatar = styled(Avatar)`
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
`;

export const AvatarContainer = styled(Container)`
	position: relative;
`;

const TextContainer = styled(Container)`
	background-color: ${({ theme }): string => theme.palette.text.regular};
	border-radius: 0.25rem;
	padding: 0.25rem 0.5rem;
	z-index: 2;
	max-width: 100%;
	user-select: none;
`;

const CustomContainer = styled(Container)`
	aspect-ratio: 16/9;
	height: auto;
	position: absolute;
	padding: 0.5rem;
`;

const CustomTile = styled(Container)`
	aspect-ratio: 16/9;
	height: auto;
	border-radius: 8px;
	&:hover {
		${HoverContainer} {
			opacity: 1;
		}
	}
`;

const VideoEl = styled.video`
	width: inherit;
	border-radius: 8px;
	&:hover {
		${HoverContainer} {
			opacity: 1;
		}
	}
`;

const Tile: React.FC<TileProps> = ({ memberId, meetingId, modalProps }) => {
	// const isSessionTile = useStore(getUserId) === memberId;
	const userName = useStore((store) => getUserName(store, memberId || ''));
	const audioStatus = useStore((store) => getParticipantAudioStatus(store, meetingId, memberId));
	const videoStatus = useStore((store) => getParticipantVideoStatus(store, meetingId, memberId));
	const videoStream = useStore((store) =>
		getStream(store, meetingId || '', memberId || '', STREAM_TYPE.VIDEO)
	);

	const [picture, setPicture] = useState<false | string>(false);

	const streamRef = useRef<null | HTMLVideoElement>(null);

	const userPictureUpdatedAt: string | undefined = useStore((state) =>
		getUserPictureUpdatedAt(state, memberId || '')
	);

	const themeColor = useTheme();

	useEffect(() => {
		if (streamRef && streamRef.current) {
			if (videoStream) {
				streamRef.current.srcObject = videoStream;
			} else {
				streamRef.current.srcObject = null;
			}
		}
	}, [videoStatus, videoStream]);

	useEffect(() => {
		if (userPictureUpdatedAt != null) {
			setPicture(`${UsersApi.getURLUserPicture(memberId || '')}?${userPictureUpdatedAt}`);
		} else {
			setPicture(false);
		}
	}, [memberId, userPictureUpdatedAt]);

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

	return (
		<CustomTile background={'text'} data-testid="tile" width="100%">
			{
				// TODO uncomment when the actions on hover are implemented
				/*! isSessionTile && (
				<HoverContainer
					width="100%"
					data-testid="hover_container"
					orientation="horizontal"
				>
					{audioStreamEnabled && (
						<>
							<IconButton
								icon="MicOffOutline"
								iconColor="text"
								backgroundColor="gray6"
								size="large"
								borderRadius="round"
								customSize={{ iconSize: '1.5rem', paddingSize: '0.75rem' }}
								onClick={null}
							/>
							<Padding right="1rem" />
						</>
					)}
					<IconButton
						icon="Pin3Outline"
						iconColor="text"
						backgroundColor="gray6"
						size="large"
						borderRadius="round"
						customSize={{ iconSize: '1.5rem', paddingSize: '0.75rem' }}
						onClick={null}
					/>
				</HoverContainer>
			) */
			}
			<CustomContainer
				orientation="horizontal"
				width="100%"
				mainAlignment={'flex-start'}
				crossAlignment={'flex-start'}
			>
				{!audioStreamEnabled && (
					<>
						<CustomIconButton
							icon="MicOffOutline"
							iconColor="gray6"
							backgroundColor="gray0"
							size="large"
							onClick={null}
						/>
						<Padding right="0.5rem" />
					</>
				)}
				{!videoStreamEnabled && (
					<CustomIconButton
						icon="VideoOffOutline"
						iconColor="gray6"
						backgroundColor="gray0"
						size="large"
						onClick={null}
					/>
				)}
			</CustomContainer>
			{videoStreamEnabled ? (
				<VideoEl
					playsInline
					autoPlay
					muted={modalProps ? modalProps.streamMuted : true}
					controls={false}
					ref={finalStreamRef}
				/>
			) : (
				<AvatarContainer data-testid="avatar_box">
					<StyledAvatar
						label={userName || ''}
						title={userName || ''}
						shape="round"
						size="extralarge"
						background={userColor}
						picture={picture}
					/>
				</AvatarContainer>
			)}
			<CustomContainer width="100%" mainAlignment={'flex-end'} crossAlignment={'flex-end'}>
				<TextContainer width={'fit'} height={'fit'} overflow="ellipsis">
					<Text color={'gray6'}>{userName}</Text>
				</TextContainer>
			</CustomContainer>
		</CustomTile>
	);
};

export default Tile;
