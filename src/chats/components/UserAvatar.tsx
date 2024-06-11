/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { useMemo } from 'react';

import { Avatar, Container, Badge } from '@zextras/carbonio-design-system';
import { find } from 'lodash';
import styled, { DefaultTheme } from 'styled-components';

import useAvatarUtilities from '../../hooks/useAvatarUtilities';
import { getMeetingActive } from '../../store/selectors/MeetingSelectors';
import { getRoomMembers, getRoomMutedSelector } from '../../store/selectors/RoomsSelectors';
import { getCapability } from '../../store/selectors/SessionSelectors';
import { getUserName, getUserOnline } from '../../store/selectors/UsersSelectors';
import useStore from '../../store/Store';
import { Member } from '../../types/store/RoomTypes';
import { CapabilityType } from '../../types/store/SessionTypes';

type UserAvatarProps = {
	roomId: string;
	unreadCount?: number;
	draftMessage: boolean;
};

const Presence = styled.div`
	position: absolute;
	width: 0.5rem;
	height: 0.5rem;
	background-color: ${({
		memberOnline,
		theme
	}: {
		memberOnline?: boolean;
		theme: DefaultTheme;
	}): string => (memberOnline ? theme.palette.success.regular : theme.palette.gray2.regular)};
	border: 0.0625rem solid ${(props): string => props.theme.palette.gray5.regular};
	border-radius: 50%;
	right: 0;
	bottom: 0;
`;

export const AvatarBadge = styled(Badge)`
	position: absolute;
	right: -0.25rem;
	bottom: -0.25rem;
	padding: 0.2rem 0.0625rem;
	font-size: 0.6rem;
`;

export const AvatarContainer = styled(Container)`
	position: relative;
`;

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

const UserAvatar: React.FC<UserAvatarProps> = ({ roomId, unreadCount, draftMessage }) => {
	const sessionId: string | undefined = useStore((store) => store.session.id);
	const roomMembers: Member[] | undefined = useStore((store) => getRoomMembers(store, roomId));
	const otherMember = find(roomMembers, (member) => member.userId !== sessionId);
	const idAvailable = otherMember?.userId ?? '';
	const userName: string = useStore((store) => getUserName(store, idAvailable));
	const roomMuted = useStore((state) => getRoomMutedSelector(state, roomId));
	const memberOnline: boolean | undefined = useStore((store) => getUserOnline(store, idAvailable));
	const canSeeUsersPresence = useStore((store) =>
		getCapability(store, CapabilityType.CAN_SEE_USERS_PRESENCE)
	);
	const isMeetingActive = useStore((store) => getMeetingActive(store, roomId));

	const { avatarColor, avatarPicture, avatarIcon } = useAvatarUtilities(
		idAvailable,
		isMeetingActive
	);

	const avatarUser = useMemo(() => {
		switch (true) {
			case isMeetingActive:
				return (
					<Container>
						<Avatar
							icon="Video"
							label={userName}
							title={userName}
							shape="round"
							background={avatarColor}
						/>
						<ActiveMeetingDot />
					</Container>
				);
			case draftMessage:
				return (
					<Avatar
						icon="Edit2"
						label={userName}
						title={userName}
						shape="round"
						background={avatarColor}
					/>
				);
			case roomMuted:
				return (
					<Avatar
						icon="BellOff"
						label={userName}
						title={userName}
						shape="round"
						background={avatarColor}
					/>
				);
			default:
				return (
					<Avatar
						data-testid={`${userName}-avatar`}
						label={userName}
						title={userName}
						shape="round"
						background={avatarColor}
						picture={avatarPicture}
						icon={avatarIcon}
					/>
				);
		}
	}, [isMeetingActive, userName, avatarColor, draftMessage, roomMuted, avatarPicture, avatarIcon]);

	const canShowPresence = useMemo(
		() => !unreadCount && canSeeUsersPresence,
		[canSeeUsersPresence, unreadCount]
	);

	return (
		<AvatarContainer data-testid="avatar_box" width="fit">
			{avatarUser}
			{!!unreadCount && (
				<AvatarBadge
					data-testid="unreads_counter"
					value={unreadCount}
					type={!roomMuted ? 'unread' : 'read'}
				/>
			)}
			{canShowPresence && <Presence data-testid="user_presence_dot" memberOnline={memberOnline} />}
		</AvatarContainer>
	);
};

export default UserAvatar;
