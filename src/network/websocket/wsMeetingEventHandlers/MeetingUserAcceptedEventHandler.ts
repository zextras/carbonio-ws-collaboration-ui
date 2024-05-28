/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { EventName, sendCustomEvent } from '../../../hooks/useEventListener';
import useStore from '../../../store/Store';
import { MeetingUserAcceptedEvent } from '../../../types/network/websocket/wsMeetingEvents';
import { inThisMeetingTab } from '../eventHandlersUtilities';

export const meetingUserAcceptedEventHandler = (event: MeetingUserAcceptedEvent): void => {
	const state = useStore.getState();
	state.removeUserFromWaitingList(event.meetingId, event.userId);
	if (inThisMeetingTab(event.meetingId)) {
		sendCustomEvent({ name: EventName.MEETING_USER_ACCEPTED, data: event });
	}
};
