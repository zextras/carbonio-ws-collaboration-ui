/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { useMemo } from 'react';

import { Avatar, Container, Shimmer, useTheme } from '@zextras/carbonio-design-system';
import styled, { DefaultTheme } from 'styled-components';

import { AvatarBadge, AvatarContainer } from './UserAvatar';
import { RoomsApi } from '../../network';
import { getMeetingActive } from '../../store/selectors/MeetingSelectors';
import {
	getPictureUpdatedAt,
	getRoomMutedSelector,
	getRoomNameSelector
} from '../../store/selectors/RoomsSelectors';
import useStore from '../../store/Store';
import { calcAvatarMeetingColor, calculateAvatarColor } from '../../utils/styleUtils';

type UserAvatarProps = {
	roomId: string;
	unreadCount?: number;
	draftMessage: boolean;
};

const ActiveMeetingDot = styled.div`
	position: absolute;
	width: 0.313rem;
	height: 0.313rem;
	background-color: ${({ theme }: { theme: DefaultTheme }): string => theme.palette.error.regular};
	border: 0.0625rem solid ${(props): string => props.theme.palette.error.regular};
	border-radius: 50%;
	left: 0.188rem;
	top: 0.375rem;
	animation: blink 1.5s linear infinite;

	@keyframes blink {
		0% {
			opacity: 1;
		}
		50% {
			opacity: 0.4;
		}
		100% {
			opacity: 1;
		}
	}
`;

const GroupAvatar: React.FC<UserAvatarProps> = ({ roomId, unreadCount, draftMessage }) => {
	const roomName = useStore((state) => getRoomNameSelector(state, roomId));
	const roomMuted = useStore((state) => getRoomMutedSelector(state, roomId));
	const pictureUpdatedAt: string | undefined = useStore((state) =>
		getPictureUpdatedAt(state, roomId)
	);
	const isMeetingActive = useStore((store) => getMeetingActive(store, roomId));

	const themeColor = useTheme();

	const picture = useMemo(() => {
		if (pictureUpdatedAt != null) {
			return `${RoomsApi.getURLRoomPicture(roomId)}?${pictureUpdatedAt}`;
		}
		return '';
	}, [roomId, pictureUpdatedAt]);

	const userColor = useMemo(() => {
		const color = calculateAvatarColor(roomName);
		return isMeetingActive
			? calcAvatarMeetingColor(themeColor.avatarColors[color])
			: `${themeColor.avatarColors[color]}`;
	}, [isMeetingActive, roomName, themeColor.avatarColors]);

	const avatarGroup = useMemo(() => {
		if (isMeetingActive) {
			return (
				<Container>
					<Avatar
						icon="Video"
						label={roomName}
						title={roomName}
						shape="square"
						background={userColor}
					/>
					<ActiveMeetingDot />
				</Container>
			);
		}
		if (draftMessage) {
			return (
				<Avatar
					icon="Edit2"
					label={roomName}
					title={roomName}
					shape="square"
					background={userColor}
				/>
			);
		}
		if (roomMuted) {
			return (
				<Avatar
					icon="BellOff"
					label={roomName}
					title={roomName}
					shape="square"
					background={userColor}
				/>
			);
		}
		return (
			<Avatar
				data-testid={`${roomName}-avatar`}
				label={roomName}
				title={roomName}
				shape="square"
				background={userColor}
				picture={picture}
			/>
		);
	}, [isMeetingActive, draftMessage, roomMuted, roomName, picture, userColor]);

	return roomName ? (
		<AvatarContainer data-testid="avatar_box" width="fit">
			{avatarGroup}
			{!!unreadCount && unreadCount > 0 && (
				<AvatarBadge
					data-testid="unreads_counter"
					value={unreadCount}
					type={!roomMuted ? 'unread' : 'read'}
				/>
			)}
		</AvatarContainer>
	) : (
		<Shimmer.Avatar size="medium" />
	);
};

export default GroupAvatar;
