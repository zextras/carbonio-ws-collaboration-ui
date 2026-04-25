/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { EventName, sendCustomEvent } from '../../../hooks/useEventListener';
import { MeetingDeclinedEvent } from '../../../types/network/websocket/wsMeetingEvents';
import { isMeetingActive } from '../eventHandlersUtilities';

export const meetingDeclinedEventHandler = (event: MeetingDeclinedEvent): void => {
	if (isMeetingActive(event.meetingId)) {
		sendCustomEvent({ name: EventName.MEETING_DECLINED, data: event });
	}
};
