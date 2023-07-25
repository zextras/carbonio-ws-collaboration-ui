/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Container, IconButton, Text, Tooltip } from '@zextras/carbonio-design-system';
import React, { FC, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import papyrusDark from '../../../../chats/assets/papyrus-dark.png';
import papyrus from '../../../../chats/assets/papyrus.png';
import Chat from '../../../../chats/components/conversation/Chat';
import { getMeetingChatVisibility } from '../../../../store/selectors/ActiveMeetingSelectors';
import useStore from '../../../../store/Store';
import { MeetingChatVisibility } from '../../../../types/store/ActiveMeetingTypes';

type MeetingConversationAccordionProps = {
	roomId: string;
	meetingId: string;
	isInsideMeeting: boolean;
};

const WrapperMeetingChat = styled(Container)`
	overflow: hidden;
	background-image: url('${(props): string => (props.theme === 'dark' ? papyrusDark : papyrus)}');
`;

const MeetingConversationAccordion: FC<MeetingConversationAccordionProps> = ({
	roomId,
	meetingId,
	isInsideMeeting
}) => {
	const [t] = useTranslation();
	const extendChatLabel = t('meeting.extendChat', 'Extend chat');
	const minimizeChatLabel = t('meeting.minimizeChat', 'Minimize chat');
	const expandChatLabel = t('meeting.expandChat', 'Expand chat');
	const collapseChatLabel = t('meeting.collapseChat', 'Collapse chat');
	const chatLabel = t('chat', 'Chat');

	const meetingChatVisibility = useStore((store) => getMeetingChatVisibility(store, meetingId));
	const setMeetingChatVisibility = useStore((store) => store.setMeetingChatVisibility);

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

	return (
		<Container
			key="MeetingConversationAccordion"
			data-testid="MeetingConversationAccordion"
			mainAlignment="flex-end"
			maxHeight={chatFullExpanded ? '100%' : chatIsOpen ? '50%' : 'fit'}
			height={chatFullExpanded ? '100%' : chatIsOpen ? '50%' : 'fit'}
			width="100%"
			borderRadius="none"
		>
			<Container
				background="gray5"
				orientation="horizontal"
				height="fit"
				width="100%"
				borderRadius="none"
				padding={{ vertical: 'extrasmall', left: 'large', right: 'medium' }}
			>
				<Container width="70%" crossAlignment="flex-start">
					<Text>{chatLabel}</Text>
				</Container>
				<Container width="30%" orientation="horizontal" mainAlignment="flex-end">
					{(chatIsOpen || chatFullExpanded) && (
						<Tooltip label={!chatFullExpanded ? extendChatLabel : minimizeChatLabel}>
							<IconButton
								data-testid="toggleChatExpanded"
								icon={!chatFullExpanded ? 'ArrowUpward' : 'ArrowDownward'}
								size="large"
								onClick={toggleChatExpanded}
							/>
						</Tooltip>
					)}
					<Tooltip label={chatIsOpen || chatFullExpanded ? collapseChatLabel : expandChatLabel}>
						<IconButton
							data-testid="toggleChatStatus"
							icon={chatIsOpen || chatFullExpanded ? 'ChevronDown' : 'ChevronUp'}
							size="large"
							onClick={toggleChatStatus}
						/>
					</Tooltip>
				</Container>
			</Container>
			{(chatIsOpen || chatFullExpanded) && (
				<WrapperMeetingChat
					chatFullExpanded={chatFullExpanded}
					mainAlignment="flex-start"
					height="fill"
				>
					<Chat
						roomId={roomId}
						setInfoPanelOpen={(): null => null}
						isInsideMeeting={isInsideMeeting}
					/>
				</WrapperMeetingChat>
			)}
		</Container>
	);
};

export default MeetingConversationAccordion;
