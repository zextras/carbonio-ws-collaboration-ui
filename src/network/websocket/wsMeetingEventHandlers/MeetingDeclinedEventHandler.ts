/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { EventName, sendCustomEvent } from '../../../hooks/useEventListener';
import { MeetingDeclinedEvent } from '../../../types/network/websocket/wsMeetingEvents';

export const meetingDeclinedEventHandler = (event: MeetingDeclinedEvent): void => {
	sendCustomEvent({ name: EventName.MEETING_DECLINED, data: event });
};
