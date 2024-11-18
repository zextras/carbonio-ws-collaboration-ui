/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC, useCallback, useEffect, useMemo } from 'react';

import { Badge, Button, Container, Row, Tooltip } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import MeetingChatAccordionTitle from './MeetingChatAccordionTitle';
import papyrusDark from '../../../../chats/assets/papyrus-dark.png';
import papyrus from '../../../../chats/assets/papyrus.png';
import Chat from '../../../../chats/components/conversation/Chat';
import useDarkReader from '../../../../hooks/useDarkReader';
import { getMeetingChatVisibility } from '../../../../store/selectors/ActiveMeetingSelectors';
import {
	getRoomMutedSelector,
	getRoomTypeSelector
} from '../../../../store/selectors/RoomsSelectors';
import { getCapability } from '../../../../store/selectors/SessionSelectors';
import { getRoomUnreadsSelector } from '../../../../store/selectors/UnreadsCounterSelectors';
import useStore from '../../../../store/Store';
import { MeetingChatVisibility } from '../../../../types/store/ActiveMeetingTypes';
import { RoomType } from '../../../../types/store/RoomTypes';
import { CapabilityType } from '../../../../types/store/SessionTypes';

type MeetingConversationAccordionProps = {
	roomId: string;
	meetingId: string;
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
	const roomType = useStore((store) => getRoomTypeSelector(store, roomId ?? ''));
	const canVideoRecordMeeting = useStore((store) =>
		getCapability(store, CapabilityType.CAN_VIDEO_CALL_RECORD)
	);

	const { darkReaderStatus } = useDarkReader();

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
		if (canVideoRecordMeeting) return isChatOpenOrFullExpanded;
		return roomType === RoomType.ONE_TO_ONE ? false : isChatOpenOrFullExpanded;
	}, [canVideoRecordMeeting, isChatOpenOrFullExpanded, roomType]);

	const chatChevronShouldAppear = useMemo(() => {
		if (canVideoRecordMeeting) return true;
		return roomType !== RoomType.ONE_TO_ONE;
	}, [canVideoRecordMeeting, roomType]);

	useEffect(() => {
		if (roomType === RoomType.ONE_TO_ONE && !canVideoRecordMeeting) {
			setMeetingChatVisibility(meetingId, MeetingChatVisibility.EXPANDED);
		}
	}, [canVideoRecordMeeting, meetingId, roomType, setMeetingChatVisibility]);

	const minHeight = useMemo(() => {
		if (chatFullExpanded) return '100%';
		return chatIsOpen ? '50%' : '2.75rem';
	}, [chatFullExpanded, chatIsOpen]);

	const height = useMemo(() => {
		if (chatFullExpanded || chatIsOpen) return '100%';
		return '2.75rem';
	}, [chatFullExpanded, chatIsOpen]);

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
				<Container height="fit" width="30%" orientation="horizontal" mainAlignment="flex-end">
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
				</Container>
			</Container>
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
