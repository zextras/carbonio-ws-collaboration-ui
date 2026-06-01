/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { find } from 'lodash';

import { sharedConfig } from '../../../config';
import { EventName } from '../../../types/AppEvents';
import { MeetingDeclinedEvent } from '../../../types/network/websocket/wsMeetingEvents';
import { RoomType } from '../../../types/store/RoomTypes';
import { isMeetingActive, isMyId } from '../eventHandlersUtilities';

export const meetingDeclinedEventHandler = (event: MeetingDeclinedEvent): void => {
	if (isMeetingActive(event.meetingId)) {
		sharedConfig.sendCustomEvent({ name: EventName.MEETING_DECLINED, data: event });
	}

	// Send custom event to delete an incoming meeting notification if I declined the meeting from another session
	const meeting = find(
		sharedConfig.useStore.getState().meetings,
		(meeting) => meeting.id === event.meetingId
	);
	if (
		meeting &&
		sharedConfig.useStore.getState().rooms[meeting.roomId]?.type === RoomType.ONE_TO_ONE &&
		isMyId(event.userId)
	) {
		sharedConfig.sendCustomEvent({ name: EventName.REMOVED_MEETING_NOTIFICATION, data: event });
	}
};
