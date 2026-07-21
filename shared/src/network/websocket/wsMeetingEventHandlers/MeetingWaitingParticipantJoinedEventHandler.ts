/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { find } from 'lodash';

import { sharedConfig } from '../../../config';
import { EventName } from '../../../types/AppEvents';
import { MeetingWaitingParticipantJoinedEvent } from '../../../types/network/websocket/wsMeetingEvents';
import { isMeetingActive } from '../eventHandlersUtilities';

export const meetingWaitingParticipantJoinedEventHandler = (
	event: MeetingWaitingParticipantJoinedEvent
): void => {
	const state = sharedConfig.useStore.getState();
	const meeting = find(state.meetings, (meeting) => meeting.id === event.meetingId);
	const userIsParticipant = find(
		meeting?.participants,
		(participant) => participant.userId === state.session.id
	);
	if (userIsParticipant) {
		state.addUserToWaitingList(event.meetingId, event.userId);
		sharedConfig.sendCustomEvent({ name: EventName.NEW_WAITING_USER, data: event });
		if (isMeetingActive(event.meetingId)) {
			sharedConfig.displayNotification('waitingList', event.meetingId);
		}
	}
};
