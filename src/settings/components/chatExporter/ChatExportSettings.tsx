/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, useCallback, useMemo, useState } from 'react';

import {
	Button,
	Container,
	Icon,
	Input,
	ListItem,
	ListV2,
	Spinner,
	Text,
	Tooltip
} from '@zextras/carbonio-design-system';
import { map } from 'lodash';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import ChatItem from './ChatItem';
import { useFilterRoomsOnInput } from '../../../hooks/useFilterRoomsOnInput';
import { getExportedChat } from '../../../store/selectors/SessionSelectors';
import useStore from '../../../store/Store';
import SettingsCard from '../SettingsCard';

const CustomListItem = styled(ListItem)`
	padding: 0.2rem;
	border-radius: 4px;
`;

const ChatExportSettings: FC = () => {
	const [t] = useTranslation();
	const titleLabel = t('settings.export.Title', 'Chat export');
	const descriptionLabel = t(
		'settings.export.subHead',
		'Choose one of your chats to export messages to a text file. Remember that you are responsible for how you use the exported data.'
	);
	const subDescriptionLabel = t(
		'settings.export.description',
		'During the export you can browse Carbonio without worries. However, if you refresh the page the export will be interrupted.'
	);
	const inputNameLabel = t('settings.export.filterInput', 'Filter list');
	const buttonLabel = t('settings.export.action', 'Export selected chat');
	const noOneSelectedTooltip = t(
		'settings.export.action.tooltip.noOneSelected',
		'Select one of your chats to export it'
	);
	const ongoingExportTooltip = t(
		'settings.export.action.tooltip.ongoingExport',
		'You are already exporting a chat, wait for the export to finish.'
	);
	const canTakeAWhileLabel = t(
		'settings.export.caption',
		'Exporting chats with a lot of content can take a while.'
	);

	const exportedChat = useStore(getExportedChat);
	const setChatExporting = useStore((store) => store.setChatExporting);

	const [selectedRoomId, setSelectedRoomId] = useState<string | undefined>();

	const [inputText, setInputText] = useState('');

	const filteredConversationsIds = useFilterRoomsOnInput(inputText);

	const onInputChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => setInputText(e.target.value),
		[setInputText]
	);

	const items = useMemo(
		() =>
			map(filteredConversationsIds, (room) => (
				<CustomListItem key={room.roomId} active={room.roomId === selectedRoomId}>
					{() => <ChatItem roomId={room.roomId} onClick={() => setSelectedRoomId(room.roomId)} />}
				</CustomListItem>
			)),
		[filteredConversationsIds, selectedRoomId]
	);

	const onExport = useCallback(() => {
		if (selectedRoomId) {
			setChatExporting(selectedRoomId);
		}
	}, [selectedRoomId, setChatExporting]);

	const filterIcon = useMemo(
		() =>
			function icon(): JSX.Element {
				return <Icon icon="FunnelOutline" size="large" />;
			},
		[]
	);

	const disabledButton = useMemo(
		() => !selectedRoomId || !!exportedChat,
		[exportedChat, selectedRoomId]
	);

	const buttonTooltip = useMemo(() => {
		if (exportedChat) {
			return ongoingExportTooltip;
		}
		if (!selectedRoomId) {
			return noOneSelectedTooltip;
		}
		return undefined;
	}, [exportedChat, noOneSelectedTooltip, ongoingExportTooltip, selectedRoomId]);

	return (
		<SettingsCard title={titleLabel} description={descriptionLabel}>
			<Text overflow="break-word" size="small" color="gray1" italic>
				{subDescriptionLabel}
			</Text>
			<Input
				label={inputNameLabel}
				value={inputText}
				onChange={onInputChange}
				CustomIcon={filterIcon}
			/>
			<ListV2 maxHeight="200px">{items}</ListV2>
			<Container orientation="horizontal" mainAlignment="flex-start" gap="1rem">
				<Tooltip label={buttonTooltip} disabled={!disabledButton}>
					<Button
						label={buttonLabel}
						color="primary"
						onClick={onExport}
						disabled={disabledButton}
					/>
				</Tooltip>
				<Text overflow="break-word" size="small" color="gray1" italic>
					{canTakeAWhileLabel}
				</Text>
				{!!exportedChat && <Spinner color="gray1" />}
			</Container>
		</SettingsCard>
	);
};

export default ChatExportSettings;
