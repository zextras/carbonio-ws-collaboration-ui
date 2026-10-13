/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { EventName, sendCustomEvent } from '../../../hooks/useEventListener';
import { MeetingParticipantKickedEvent } from '../../../types/network/websocket/wsMeetingEvents';
import { isMeetingActive, isMyId } from '../eventHandlersUtilities';

// TODO: assumes the backend also sends MeetingParticipantLeft for the kicked user,
//  so the other participants update their list through that event. Revisit once the event is agreed
export const meetingParticipantKickedEventHandler = (
	event: MeetingParticipantKickedEvent
): void => {
	if (isMyId(event.userId) && isMeetingActive(event.meetingId)) {
		sendCustomEvent({ name: EventName.MEETING_PARTICIPANT_KICKED, data: event });
	}
};
