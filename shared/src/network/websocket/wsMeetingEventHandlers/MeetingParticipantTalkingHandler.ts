/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { sharedConfig } from '../../../config';
import { MeetingParticipantTalkingEvent } from '../../../types/network/websocket/wsMeetingEvents';
import { isMeetingActive } from '../eventHandlersUtilities';

export const meetingParticipantTalkingEventHandler = (
	event: MeetingParticipantTalkingEvent
): void => {
	const state = sharedConfig.useStore.getState();
	if (isMeetingActive(event.meetingId)) {
		state.setTalkingUser(event.userId, event.isTalking);
	}
};
