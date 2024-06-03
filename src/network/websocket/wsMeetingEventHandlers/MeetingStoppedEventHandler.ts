/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { find } from 'lodash';

import { EventName, sendCustomEvent } from '../../../hooks/useEventListener';
import useStore from '../../../store/Store';
import { MeetingStoppedEvent } from '../../../types/network/websocket/wsMeetingEvents';
import { RoomType } from '../../../types/store/RoomTypes';
import { isMeetingActive } from '../eventHandlersUtilities';

export const meetingStoppedEventHandler = (event: MeetingStoppedEvent): void => {
	const state = useStore.getState();

	// Send custom event to remove incoming meeting notification
	const meeting = find(state.meetings, (meeting) => meeting.id === event.meetingId);
	if (meeting && state.rooms[meeting.roomId]?.type === RoomType.ONE_TO_ONE) {
		sendCustomEvent({ name: EventName.REMOVED_MEETING_NOTIFICATION, data: event });
	}

	// Send custom event to stop meeting everyone is in
	if (isMeetingActive(event.meetingId)) {
		sendCustomEvent({ name: EventName.MEETING_STOPPED, data: event });
	}
	state.stopMeeting(event.meetingId);
};
