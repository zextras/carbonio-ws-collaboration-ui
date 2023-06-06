/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Container } from '@zextras/carbonio-design-system';
import React, { ReactElement } from 'react';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';

import MeetingParticipantsAccordion from './ParticipantsAccordion/MeetingParticipantsAccordion';
import { ActionsAccordion } from '../../../chats/components/infoPanel/conversationActionsAccordion/ActionsAccordion';
import { getRoomIdByMeetingId, getSidebarStatus } from '../../../store/selectors/MeetingSelectors';
import { getRoomTypeSelector } from '../../../store/selectors/RoomsSelectors';
import useStore from '../../../store/Store';
import { RoomType } from '../../../types/store/RoomTypes';

const SidebarContainer = styled(Container)`
	transition: width 300ms ease 0s;
`;

const MeetingSidebar = (): ReactElement => {
	const { meetingId }: Record<string, string> = useParams();
	const roomId = useStore((store) => getRoomIdByMeetingId(store, meetingId));
	const roomType = useStore((store) => getRoomTypeSelector(store, roomId || ''));
	const sidebarStatus: boolean | undefined = useStore((store) =>
		getSidebarStatus(store, meetingId)
	);

	return (
		<SidebarContainer
			background="text"
			width={sidebarStatus ? '35%' : '0'}
			// minWidth={sidebarIsVisible ? '300px' : '0'}
			maxWidth="500px"
			borderRadius="none"
			crossAlignment="flex-start"
			mainAlignment="flex-start"
		>
			<ActionsAccordion roomId={roomId || ''} isInsideMeeting />
			{roomType !== RoomType.ONE_TO_ONE && <MeetingParticipantsAccordion meetingId={meetingId} />}
		</SidebarContainer>
	);
};

export default MeetingSidebar;
