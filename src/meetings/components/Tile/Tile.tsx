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
import React, { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';

import { UsersApi } from '../../../network';
import { getUserName, getUserPictureUpdatedAt } from '../../../store/selectors/UsersSelectors';
import useStore from '../../../store/Store';
import { calculateAvatarColor } from '../../../utils/styleUtils';

type TileProps = {
	streamRef: React.MutableRefObject<HTMLVideoElement | null>;
	streamMuted: boolean;
	videoStreamEnabled: boolean;
	audioStreamEnabled: boolean;
	memberId: string | undefined;
	isScreenShare?: boolean;
};

const HoverContainer = styled(Container)`
	opacity: 0;
	position: absolute;
	background-color: rgba(255, 255, 255, 0.7);
	z-index: 1;
`;

const StyledAvatar = styled(Avatar)`
	min-height: 7.5rem;
	min-width: 7.5rem;
`;

const CustomIconButton = styled(IconButton)`
	cursor: default;
`;

export const AvatarContainer = styled(Container)`
	position: relative;
`;

const TextContainer = styled(Container)`
	background-color: ${({ theme }): string => theme.palette.text.regular};
	border-radius: 0.25rem;
	padding: 0.25rem 0.5rem;
	z-index: 2;
`;

const CustomContainer = styled(Container)`
	position: absolute;
	padding: 0.5rem;
`;

const CentralTile = styled(Container)`
	border-radius: 8px;
	&:hover {
		${HoverContainer} {
			opacity: 1;
		}
	}
`;

const VideoEl = styled.video<{
	isScreenShare: boolean;
}>`
	${({ isScreenShare }): string | false => isScreenShare && 'max-height: 100%'};
	max-width: 100%;
	&:hover {
		${HoverContainer} {
			opacity: 1;
		}
	}
`;

const Tile: React.FC<TileProps> = ({
	streamRef,
	streamMuted,
	videoStreamEnabled,
	audioStreamEnabled,
	memberId,
	isScreenShare
}) => {
	const sessionId: string | undefined = useStore((store) => store.session.id);
	const userName = useStore((store) => getUserName(store, memberId || ''));
	const userPictureUpdatedAt: string | undefined = useStore((state) =>
		getUserPictureUpdatedAt(state, memberId || '')
	);

	const themeColor = useTheme();

	const [picture, setPicture] = useState<false | string>(false);

	const isMyTile = useMemo(() => memberId === sessionId, [memberId, sessionId]);

	useEffect(() => {
		if (userPictureUpdatedAt != null) {
			setPicture(`${UsersApi.getURLUserPicture(memberId || '')}?${userPictureUpdatedAt}`);
		} else {
			setPicture(false);
		}
	}, [memberId, userPictureUpdatedAt]);

	const userColor = useMemo(() => {
		const color = calculateAvatarColor(userName || '');
		return `${themeColor.avatarColors[color]}`;
	}, [userName, themeColor.avatarColors]);

	return (
		<CentralTile background={'text'} data-testid="tile">
			{!isMyTile && (
				<HoverContainer width="100%" data-testid="hover_container" orientation="horizontal">
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
			)}
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
					muted={streamMuted}
					controls={false}
					ref={streamRef}
					isScreenShare={isScreenShare || false}
				/>
			) : (
				<AvatarContainer data-testid="avatar_box" width="fit">
					<StyledAvatar
						label={userName || ''}
						title={userName || ''}
						shape="round"
						background={userColor}
						picture={picture}
					/>
				</AvatarContainer>
			)}
			<CustomContainer width="100%" mainAlignment={'flex-end'} crossAlignment={'flex-end'}>
				<TextContainer width={'fit'} height={'fit'}>
					<Text color={'gray6'}>{userName}</Text>
				</TextContainer>
			</CustomContainer>
		</CentralTile>
	);
};

export default Tile;
