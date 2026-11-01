/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { useCallback } from 'react';

import styled from '@emotion/styled';
import { Badge, Container, Text } from '@zextras/carbonio-design-system';
import { map } from 'lodash';
import { useTranslation } from 'react-i18next';

import type { WidgetProps } from './dashboardWidgetTypes';
import type { UnreadChatsConfig } from './unreadChatsDefinition';
import useRouting from '../../hooks/useRouting';
import { getRoomUnreadSelector } from '../../store/selectors/ChatsRegistrySelectors';
import { getRoomNameSelector, getRoomSelector } from '../../store/selectors/RoomsSelectors';
import useStore from '../../store/Store';

const ChatRow = styled(Container)`
	cursor: pointer;
	&:hover {
		background-color: ${({ theme }): string => theme.palette.gray3.regular};
	}
`;

const UnreadChatRow = ({ roomId }: { roomId: string }): React.JSX.Element | null => {
	const { goToRoomPage } = useRouting();
	const roomExists = useStore((state) => !!getRoomSelector(state, roomId));
	const roomName = useStore((state) => getRoomNameSelector(state, roomId));
	const unreadCount = useStore((state) => getRoomUnreadSelector(state, roomId));

	const openConversation = useCallback(() => goToRoomPage(roomId), [goToRoomPage, roomId]);

	// the room could have been deleted or left after it was selected in the settings
	if (!roomExists) return null;

	return (
		<ChatRow
			orientation="horizontal"
			mainAlignment="space-between"
			height="fit"
			padding={{ vertical: 'small', horizontal: 'medium' }}
			gap="0.5rem"
			onClick={openConversation}
			data-testid={`unread-chat-${roomId}`}
		>
			<Text overflow="ellipsis" weight={unreadCount > 0 ? 'bold' : 'regular'}>
				{roomName}
			</Text>
			{unreadCount > 0 && <Badge value={unreadCount} />}
		</ChatRow>
	);
};

const UnreadChatsWidget = ({ config }: WidgetProps<UnreadChatsConfig>): React.JSX.Element => {
	const [t] = useTranslation();

	if (config.roomIds.length === 0) {
		return (
			<Text color="secondary" overflow="break-word">
				{t('dashboard.unreadChats.empty', 'Choose the chats to show from the widget settings')}
			</Text>
		);
	}

	return (
		<Container mainAlignment="flex-start" crossAlignment="flex-start" style={{ overflowY: 'auto' }}>
			{map(config.roomIds, (roomId) => (
				<UnreadChatRow key={roomId} roomId={roomId} />
			))}
		</Container>
	);
};

export default UnreadChatsWidget;
