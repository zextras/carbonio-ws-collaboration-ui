/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { sharedConfig } from '../../../config';
import { EventName } from '../../../types/AppEvents';
import { MeetingWaitingParticipantClashed } from '../../../types/network/websocket/wsMeetingEvents';

export const meetingWaitingParticipantClashedEventHandler = (
	event: MeetingWaitingParticipantClashed
): void => {
	sharedConfig.sendCustomEvent({
		name: EventName.MEETING_WAITING_PARTICIPANT_CLASHED,
		data: event
	});
};
