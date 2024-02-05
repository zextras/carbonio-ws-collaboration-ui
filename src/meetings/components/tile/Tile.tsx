/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { MutableRefObject, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Container } from '@zextras/carbonio-design-system';
import styled from 'styled-components';

import TileAvatarComponent from './TileAvatarComponent';
import TileHoverContainer, { HoverContainer } from './TileHoverContainer';
import TileUserInfo from './TileUserInfo';
import useMuteForAll from '../../../hooks/useMuteForAll';
import usePinnedTile from '../../../hooks/usePinnedTile';
import { getUserIsTalking, getStream } from '../../../store/selectors/ActiveMeetingSelectors';
import {
	getParticipantAudioStatus,
	getParticipantVideoStatus
} from '../../../store/selectors/MeetingSelectors';
import useStore from '../../../store/Store';
import { STREAM_TYPE } from '../../../types/store/ActiveMeetingTypes';

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

const CustomContainer = styled(Container)`
	aspect-ratio: 16/9;
	position: absolute;
`;

const VideoEl = styled.video<{
	playsInline: boolean;
	autoPlay: boolean;
	muted: boolean;
	controls: boolean;
	ref: MutableRefObject<HTMLVideoElement | null>;
	isScreenShare: boolean;
}>`
	${({ isScreenShare }): string | false => !isScreenShare && 'object-fit: cover;'}
	aspect-ratio: 16/9;
	width: inherit;
	border-radius: 0.5rem;
`;

const Tile: React.FC<TileProps> = ({ userId, meetingId, isScreenShare, modalProps }) => {
	const audioStatus = useStore((store) => getParticipantAudioStatus(store, meetingId, userId));
	const videoStatus = useStore((store) => getParticipantVideoStatus(store, meetingId, userId));
	const userIsTalking = useStore((store) => getUserIsTalking(store, meetingId || '', userId || ''));
	const videoStream = useStore((store) =>
		getStream(
			store,
			meetingId || '',
			userId || '',
			!isScreenShare ? STREAM_TYPE.VIDEO : STREAM_TYPE.SCREEN
		)
	);

	const [isHoovering, setIsHoovering] = useState<boolean>(false);

	const streamRef = useRef<null | HTMLVideoElement>(null);
	const hoverRef = useRef<HTMLDivElement>(null);
	const timeout = useRef<NodeJS.Timeout>();

	const { canUsePinFeature } = usePinnedTile(meetingId || '', userId || '', isScreenShare);

	const { muteForAllHasToAppear } = useMuteForAll(meetingId, userId);

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

	const showHoverContainer = useMemo(
		() => !modalProps && (canUsePinFeature || muteForAllHasToAppear),
		[canUsePinFeature, modalProps, muteForAllHasToAppear]
	);

	const handleHoverMouseMove = useCallback(() => {
		clearTimeout(timeout.current);
		setIsHoovering(true);

		timeout.current = setTimeout(() => {
			setIsHoovering(false);
		}, 2000);
	}, []);

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

	useEffect(
		() => (): void => {
			timeout.current && clearTimeout(timeout.current);
		},
		[]
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
			{showHoverContainer && (
				<TileHoverContainer
					meetingId={meetingId}
					userId={userId}
					isScreenShare={isScreenShare}
					isHoovering={isHoovering}
				/>
			)}
			<TileUserInfo
				meetingId={meetingId}
				userId={userId}
				videoStreamEnabled={videoStreamEnabled}
				audioStreamEnabled={audioStreamEnabled}
				isScreenShare={isScreenShare}
			/>
			<VideoEl
				playsInline
				autoPlay
				muted={modalProps ? modalProps.streamMuted : true}
				controls={false}
				ref={modalProps ? modalProps.streamRef : streamRef}
				isScreenShare={!!isScreenShare}
			/>
			{!videoStreamEnabled && (
				<CustomContainer data-testid="avatar_box">
					<TileAvatarComponent userId={userId} />
				</CustomContainer>
			)}
		</CustomTile>
	);
};

export default Tile;
