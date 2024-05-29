/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { EventName, sendCustomEvent } from '../../../hooks/useEventListener';
import useStore from '../../../store/Store';
import { MeetingUserAcceptedEvent } from '../../../types/network/websocket/wsMeetingEvents';
import { inThisMeetingTab, isMyId } from '../eventHandlersUtilities';

export const meetingUserAcceptedEventHandler = (event: MeetingUserAcceptedEvent): void => {
	const state = useStore.getState();
	state.removeUserFromWaitingList(event.meetingId, event.userId);

	// Send custom event to let session user know he is accepted
	if (isMyId(event.userId) && inThisMeetingTab(event.meetingId)) {
		sendCustomEvent({ name: EventName.MEETING_USER_ACCEPTED, data: event });
	}
};
