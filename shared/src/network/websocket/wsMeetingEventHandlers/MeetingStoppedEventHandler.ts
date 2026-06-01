/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { find } from 'lodash';

import { sharedConfig } from '../../../config';
import { EventName } from '../../../types/AppEvents';
import { MeetingStoppedEvent } from '../../../types/network/websocket/wsMeetingEvents';
import { RoomType } from '../../../types/store/RoomTypes';

export const meetingStoppedEventHandler = (event: MeetingStoppedEvent): void => {
	const state = sharedConfig.useStore.getState();

	// Send custom event to remove incoming meeting notification
	const meeting = find(state.meetings, (meeting) => meeting.id === event.meetingId);
	if (meeting && state.rooms[meeting.roomId]?.type === RoomType.ONE_TO_ONE) {
		sharedConfig.sendCustomEvent({ name: EventName.REMOVED_MEETING_NOTIFICATION, data: event });
	}

	sharedConfig.sendCustomEvent({ name: EventName.MEETING_STOPPED, data: event });
	state.stopMeeting(event.meetingId);
};
