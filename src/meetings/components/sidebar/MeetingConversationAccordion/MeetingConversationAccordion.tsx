/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC, useCallback, useEffect, useMemo } from 'react';

import styled from '@emotion/styled';
import {
	Badge,
	Button,
	Container,
	Icon,
	Row,
	Text,
	Tooltip,
	useModal,
	useSnackbar
} from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';
import { gte } from 'semver';

import MeetingChatAccordionTitle from './MeetingChatAccordionTitle';
import papyrusDark from '../../../../chats/assets/papyrus-dark.png';
import papyrus from '../../../../chats/assets/papyrus.png';
import Chat from '../../../../chats/components/conversation/Chat';
import { PinMessage } from '../../../../chats/components/conversation/PinMessage';
import useDarkReader from '../../../../hooks/useDarkReader';
import { clearRoomHistory } from '../../../../network';
import { getPinnedMessage } from '../../../../store/selectors/ActiveConversationsSelectors';
import { getMeetingChatVisibility } from '../../../../store/selectors/ActiveMeetingSelectors';
import { getRoomUnreadSelector } from '../../../../store/selectors/ChatsRegistrySelectors';
import {
	getOwnershipOfTheRoom,
	getRoomMutedSelector,
	getRoomTypeSelector
} from '../../../../store/selectors/RoomsSelectors';
import { getAttribute } from '../../../../store/selectors/SessionSelectors';
import useStore from '../../../../store/Store';
import { MeetingChatVisibility } from '../../../../types/store/ActiveMeetingTypes';
import { MessageType, OperationType } from '../../../../types/store/ChatsRegistryTypes';
import { RoomType } from '../../../../types/store/RoomTypes';

type MeetingConversationAccordionProps = {
	roomId: string;
};
const ChatContainer = styled(Container)``;

export const WrapperMeetingChat = styled(Container)<{ $darkModeActive: boolean }>`
	overflow: hidden;
	background-image: url('${({ $darkModeActive }): string =>
		$darkModeActive ? papyrusDark : papyrus}');
`;

const CustomMediumButton = styled(Button)`
	padding: ${({ theme }): string => theme.sizes.padding.extrasmall};
	& > svg {
		width: ${({ theme }): string => theme.sizes.icon.medium};
		min-width: ${({ theme }): string => theme.sizes.icon.medium};
		height: ${({ theme }): string => theme.sizes.icon.medium};
		min-height: ${({ theme }): string => theme.sizes.icon.medium};
	}
`;

const CustomLargeButton = styled(Button)`
	padding: ${({ theme }): string => theme.sizes.padding.extrasmall};
	& > svg {
		width: ${({ theme }): string => theme.sizes.icon.large};
		min-width: ${({ theme }): string => theme.sizes.icon.large};
		height: ${({ theme }): string => theme.sizes.icon.large};
		min-height: ${({ theme }): string => theme.sizes.icon.large};
	}
`;
const EMPTY_MESSAGES: never[] = [];

const MeetingConversationAccordion: FC<MeetingConversationAccordionProps> = ({ roomId }) => {
	const [t] = useTranslation();
	const { createModal, closeModal } = useModal();
	const createSnackbar = useSnackbar();
	const version = useStore.getState().session.apiVersion;
	const setChatExporting = useStore((store) => store.setChatExporting);
	const messages = useStore((state) => state.chatsRegistry[roomId]?.messages ?? EMPTY_MESSAGES);
	const iAmOwner = useStore((state) => getOwnershipOfTheRoom(state, roomId));
	const extendChatLabel = t('meeting.extendChat', 'Extend chat');
	const minimizeChatLabel = t('meeting.minimizeChat', 'Minimize chat');
	const expandChatLabel = t('meeting.expandChat', 'Expand chat');
	const collapseChatLabel = t('meeting.collapseChat', 'Collapse chat');
	const pinnedMessage = useStore((store) => getPinnedMessage(store, roomId));
	const unreadMessagesCount = useStore((store) => getRoomUnreadSelector(store, roomId || ''));
	const roomMuted = useStore((state) => getRoomMutedSelector(state, roomId));
	const meetingChatVisibility = useStore(getMeetingChatVisibility);
	const setMeetingChatVisibility = useStore((store) => store.setMeetingChatVisibility);
	const roomType = useStore((store) => getRoomTypeSelector(store, roomId ?? ''));
	const recordingEnabled = useStore((store) => getAttribute(store, 'recordingEnabled'));

	const { darkReaderStatus } = useDarkReader();

	const toggleChatStatus = useCallback(() => {
		setMeetingChatVisibility(
			MeetingChatVisibility.CLOSED === meetingChatVisibility
				? MeetingChatVisibility.OPEN
				: MeetingChatVisibility.CLOSED
		);
	}, [setMeetingChatVisibility, meetingChatVisibility]);

	const toggleChatExpanded = useCallback(() => {
		setMeetingChatVisibility(
			MeetingChatVisibility.EXPANDED === meetingChatVisibility
				? MeetingChatVisibility.OPEN
				: MeetingChatVisibility.EXPANDED
		);
	}, [setMeetingChatVisibility, meetingChatVisibility]);

	const chatFullExpanded = useMemo(
		() => meetingChatVisibility === MeetingChatVisibility.EXPANDED,
		[meetingChatVisibility]
	);

	const chatIsOpen = useMemo(
		() => meetingChatVisibility === MeetingChatVisibility.OPEN,
		[meetingChatVisibility]
	);

	const isChatOpenOrFullExpanded = useMemo(
		() => chatIsOpen || chatFullExpanded,
		[chatFullExpanded, chatIsOpen]
	);

	const UnreadCounter = useMemo(
		() =>
			unreadMessagesCount > 0 ? (
				<Row padding={{ left: 'small' }} mainAlignment="center" crossAlignment="center">
					<Badge
						value={unreadMessagesCount}
						backgroundColor={!roomMuted ? 'primary' : 'gray2'}
						color={!roomMuted ? 'gray6' : 'gray0'}
					/>
				</Row>
			) : null,
		[unreadMessagesCount, roomMuted]
	);

	const expandButtonShouldAppear = useMemo(() => {
		if (recordingEnabled) return isChatOpenOrFullExpanded;
		return roomType === RoomType.ONE_TO_ONE ? false : isChatOpenOrFullExpanded;
	}, [recordingEnabled, isChatOpenOrFullExpanded, roomType]);

	const chatChevronShouldAppear = useMemo(() => {
		if (recordingEnabled) return true;
		return roomType !== RoomType.ONE_TO_ONE;
	}, [recordingEnabled, roomType]);

	useEffect(() => {
		if (roomType === RoomType.ONE_TO_ONE && !recordingEnabled) {
			setMeetingChatVisibility(MeetingChatVisibility.EXPANDED);
		}
	}, [recordingEnabled, roomType, setMeetingChatVisibility]);

	const minHeight = useMemo(() => {
		if (chatFullExpanded) return '100%';
		return chatIsOpen ? '50%' : '2.75rem';
	}, [chatFullExpanded, chatIsOpen]);

	const height = useMemo(() => {
		if (chatFullExpanded || chatIsOpen) return '100%';
		return '2.75rem';
	}, [chatFullExpanded, chatIsOpen]);

	const isMsgEmpty = useMemo(
		() =>
			messages.filter(
				(msg) =>
					!(
						msg.type === MessageType.CONFIGURATION_MSG &&
						msg.operation === OperationType.CLEARED_HISTORY
					)
			).length === 0,
		[messages]
	);

	const isHistoryClearedVisible = useMemo(
		() =>
			(!version || gte(version, '1.6.7')) &&
			!isMsgEmpty &&
			iAmOwner &&
			roomType === RoomType.TEMPORARY,
		[version, iAmOwner, roomType, isMsgEmpty]
	);

	const openModal = useCallback(() => {
		const modalId = 'clear-history-modal';
		createModal({
			id: modalId,
			title: (
				<Container mainAlignment="flex-start" orientation="horizontal" gap="0.5rem">
					<Icon icon="AlertCircleOutline" color="error" size="large" />
					<Text>{t('modal.clearHistoryTitle', 'Clear History')}</Text>
				</Container>
			),
			onClose: () => {
				closeModal(modalId);
			},
			children: (
				<Container
					mainAlignment={'flex-start'}
					crossAlignment={'flex-start'}
					gap="1rem"
					padding={{ vertical: '1rem' }}
				>
					<Text overflow="break-word">
						{t(
							'modal.clearHistoryForAllDescription',
							'This will permanently delete all messages and shared files in this room for all participants.'
						)}
					</Text>
					<Text color={'error'} weight="bold">
						{t('modal.clearHistoryWarning', 'This action cannot be undone.')}
					</Text>
				</Container>
			),
			customFooter: (
				<Container mainAlignment="flex-end" orientation="horizontal" gap="0.5rem">
					<Button
						type="outlined"
						color="text"
						label={t('modal.clearHistoryCancel', 'No, cancel')}
						onClick={() => closeModal(modalId)}
					/>
					<Button
						// eslint-disable-next-line jsx-a11y/no-autofocus
						autoFocus
						color="error"
						label={t('modal.clearHistoryConfirm', 'Yes, clear history')}
						onClick={() => {
							clearRoomHistory(roomId).then(() => {
								closeModal(modalId);
								createSnackbar({
									key: new Date().toLocaleString(),
									severity: 'success',
									label: t('feedback.historyCleared', 'History cleared successfully!'),
									hideButton: true,
									autoHideTimeout: 3000
								});
							});
						}}
					/>
				</Container>
			)
		});
	}, [createModal, t, roomId, closeModal, createSnackbar]);

	return (
		<ChatContainer
			key="MeetingConversationAccordion"
			data-testid="MeetingConversationAccordion"
			mainAlignment="flex-end"
			height={height}
			minHeight={minHeight}
			width="100%"
			borderRadius="none"
		>
			<Container
				background={'gray0'}
				orientation="horizontal"
				maxHeight="2.75rem"
				width="100%"
				borderRadius="none"
				padding={{ vertical: 'extrasmall', left: 'large', right: 'medium' }}
			>
				<MeetingChatAccordionTitle roomId={roomId} />
				<Row>
					{expandButtonShouldAppear && (
						<Tooltip label={!chatFullExpanded ? extendChatLabel : minimizeChatLabel}>
							<CustomMediumButton
								type="ghost"
								color="text"
								data-testid="toggleChatExpanded"
								icon={!chatFullExpanded ? 'ArrowUpward' : 'ArrowDownward'}
								onClick={toggleChatExpanded}
							/>
						</Tooltip>
					)}
					{!isChatOpenOrFullExpanded && UnreadCounter}
					{chatChevronShouldAppear && (
						<Tooltip label={isChatOpenOrFullExpanded ? collapseChatLabel : expandChatLabel}>
							<CustomLargeButton
								type="ghost"
								color="text"
								data-testid="toggleChatStatus"
								icon={isChatOpenOrFullExpanded ? 'ChevronDown' : 'ChevronUp'}
								onClick={toggleChatStatus}
							/>
						</Tooltip>
					)}
				</Row>
			</Container>
			{isHistoryClearedVisible && isChatOpenOrFullExpanded && (
				<Container
					background={'gray0'}
					orientation="horizontal"
					maxHeight="2.75rem"
					width="100%"
					borderRadius="none"
					padding={{ vertical: 'extrasmall', left: 'large', right: 'medium' }}
					gap={'0.5rem'}
				>
					<Button
						label={t('action.clearHistory', 'Clear history')}
						onClick={openModal}
						icon="BookOpenOutline"
						color={'error'}
						iconPlacement="left"
					/>
					<Button
						label={t('action.exportMessages', 'Export messages')}
						onClick={() => setChatExporting(roomId)}
						icon="Copy"
						iconPlacement="left"
					/>
				</Container>
			)}
			{pinnedMessage && isChatOpenOrFullExpanded && <PinMessage pinnedMessage={pinnedMessage} />}
			{isChatOpenOrFullExpanded && (
				<WrapperMeetingChat
					data-testid="WrapperMeetingChat"
					mainAlignment="flex-start"
					height="fill"
					$darkModeActive={darkReaderStatus}
				>
					<Chat roomId={roomId} />
				</WrapperMeetingChat>
			)}
		</ChatContainer>
	);
};

export default MeetingConversationAccordion;
