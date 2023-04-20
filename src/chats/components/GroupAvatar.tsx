/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Avatar, Shimmer } from '@zextras/carbonio-design-system';
import React, { useEffect, useMemo, useState } from 'react';

import { AvatarBadge, AvatarContainer } from './UserAvatar';
import { RoomsApi } from '../../network';
import {
	getPictureUpdatedAt,
	getRoomMutedSelector,
	getRoomNameSelector
} from '../../store/selectors/RoomsSelectors';
import useStore from '../../store/Store';

type UserAvatarProps = {
	roomId: string;
	unreadCount?: number;
	draftMessage: boolean;
};

const GroupAvatar: React.FC<UserAvatarProps> = ({ roomId, unreadCount, draftMessage }) => {
	const roomName = useStore((state) => getRoomNameSelector(state, roomId));
	const roomMuted = useStore((state) => getRoomMutedSelector(state, roomId));
	const pictureUpdatedAt: string | undefined = useStore((state) =>
		getPictureUpdatedAt(state, roomId)
	);

	const [picture, setPicture] = useState<false | string>(false);

	useEffect(() => {
		if (pictureUpdatedAt != null) {
			setPicture(`${RoomsApi.getURLRoomPicture(roomId)}?${pictureUpdatedAt}`);
		} else {
			setPicture(false);
		}
	}, [pictureUpdatedAt, roomId]);

	const avatarGroup = useMemo(() => {
		if (draftMessage) {
			return <Avatar icon="Edit2" label={roomName} title={roomName} shape="square" />;
		}
		if (roomMuted) {
			return <Avatar icon="BellOff" label={roomName} title={roomName} shape="square" />;
		}
		return (
			<Avatar
				data-testid={`${roomName}-avatar`}
				label={roomName}
				title={roomName}
				shape="square"
				picture={picture}
			/>
		);
	}, [draftMessage, roomMuted, roomName, picture]);

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
