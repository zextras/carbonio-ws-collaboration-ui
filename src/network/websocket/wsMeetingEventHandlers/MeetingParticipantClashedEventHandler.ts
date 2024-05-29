/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { EventName, sendCustomEvent } from '../../../hooks/useEventListener';
import { MeetingParticipantClashedEvent } from '../../../types/network/websocket/wsMeetingEvents';
import { isMeetingActive } from '../eventHandlersUtilities';

export const meetingParticipantClashedEventHandler = (
	event: MeetingParticipantClashedEvent
): void => {
	if (isMeetingActive(event.meetingId)) {
		sendCustomEvent({ name: EventName.MEETING_PARTICIPANT_CLASHED, data: event });
	}
};
