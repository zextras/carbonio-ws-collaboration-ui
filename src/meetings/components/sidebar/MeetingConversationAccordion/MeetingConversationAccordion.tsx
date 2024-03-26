/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC, useCallback, useMemo } from 'react';

import { Badge, Container, IconButton, Row, Tooltip } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import MeetingChatAccordionTitle from './MeetingChatAccordionTitle';
import papyrusDark from '../../../../chats/assets/papyrus-dark.png';
import papyrus from '../../../../chats/assets/papyrus.png';
import Chat from '../../../../chats/components/conversation/Chat';
import { useDarkReaderStatus } from '../../../../hooks/useDarkReaderStatus';
import { getMeetingChatVisibility } from '../../../../store/selectors/ActiveMeetingSelectors';
import { getRoomMutedSelector } from '../../../../store/selectors/RoomsSelectors';
import { getRoomUnreadsSelector } from '../../../../store/selectors/UnreadsCounterSelectors';
import useStore from '../../../../store/Store';
import { MeetingChatVisibility } from '../../../../types/store/ActiveMeetingTypes';

type MeetingConversationAccordionProps = {
	roomId: string;
	meetingId: string;
};
const ChatContainer = styled(Container)`
	transition:
		height 0.3s ease,
		min-height 0.3s ease;
`;

const WrapperMeetingChat = styled(Container)<{ $darkModeActive: boolean }>`
	overflow: hidden;
	background-image: url('${({ $darkModeActive }): string =>
		$darkModeActive ? papyrusDark : papyrus}');
`;

const MeetingConversationAccordion: FC<MeetingConversationAccordionProps> = ({
	roomId,
	meetingId
}) => {
	const [t] = useTranslation();
	const extendChatLabel = t('meeting.extendChat', 'Extend chat');
	const minimizeChatLabel = t('meeting.minimizeChat', 'Minimize chat');
	const expandChatLabel = t('meeting.expandChat', 'Expand chat');
	const collapseChatLabel = t('meeting.collapseChat', 'Collapse chat');

	const unreadMessagesCount = useStore((store) => getRoomUnreadsSelector(store, roomId || ''));
	const roomMuted = useStore((state) => getRoomMutedSelector(state, roomId));
	const meetingChatVisibility = useStore((store) => getMeetingChatVisibility(store, meetingId));
	const setMeetingChatVisibility = useStore((store) => store.setMeetingChatVisibility);

	const isDarkModeEnabled = useDarkReaderStatus();

	const toggleChatStatus = useCallback(() => {
		setMeetingChatVisibility(
			meetingId,
			MeetingChatVisibility.CLOSED === meetingChatVisibility
				? MeetingChatVisibility.OPEN
				: MeetingChatVisibility.CLOSED
		);
	}, [setMeetingChatVisibility, meetingId, meetingChatVisibility]);

	const toggleChatExpanded = useCallback(() => {
		setMeetingChatVisibility(
			meetingId,
			MeetingChatVisibility.EXPANDED === meetingChatVisibility
				? MeetingChatVisibility.OPEN
				: MeetingChatVisibility.EXPANDED
		);
	}, [setMeetingChatVisibility, meetingChatVisibility, meetingId]);

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
					<Badge value={unreadMessagesCount} type={!roomMuted ? 'unread' : 'read'} />
				</Row>
			) : null,
		[unreadMessagesCount, roomMuted]
	);

	return (
		<ChatContainer
			key="MeetingConversationAccordion"
			data-testid="MeetingConversationAccordion"
			mainAlignment="flex-start"
			height={chatFullExpanded ? '100%' : chatIsOpen ? '50%' : '2.75rem'}
			minHeight={chatFullExpanded ? '100%' : chatIsOpen ? '50%' : '2.75rem'}
			width="100%"
			borderRadius="none"
		>
			<Container
				background="gray0"
				orientation="horizontal"
				height="fit"
				width="100%"
				borderRadius="none"
				padding={{ vertical: 'extrasmall', left: 'large', right: 'medium' }}
			>
				<MeetingChatAccordionTitle roomId={roomId} />
				<Container width="30%" orientation="horizontal" mainAlignment="flex-end">
					{isChatOpenOrFullExpanded && (
						<Tooltip label={!chatFullExpanded ? extendChatLabel : minimizeChatLabel}>
							<IconButton
								data-testid="toggleChatExpanded"
								icon={!chatFullExpanded ? 'ArrowUpward' : 'ArrowDownward'}
								size="large"
								onClick={toggleChatExpanded}
							/>
						</Tooltip>
					)}
					{!isChatOpenOrFullExpanded && UnreadCounter}
					<Tooltip label={isChatOpenOrFullExpanded ? collapseChatLabel : expandChatLabel}>
						<IconButton
							data-testid="toggleChatStatus"
							icon={isChatOpenOrFullExpanded ? 'ChevronDown' : 'ChevronUp'}
							size="large"
							onClick={toggleChatStatus}
						/>
					</Tooltip>
				</Container>
			</Container>
			{isChatOpenOrFullExpanded && (
				<WrapperMeetingChat
					data-testid="WrapperMeetingChat"
					mainAlignment="flex-start"
					height="fill"
					$darkModeActive={isDarkModeEnabled}
				>
					<Chat roomId={roomId} setInfoPanelOpen={(): null => null} />
				</WrapperMeetingChat>
			)}
		</ChatContainer>
	);
};

export default MeetingConversationAccordion;
