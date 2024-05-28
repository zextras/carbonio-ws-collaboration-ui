/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import useStore from '../../../store/Store';
import { MeetingParticipantTalkingEvent } from '../../../types/network/websocket/wsMeetingEvents';

export const meetingParticipantTalkingEventHandler = (
	event: MeetingParticipantTalkingEvent
): void => {
	const state = useStore.getState();
	const activeMeeting = state.activeMeeting[event.meetingId];
	if (activeMeeting) {
		state.setTalkingUser(event.meetingId, event.userId, event.isTalking);
	}
};
