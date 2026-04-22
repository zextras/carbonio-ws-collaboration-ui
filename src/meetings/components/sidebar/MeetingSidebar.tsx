/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { ReactElement, useCallback, useContext, useMemo } from 'react';

import styled from '@emotion/styled';
import { Button, Container, Tooltip } from '@zextras/carbonio-design-system';
import { includes } from 'lodash';
import { useTranslation } from 'react-i18next';

import MeetingConversationAccordion from './MeetingConversationAccordion/MeetingConversationAccordion';
import MeetingParticipantsAccordion from './ParticipantsAccordion/MeetingParticipantsAccordion';
import RaiseHandAccordion from './raiseHandAccordion/RaiseHandAccordion';
import RecordingAccordion from './recordingAccordion/RecordingAccordion';
import WaitingListAccordion from './waitingListAccordion/WaitingListAccordion';
import {
	getMeetingChatVisibility,
	getMeetingSidebarStatus
} from '../../../store/selectors/ActiveMeetingSelectors';
import { getRoomIdByMeetingId } from '../../../store/selectors/MeetingSelectors';
import {
	getOwnershipOfTheRoom,
	getRoomTypeSelector
} from '../../../store/selectors/RoomsSelectors';
import { getAttribute, getUserId } from '../../../store/selectors/SessionSelectors';
import useStore from '../../../store/Store';
import {
	MeetingAccordionType,
	MeetingChatVisibility
} from '../../../types/store/ActiveMeetingTypes';
import { RoomType } from '../../../types/store/RoomTypes';
import BubblesWrapper from '../bubblesWrapper/BubblesWrapper';
import VisualEffectsAccordion from './visualEffectsAccordion/VisualEffectsAccordion';
import { getIsUserGuest } from '../../../store/selectors/UsersSelectors';
import { RouterContext } from '../../contexts/routerContext';

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
	const { meetingId } = useContext(RouterContext);

	const [t] = useTranslation();
	const collapseSidebarLabel = t('tooltip.collapseSidebar', 'Collapse sidebar');
	const expandSidebarLabel = t('tooltip.expandSidebar', 'Expand sidebar');

	const myUserId = useStore(getUserId);

	const roomId = useStore((store) => getRoomIdByMeetingId(store, meetingId!));
	const roomType = useStore((store) => getRoomTypeSelector(store, roomId ?? ''));
	const amIModerator = useStore((store) => getOwnershipOfTheRoom(store, roomId ?? ''));
	const meetingChatVisibility = useStore(getMeetingChatVisibility);
	const sidebarIsVisible: boolean = useStore(getMeetingSidebarStatus);
	const setMeetingSidebarStatus = useStore((store) => store.setMeetingSidebarStatus);
	const isUserGuest = useStore((store) => getIsUserGuest(store, myUserId ?? ''));
	const recordingEnabled = useStore((store) => getAttribute(store, 'recordingEnabled'));
	const virtualBackgroundEnabled = useStore((store) =>
		getAttribute(store, 'virtualBackgroundEnabled')
	);

	const toggleSidebar = useCallback(
		() => setMeetingSidebarStatus(MeetingAccordionType.GENERAL, !sidebarIsVisible),
		[setMeetingSidebarStatus, sidebarIsVisible]
	);

	const showRecordingAccordion = useMemo(
		() => recordingEnabled && amIModerator,
		[amIModerator, recordingEnabled]
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
			<Container height="100%" mainAlignment="space-between" style={{ overflow: 'hidden' }}>
				<Container
					height="fit"
					maxHeight={meetingChatVisibility === MeetingChatVisibility.OPEN ? '50%' : 'fill'}
				>
					{meetingChatVisibility !== MeetingChatVisibility.EXPANDED && (
						<AccordionContainer height="fit" mainAlignment="flex-start">
							{showRecordingAccordion && <RecordingAccordion meetingId={meetingId!} />}
							{showWaitingListAccordion && <WaitingListAccordion meetingId={meetingId!} />}
							{showParticipantsAccordion && <MeetingParticipantsAccordion meetingId={meetingId!} />}
							{<RaiseHandAccordion meetingId={meetingId!} />}
							{(virtualBackgroundEnabled || isUserGuest) && <VisualEffectsAccordion />}
						</AccordionContainer>
					)}
				</Container>
				<MeetingConversationAccordion roomId={roomId ?? ''} />
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
