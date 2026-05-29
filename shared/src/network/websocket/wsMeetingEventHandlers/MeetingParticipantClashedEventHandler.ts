/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { sharedConfig } from '../../../config';
import { MeetingParticipantClashedEvent } from '../../../types/network/websocket/wsMeetingEvents';
import { isMeetingActive } from '../eventHandlersUtilities';
import { EventName } from 'wsc-shared';

export const meetingParticipantClashedEventHandler = (
	event: MeetingParticipantClashedEvent
): void => {
	if (isMeetingActive(event.meetingId)) {
		sharedConfig.sendCustomEvent({ name: EventName.MEETING_PARTICIPANT_CLASHED, data: event });
	}
};
