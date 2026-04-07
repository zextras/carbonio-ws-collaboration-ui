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
	if (event.streams.length === 0) {
		console.log('No streams subscribed for participant', event.userId);
		return;
	}
	if (isMeetingActive(event.meetingId)) {
		state.activeMeeting?.videoScreenIn?.handleParticipantsSubscribed(event.streams);
	}
};
