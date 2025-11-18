/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import styled from '@emotion/styled';
import { Container, Shimmer } from '@zextras/carbonio-design-system';

import TileAvatarComponent from './TileAvatarComponent';
import TileHoverContainer, { HoverContainer } from './TileHoverContainer';
import TileUserInfo from './TileUserInfo';
import useMuteForAll from '../../../hooks/useMuteForAll';
import usePinnedTile from '../../../hooks/usePinnedTile';
import {
	getUserIsTalking,
	getStream,
	getUserHasHandRaised
} from '../../../store/selectors/ActiveMeetingSelectors';
import {
	getParticipantAudioStatus,
	getParticipantVideoStatus
} from '../../../store/selectors/MeetingSelectors';
import useStore from '../../../store/Store';
import { Z_INDEX_RANK } from '../../../types/generics';
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
	isPip?: boolean;
};

const CustomTile = styled(Container)<{
	$isTalking: boolean;
	$isHovering: boolean;
	$isPip: boolean;
	$isHandRaised: boolean;
}>`
	position: relative;
	aspect-ratio: 16/9;
	height: auto;
	min-width: 9.375rem;
	border-radius: 0.5rem;
	${({ $isTalking, $isPip, theme }): string | false =>
		!$isPip && $isTalking && `outline: 0.125rem solid ${theme.palette.success.regular};`}
	${({ $isHandRaised, $isPip, theme }): string | false =>
		!$isPip && $isHandRaised && `outline: 0.125rem solid ${theme.palette.warning.regular};`}
	&:hover {
		${HoverContainer} {
			opacity: ${({ $isHovering, $isPip }): number => (!$isPip && $isHovering ? 1 : 0)};
		}
	}
`;

const CustomShimmer = styled(Shimmer.Logo)`
	position: absolute;
	z-index: ${Z_INDEX_RANK.TILE_SHIMMER};
	animation-duration: 3s;
`;

const CustomContainer = styled(Container)`
	aspect-ratio: 16/9;
	position: absolute;
`;

const VideoEl = styled.video<{
	$isScreenShare: boolean;
	$isPortrait: boolean;
}>`
	${({ $isScreenShare, $isPortrait }): string | false =>
		!$isScreenShare && !$isPortrait && 'object-fit: cover;'}
	aspect-ratio: 16/9;
	width: inherit;
	border-radius: 0.5rem;
	z-index: ${Z_INDEX_RANK.TILE_VIDEO};
`;

const Tile: React.FC<TileProps> = ({ userId, meetingId, isScreenShare, modalProps, isPip }) => {
	const audioStatus = useStore((store) => getParticipantAudioStatus(store, meetingId, userId));
	const videoStatus = useStore((store) => getParticipantVideoStatus(store, meetingId, userId));
	const userIsTalking = useStore((store) => getUserIsTalking(store, userId ?? ''));
	const userHasHandRaised = useStore((store) => getUserHasHandRaised(store, userId ?? ''));
	const videoStream = useStore((store) =>
		getStream(
			store,
			meetingId ?? '',
			userId ?? '',
			!isScreenShare ? STREAM_TYPE.VIDEO : STREAM_TYPE.SCREEN
		)
	);

	const [isHoovering, setIsHoovering] = useState<boolean>(false);
	const [isStreamLoading, setIsStreamLoading] = useState<boolean>(true);
	const [isPortraitVideo, setIsPortraitVideo] = useState<boolean>(false);

	const streamRef = useRef<null | HTMLVideoElement>(null);
	const hoverRef = useRef<HTMLDivElement>(null);
	const timeout = useRef<NodeJS.Timeout>();

	const { canUsePinFeature } = usePinnedTile(meetingId ?? '', userId ?? '', isScreenShare);

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
		() => !modalProps && !isPip && (canUsePinFeature || muteForAllHasToAppear),
		[canUsePinFeature, isPip, modalProps, muteForAllHasToAppear]
	);

	const handleHoverMouseMove = useCallback(() => {
		clearTimeout(timeout.current);
		setIsHoovering(true);

		timeout.current = setTimeout(() => {
			setIsHoovering(false);
		}, 2000);
	}, []);

	useEffect(() => {
		if (streamRef?.current) {
			if (videoStream?.active && (videoStatus || isScreenShare)) {
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

	const handleLoadedData = useCallback((e: React.SyntheticEvent<HTMLVideoElement>) => {
		const video = e.currentTarget;
		if (video.videoHeight && video.videoWidth) {
			setIsPortraitVideo(video.videoHeight / video.videoWidth > 1.3);
		}
		setIsStreamLoading(false);
	}, []);

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
			$isPip={!!isPip}
			$isHandRaised={userHasHandRaised && !isScreenShare}
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
				isHandRaised={userHasHandRaised}
			/>
			<VideoEl
				playsInline
				autoPlay
				muted={modalProps ? modalProps.streamMuted : true}
				controls={false}
				ref={modalProps ? modalProps.streamRef : streamRef}
				$isScreenShare={!!isScreenShare}
				$isPortrait={isPortraitVideo}
				onLoadedData={handleLoadedData}
			/>
			{!videoStreamEnabled && (
				<CustomContainer data-testid="avatar_box" height="fit">
					<TileAvatarComponent userId={userId} />
				</CustomContainer>
			)}
			{videoStreamEnabled && isStreamLoading && <CustomShimmer width="100%" height="100%" />}
		</CustomTile>
	);
};

export default Tile;
