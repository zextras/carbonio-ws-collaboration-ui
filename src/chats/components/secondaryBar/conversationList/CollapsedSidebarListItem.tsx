/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { useCallback } from 'react';

import styled from '@emotion/styled';
import { Container, Tooltip } from '@zextras/carbonio-design-system';

import useRouting from '../../../../hooks/useRouting';
import { getDraftMessage } from '../../../../store/selectors/ActiveConversationsSelectors';
import { getRoomUnreadSelector } from '../../../../store/selectors/ChatsRegistrySelectors';
import {
	getRoomNameSelector,
	getRoomTypeSelector
} from '../../../../store/selectors/RoomsSelectors';
import { getSelectedConversation } from '../../../../store/selectors/SessionSelectors';
import useStore from '../../../../store/Store';
import { RoomType } from '../../../../types/store/RoomTypes';
import GroupAvatar from '../../GroupAvatar';
import UserAvatar from '../../UserAvatar';

type SidebarListItemProps = {
	roomId: string;
};

const SidebarItem = styled(Container)<{ $selected: boolean }>`
	cursor: pointer;
	&:hover {
		background-color: ${({ theme, $selected }): string =>
			$selected ? theme.palette.highlight.regular : theme.palette.gray3.regular};
	}
`;

const CollapsedSidebarListItem: React.FC<SidebarListItemProps> = ({ roomId }) => {
	const { goToRoomPage } = useRouting();

	const roomType = useStore((state) => getRoomTypeSelector(state, roomId));
	const roomName = useStore((state) => getRoomNameSelector(state, roomId)) || '';
	const isConversationSelected = useStore((state) => getSelectedConversation(state, roomId));
	const unreadMessagesCount = useStore((store) => getRoomUnreadSelector(store, roomId));
	const draftMessage = useStore((store) => getDraftMessage(store, roomId));

	const openConversation = useCallback(() => goToRoomPage(roomId), [goToRoomPage, roomId]);

	return (
		<Tooltip label={roomName}>
			<SidebarItem
				background={isConversationSelected ? 'highlight' : 'none'}
				onClick={openConversation}
				$selected={isConversationSelected}
				orientation="horizontal"
				mainAlignment="flex-start"
				height="fit"
				padding={{ all: 'small' }}
			>
				{roomType === RoomType.GROUP ? (
					<GroupAvatar
						roomId={roomId}
						unreadCount={unreadMessagesCount}
						draftMessage={!!draftMessage && unreadMessagesCount === 0}
					/>
				) : (
					<UserAvatar
						roomId={roomId}
						unreadCount={unreadMessagesCount}
						draftMessage={!!draftMessage && unreadMessagesCount === 0}
					/>
				)}
			</SidebarItem>
		</Tooltip>
	);
};

export default CollapsedSidebarListItem;
