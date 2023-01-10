/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Avatar, Container, Shimmer, Badge } from '@zextras/carbonio-design-system';
import { find } from 'lodash';
import React, { useEffect, useMemo, useState } from 'react';
import styled, { DefaultTheme } from 'styled-components';

import { UsersApi } from '../network';
import { getRoomMembers, getRoomMutedSelector } from '../store/selectors/RoomsSelectors';
import { getCapability } from '../store/selectors/SessionSelectors';
import {
	getUserName,
	getUserOnline,
	getUserPictureUpdatedAt
} from '../store/selectors/UsersSelectors';
import useStore from '../store/Store';
import { Member } from '../types/store/RoomTypes';
import { CapabilityType } from '../types/store/SessionTypes';

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
	right: 0rem;
	bottom: 0rem;
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

const UserAvatar: React.FC<UserAvatarProps> = ({ roomId, unreadCount, draftMessage }) => {
	const sessionId: string | undefined = useStore((store) => store.session.id);
	const roomMembers: Member[] | undefined = useStore((store) => getRoomMembers(store, roomId));
	const otherMember = find(roomMembers, (member) => member.userId !== sessionId);
	const userName: string | undefined = useStore((store) => getUserName(store, otherMember!.userId));
	const roomMuted = useStore((state) => getRoomMutedSelector(state, roomId));
	const memberOnline: boolean | undefined = useStore((store) =>
		getUserOnline(store, otherMember!.userId)
	);
	const userPictureUpdatedAt: string | undefined = useStore((state) =>
		getUserPictureUpdatedAt(state, otherMember!.userId)
	);
	const canSeeUsersPresence = useStore((store) =>
		getCapability(store, CapabilityType.CAN_SEE_USERS_PRESENCE)
	);
	const [picture, setPicture] = useState<false | string>(false);

	useEffect(() => {
		if (userPictureUpdatedAt != null) {
			setPicture(`${UsersApi.getURLUserPicture(otherMember!.userId)}?${userPictureUpdatedAt}`);
		} else {
			setPicture(false);
		}
	}, [sessionId, otherMember, userPictureUpdatedAt, roomId]);

	const avatarUser = useMemo(() => {
		if (draftMessage) {
			return <Avatar icon="Edit2" label={userName} title={userName} shape="round" />;
		}
		if (roomMuted) {
			return <Avatar icon="BellOff" label={userName} title={userName} shape="round" />;
		}
		return (
			<Avatar
				data-testid={`${userName}-avatar`}
				label={userName}
				title={userName}
				shape="round"
				picture={picture}
			/>
		);
	}, [draftMessage, roomMuted, userName, picture]);

	return userName ? (
		<AvatarContainer data-testid="avatar_box" width="fit">
			{avatarUser}
			{unreadCount ? (
				<AvatarBadge
					data-testid="unreads_counter"
					value={unreadCount}
					type={!roomMuted ? 'unread' : 'read'}
				/>
			) : (
				canSeeUsersPresence && (
					<Presence data-testid="user_presence_dot" memberOnline={memberOnline} />
				)
			)}
		</AvatarContainer>
	) : (
		<Shimmer.Avatar data-testid="shimmer_avatar" size="medium" />
	);
};

export default UserAvatar;
