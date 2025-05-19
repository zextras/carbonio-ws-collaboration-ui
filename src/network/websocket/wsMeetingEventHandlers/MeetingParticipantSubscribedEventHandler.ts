/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import useStore from '../../../store/Store';
import { MeetingParticipantSubscribedEvent } from '../../../types/network/websocket/wsMeetingEvents';
import { isMeetingActive } from '../eventHandlersUtilities';

export const meetingParticipantSubscribedEventHandler = (
	event: MeetingParticipantSubscribedEvent
): void => {
	const state = useStore.getState();
	if (isMeetingActive(event.meetingId)) {
		state.activeMeeting?.videoScreenIn?.handleParticipantsSubscribed(event.streams);
	}
};
