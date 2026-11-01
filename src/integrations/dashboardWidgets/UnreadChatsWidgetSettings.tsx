/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { useCallback, useMemo } from 'react';

import { Checkbox, Container, Text } from '@zextras/carbonio-design-system';
import { filter, includes, map, without } from 'lodash';
import { useTranslation } from 'react-i18next';

import type { WidgetSettingsProps } from './dashboardWidgetTypes';
import type { UnreadChatsConfig } from './unreadChatsDefinition';
import { getRoomNameSelector } from '../../store/selectors/RoomsSelectors';
import useStore from '../../store/Store';
import { RoomType } from '../../types/store/RoomTypes';

type ChatOptionProps = {
	roomId: string;
	selected: boolean;
	onToggle: (roomId: string) => void;
};

const ChatOption = ({ roomId, selected, onToggle }: ChatOptionProps): React.JSX.Element => {
	const roomName = useStore((state) => getRoomNameSelector(state, roomId));
	return <Checkbox label={roomName} value={selected} onClick={(): void => onToggle(roomId)} />;
};

const UnreadChatsWidgetSettings = ({
	config,
	onChange
}: WidgetSettingsProps<UnreadChatsConfig>): React.JSX.Element => {
	const [t] = useTranslation();
	const rooms = useStore((store) => store.rooms);
	const selectedIds = config.roomIds;

	// only real conversations: temporary (virtual) rooms are not chats
	const chatIds = useMemo(
		() =>
			map(
				filter(rooms, (room) => room.type === RoomType.GROUP || room.type === RoomType.ONE_TO_ONE),
				(room) => room.id
			),
		[rooms]
	);

	const toggle = useCallback(
		(roomId: string) =>
			onChange({
				...config,
				roomIds: includes(selectedIds, roomId)
					? without(selectedIds, roomId)
					: [...selectedIds, roomId]
			}),
		[config, onChange, selectedIds]
	);

	return (
		<Container gap="1rem" crossAlignment="flex-start">
			<Text overflow="break-word">
				{t('dashboard.unreadChats.settings.description', 'Select the chats to show in the widget')}
			</Text>
			<Container
				mainAlignment="flex-start"
				crossAlignment="flex-start"
				gap="0.5rem"
				height="fit"
				maxHeight="20rem"
				style={{ overflowY: 'auto' }}
			>
				{map(chatIds, (roomId) => (
					<ChatOption
						key={roomId}
						roomId={roomId}
						selected={includes(selectedIds, roomId)}
						onToggle={toggle}
					/>
				))}
			</Container>
		</Container>
	);
};

export default UnreadChatsWidgetSettings;
