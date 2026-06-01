/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { sharedConfig } from '../../../config';
import { MeetingWaitingParticipantClashed } from '../../../types/network/websocket/wsMeetingEvents';
import { inThisMeetingTab } from '../eventHandlersUtilities';
import { EventName } from '../../../types/AppEvents';

export const meetingWaitingParticipantClashedEventHandler = (
	event: MeetingWaitingParticipantClashed
): void => {
	if (inThisMeetingTab(event.meetingId)) {
		sharedConfig.sendCustomEvent({
			name: EventName.MEETING_WAITING_PARTICIPANT_CLASHED,
			data: event
		});
	}
};
