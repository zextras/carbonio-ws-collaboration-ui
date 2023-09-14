/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Container, IconButton, Tooltip } from '@zextras/carbonio-design-system';
import React, { ReactElement, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';

import MeetingConversationAccordion from './MeetingConversationAccordion/MeetingConversationAccordion';
import MeetingParticipantsAccordion from './ParticipantsAccordion/MeetingParticipantsAccordion';
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

const SidebarContainer = styled(Container)`
	position: relative;
`;

const ChangeSidebarStatusButton = styled.div`
	position: absolute;
	right: calc(-1rem - 2.25rem);
	top: calc(50% - (15.09375rem / 2));
	z-index: 999;
`;

const SidebarIconButton = styled(IconButton)`
	width: 2.25rem;
	height: 15rem;
`;

const AccordionContainer = styled(Container)`
	overflow-y: auto;
	gap: 1px;
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
			minWidth={sidebarIsVisible ? '370px' : '0'}
			maxWidth="500px"
			borderRadius="none"
			crossAlignment="flex-start"
			mainAlignment="space-between"
		>
			{meetingChatVisibility !== MeetingChatVisibility.EXPANDED && (
				<AccordionContainer
					height={meetingChatVisibility === MeetingChatVisibility.OPEN ? '50%' : 'fill'}
					maxHeight={meetingChatVisibility === MeetingChatVisibility.OPEN ? '50%' : 'fill'}
					mainAlignment="flex-start"
				>
					<ActionsAccordion roomId={roomId || ''} isInsideMeeting meetingId={meetingId} />
					{roomType !== RoomType.ONE_TO_ONE && (
						<MeetingParticipantsAccordion meetingId={meetingId} />
					)}
				</AccordionContainer>
			)}
			<MeetingConversationAccordion roomId={roomId || ''} meetingId={meetingId} isInsideMeeting />
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
					/>
				</Tooltip>
			</ChangeSidebarStatusButton>
		</SidebarContainer>
	);
};

export default MeetingSidebar;
