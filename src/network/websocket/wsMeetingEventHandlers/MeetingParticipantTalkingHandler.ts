/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import useStore from '../../../store/Store';
import { MeetingParticipantTalkingEvent } from '../../../types/network/websocket/wsMeetingEvents';
import { isMeetingActive } from '../eventHandlersUtilities';

export const meetingParticipantTalkingEventHandler = (
	event: MeetingParticipantTalkingEvent
): void => {
	const state = useStore.getState();
	if (isMeetingActive(event.meetingId)) {
		state.setTalkingUser(event.meetingId, event.userId, event.isTalking);
	}
};
