/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { ReactElement, useCallback, useMemo } from 'react';

import { Button, Container, Tooltip } from '@zextras/carbonio-design-system';
import { includes } from 'lodash';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';

import MeetingConversationAccordion from './MeetingConversationAccordion/MeetingConversationAccordion';
import MeetingParticipantsAccordion from './ParticipantsAccordion/MeetingParticipantsAccordion';
import RecordingAccordion from './recordingAccordion/RecordingAccordion';
import WaitingListAccordion from './waitingListAccordion/WaitingListAccordion';
import { MeetingRoutesParams } from '../../../hooks/useRouting';
import {
	getMeetingChatVisibility,
	getMeetingSidebarStatus
} from '../../../store/selectors/ActiveMeetingSelectors';
import { getRoomIdByMeetingId } from '../../../store/selectors/MeetingSelectors';
import {
	getOwnershipOfTheRoom,
	getRoomTypeSelector
} from '../../../store/selectors/RoomsSelectors';
import { getCapability } from '../../../store/selectors/SessionSelectors';
import useStore from '../../../store/Store';
import { MeetingChatVisibility } from '../../../types/store/ActiveMeetingTypes';
import { RoomType } from '../../../types/store/RoomTypes';
import { CapabilityType } from '../../../types/store/SessionTypes';
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
	z-index: 1;
`;

const SidebarButton = styled(Button)`
	width: 2.25rem;
	height: 15rem;
`;

const AccordionContainer = styled(Container)`
	overflow-y: scroll;
	scrollbar-width: none;
	::-webkit-scrollbar {
		width: 0;
	}
`;

const MeetingSidebar = (): ReactElement => {
	const { meetingId }: MeetingRoutesParams = useParams();

	const [t] = useTranslation();
	const collapseSidebarLabel = t('tooltip.collapseSidebar', 'Collapse sidebar');
	const expandSidebarLabel = t('tooltip.expandSidebar', 'Expand sidebar');

	const roomId = useStore((store) => getRoomIdByMeetingId(store, meetingId));
	const roomType = useStore((store) => getRoomTypeSelector(store, roomId ?? ''));
	const amIModerator = useStore((store) => getOwnershipOfTheRoom(store, roomId ?? ''));
	const meetingChatVisibility = useStore((store) => getMeetingChatVisibility(store, meetingId));
	const sidebarIsVisible: boolean = useStore((store) => getMeetingSidebarStatus(store, meetingId));
	const setMeetingSidebarStatus = useStore((store) => store.setMeetingSidebarStatus);
	const canVideoCallRecord = useStore((store) =>
		getCapability(store, CapabilityType.CAN_VIDEO_CALL_RECORD)
	);

	const toggleSidebar = useCallback(
		() => setMeetingSidebarStatus(meetingId, !sidebarIsVisible),
		[setMeetingSidebarStatus, meetingId, sidebarIsVisible]
	);

	const showRecordingAccordion = useMemo(
		() => canVideoCallRecord && amIModerator,
		[amIModerator, canVideoCallRecord]
	);

	const showWaitingListAccordion = useMemo(
		() => includes([RoomType.TEMPORARY], roomType) && amIModerator,
		[amIModerator, roomType]
	);

	const showParticipantsAccordion = useMemo(
		() => includes([RoomType.GROUP, RoomType.TEMPORARY], roomType),
		[roomType]
	);

	return (
		<SidebarContainer
			background={'text'}
			width={sidebarIsVisible ? '35%' : '0'}
			minWidth={sidebarIsVisible ? '23.125rem' : '0'}
			maxWidth="31.25rem"
			borderRadius="none"
			crossAlignment="flex-start"
			mainAlignment="flex-end"
			data-testid="meeting_sidebar"
		>
			<Container height="100%" mainAlignment="space-between">
				<Container
					height="fit"
					maxHeight={meetingChatVisibility === MeetingChatVisibility.OPEN ? '50%' : 'fill'}
				>
					{meetingChatVisibility !== MeetingChatVisibility.EXPANDED && (
						<AccordionContainer height="fit" mainAlignment="flex-start" gap="gap: 0.063rem">
							{showRecordingAccordion && <RecordingAccordion meetingId={meetingId} />}
							{showWaitingListAccordion && <WaitingListAccordion meetingId={meetingId} />}
							{showParticipantsAccordion && <MeetingParticipantsAccordion meetingId={meetingId} />}
						</AccordionContainer>
					)}
				</Container>
				<MeetingConversationAccordion roomId={roomId ?? ''} meetingId={meetingId} />
			</Container>
			<ChangeSidebarStatusButton>
				<Tooltip
					label={sidebarIsVisible ? collapseSidebarLabel : expandSidebarLabel}
					placement="right"
				>
					<SidebarButton
						labelColor="gray6"
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
