/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { ReactElement, useCallback } from 'react';

import { Container, IconButton, Tooltip } from '@zextras/carbonio-design-system';
import { includes } from 'lodash';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';

import MeetingConversationAccordion from './MeetingConversationAccordion/MeetingConversationAccordion';
import MeetingParticipantsAccordion from './ParticipantsAccordion/MeetingParticipantsAccordion';
import WaitingListAccordion from './waitingListAccordion/WaitingListAccordion';
import { ActionsAccordion } from '../../../chats/components/infoPanel/conversationActionsAccordion/ActionsAccordion';
import { MeetingRoutesParams } from '../../../hooks/useRouting';
import {
	getMeetingChatVisibility,
	getMeetingSidebarStatus
} from '../../../store/selectors/ActiveMeetingSelectors';
import { getRoomIdByMeetingId } from '../../../store/selectors/MeetingSelectors';
import { getRoomTypeSelector } from '../../../store/selectors/RoomsSelectors';
import useStore from '../../../store/Store';
import { MeetingChatVisibility } from '../../../types/store/ActiveMeetingTypes';
import { RoomType } from '../../../types/store/RoomTypes';
import BubblesWrapper from '../bubblesWrapper/BubblesWrapper';

const SidebarContainer = styled(Container)`
	position: relative;
	transition:
		width 0.3s ease,
		min-width 0.3s ease;
`;

const ChangeSidebarStatusButton = styled.div`
	position: absolute;
	right: calc(-1rem - 2.25rem);
	top: calc(50% - (15.09375rem / 2));
	z-index: 39;
`;

const SidebarIconButton = styled(IconButton)`
	width: 2.25rem;
	height: 15rem;
`;

const AccordionContainer = styled(Container)`
	overflow-y: auto;
`;

const MeetingSidebar = (): ReactElement => {
	const { meetingId }: MeetingRoutesParams = useParams();

	const [t] = useTranslation();
	const collapseSidebarLabel = t('tooltip.collapseSidebar', 'Collapse sidebar');
	const expandSidebarLabel = t('tooltip.expandSidebar', 'Expand sidebar');

	const roomId = useStore((store) => getRoomIdByMeetingId(store, meetingId));
	const roomType = useStore((store) => getRoomTypeSelector(store, roomId || ''));
	const meetingChatVisibility = useStore((store) => getMeetingChatVisibility(store, meetingId));
	const sidebarIsVisible: boolean = useStore((store) => getMeetingSidebarStatus(store, meetingId));
	const setMeetingSidebarStatus = useStore((store) => store.setMeetingSidebarStatus);

	const toggleSidebar = useCallback(
		() => setMeetingSidebarStatus(meetingId, !sidebarIsVisible),
		[setMeetingSidebarStatus, meetingId, sidebarIsVisible]
	);

	return (
		<SidebarContainer
			background="text"
			width={sidebarIsVisible ? '35%' : '0'}
			minWidth={sidebarIsVisible ? '23.125rem' : '0'}
			maxWidth="31.25rem"
			borderRadius="none"
			crossAlignment="flex-start"
			mainAlignment="flex-end"
			data-testid="meeting_sidebar"
		>
			{meetingChatVisibility !== MeetingChatVisibility.EXPANDED && (
				<AccordionContainer mainAlignment="flex-start" flexGrow="1" gap="gap: 0.063rem">
					{includes([RoomType.ONE_TO_ONE, RoomType.GROUP], roomType) && (
						<ActionsAccordion roomId={roomId || ''} isInsideMeeting meetingId={meetingId} />
					)}
					{includes([RoomType.TEMPORARY], roomType) && (
						<WaitingListAccordion meetingId={meetingId} />
					)}
					{includes([RoomType.GROUP, RoomType.TEMPORARY], roomType) && (
						<MeetingParticipantsAccordion meetingId={meetingId} />
					)}
				</AccordionContainer>
			)}
			<MeetingConversationAccordion roomId={roomId || ''} meetingId={meetingId} />
			<ChangeSidebarStatusButton>
				<Tooltip
					label={sidebarIsVisible ? collapseSidebarLabel : expandSidebarLabel}
					placement="right"
				>
					<SidebarIconButton
						iconColor="gray6"
						backgroundColor="text"
						icon={sidebarIsVisible ? 'ChevronLeftOutline' : 'ChevronRightOutline'}
						onClick={toggleSidebar}
						size="large"
						data-testid="sidebar_button"
					/>
				</Tooltip>
			</ChangeSidebarStatusButton>
			{!sidebarIsVisible && <BubblesWrapper />}
		</SidebarContainer>
	);
};

export default MeetingSidebar;
