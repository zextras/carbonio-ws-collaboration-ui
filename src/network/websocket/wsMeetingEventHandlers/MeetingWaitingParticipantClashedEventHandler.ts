/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { EventName, sendCustomEvent } from '../../../hooks/useEventListener';
import { MeetingWaitingParticipantClashed } from '../../../types/network/websocket/wsMeetingEvents';
import { inThisMeetingTab } from '../eventHandlersUtilities';

export const meetingWaitingParticipantClashedEventHandler = (
	event: MeetingWaitingParticipantClashed
): void => {
	if (inThisMeetingTab(event.meetingId)) {
		sendCustomEvent({ name: EventName.MEETING_WAITING_PARTICIPANT_CLASHED, data: event });
	}
};
