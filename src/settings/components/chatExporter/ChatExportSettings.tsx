/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, useCallback, useEffect, useMemo, useState } from 'react';

import {
	Button,
	Container,
	CreateSnackbarFn,
	Icon,
	Input,
	ListItem,
	ListV2,
	Spinner,
	Text,
	Tooltip,
	useSnackbar
} from '@zextras/carbonio-design-system';
import { map, size } from 'lodash';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import ChatItem from './ChatItem';
import { useFilterRoomsOnInput } from '../../../hooks/useFilterRoomsOnInput';
import { getIsThereAnyRoom } from '../../../store/selectors/RoomsSelectors';
import { getExportedChat, getExportStatus } from '../../../store/selectors/SessionSelectors';
import useStore from '../../../store/Store';
import { ExportStatus } from '../../../types/store/SessionTypes';
import SettingsCard from '../SettingsCard';

const CustomListItem = styled(ListItem)`
	margin: 0.2rem;
	border-radius: 4px;
	box-shadow: 0 0 4px 0 rgba(166, 166, 166, 0.5);
`;

const ChatExportSettings: FC = () => {
	const [t] = useTranslation();
	const titleLabel = t('settings.export.title', 'Chat export');
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
		'settings.export.tooltip.noOneSelected',
		'Select one of your chats to export it'
	);
	const ongoingExportTooltip = t(
		'settings.export.tooltip.ongoingExport',
		'You are already exporting a chat, wait for the export to finish.'
	);
	const canTakeAWhileLabel = t(
		'settings.export.caption',
		'Exporting chats with a lot of content can take a while.'
	);
	const snackbarLabel = t(
		'settings.export.snackbar.success',
		'Chat exported successfully, check your downloads!'
	);
	const noMatchTitleLabel = t('settings.export.emptySpace.noMatch.title', 'Try another query');
	const noMatchDescriptionLabel = t(
		'settings.export.emptySpace.noMatch.description',
		'There are no matches for this search in your existing chats.'
	);
	const noChatsLabel = t('settings.export.emptySpace.firstAccess.title', 'There’s nothing there.');
	const noChatsCallToActionLabel = t(
		'settings.export.emptySpace.firstAccess.callToAction',
		'Go to Chats and start collaborating!'
	);
	const noChatsDescriptionLabel = t(
		'settings.export.emptySpace.firstAccess.description',
		'Your single chats and groups will appear listed here.'
	);

	const exportedChat = useStore(getExportedChat);
	const exportStatus = useStore(getExportStatus);
	const setChatExporting = useStore((store) => store.setChatExporting);
	const isThereAnyRoom = useStore(getIsThereAnyRoom);

	const [selectedRoomId, setSelectedRoomId] = useState<string | undefined>();
	const [inputText, setInputText] = useState('');

	const filteredConversationsIds = useFilterRoomsOnInput(inputText);

	const onInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
		setInputText(e.target.value);
		setSelectedRoomId(undefined);
	}, []);

	const createSnackbar: CreateSnackbarFn = useSnackbar();

	useEffect(() => {
		if (exportStatus === ExportStatus.DOWNLOADING) {
			createSnackbar({
				key: new Date().toLocaleString(),
				color: 'info',
				label: snackbarLabel,
				hideButton: true
			});
		}
	}, [createSnackbar, exportStatus, snackbarLabel]);

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
		if (selectedRoomId) setChatExporting(selectedRoomId);
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

	const MainArea = useMemo(() => {
		if (!isThereAnyRoom) {
			return (
				<Container gap="0.5rem" padding="1rem">
					<Text size="large" color="gray1" weight="bold">
						{noChatsLabel}
					</Text>
					<Text color="gray1">{noChatsCallToActionLabel}</Text>
					<Text color="gray1">{noChatsDescriptionLabel}</Text>
				</Container>
			);
		}
		if (size(filteredConversationsIds) === 0) {
			return (
				<Container gap="0.5rem" padding="1rem">
					<Text size="large" color="gray1" weight="bold">
						{noMatchTitleLabel}
					</Text>
					<Text color="gray1">{noMatchDescriptionLabel}</Text>
				</Container>
			);
		}
		return <ListV2 maxHeight="15rem">{items}</ListV2>;
	}, [
		filteredConversationsIds,
		isThereAnyRoom,
		items,
		noChatsCallToActionLabel,
		noChatsDescriptionLabel,
		noChatsLabel,
		noMatchDescriptionLabel,
		noMatchTitleLabel
	]);

	return (
		<SettingsCard
			title={titleLabel}
			description={descriptionLabel}
			subDescription={subDescriptionLabel}
		>
			<Input
				label={inputNameLabel}
				value={inputText}
				onChange={onInputChange}
				CustomIcon={filterIcon}
			/>
			{MainArea}
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
