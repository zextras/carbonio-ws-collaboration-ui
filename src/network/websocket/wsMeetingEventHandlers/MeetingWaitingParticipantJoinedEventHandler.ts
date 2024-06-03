/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { find } from 'lodash';

import { EventName, sendCustomEvent } from '../../../hooks/useEventListener';
import displayWaitingListNotification from '../../../meetings/components/sidebar/waitingListAccordion/displayWaitingListNotification';
import useStore from '../../../store/Store';
import { MeetingWaitingParticipantJoinedEvent } from '../../../types/network/websocket/wsMeetingEvents';
import { inThisMeetingTab } from '../eventHandlersUtilities';

export const meetingWaitingParticipantJoinedEventHandler = (
	event: MeetingWaitingParticipantJoinedEvent
): void => {
	const state = useStore.getState();
	const meeting = find(state.meetings, (meeting) => meeting.id === event.meetingId);
	const userIsParticipant = find(
		meeting?.participants,
		(participant) => participant.userId === state.session.id
	);
	if (userIsParticipant) {
		state.addUserToWaitingList(event.meetingId, event.userId);
		sendCustomEvent({ name: EventName.NEW_WAITING_USER, data: event });
		if (inThisMeetingTab(event.meetingId)) {
			displayWaitingListNotification(event.meetingId);
		}
	}
};
