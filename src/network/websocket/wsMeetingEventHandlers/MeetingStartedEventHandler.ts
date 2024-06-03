/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { find } from 'lodash';

import { EventName, sendCustomEvent } from '../../../hooks/useEventListener';
import useStore from '../../../store/Store';
import { MeetingStartedEvent } from '../../../types/network/websocket/wsMeetingEvents';
import { RoomType } from '../../../types/store/RoomTypes';

export const meetingStartedEventHandler = (event: MeetingStartedEvent): void => {
	const state = useStore.getState();
	state.startMeeting(event.meetingId, event.startedAt);

	// Send custom event to open an incoming meeting notification
	const meeting = find(state.meetings, (meeting) => meeting.id === event.meetingId);
	const room = find(state.rooms, (room) => room.id === meeting?.roomId);
	const isMeetingStartedByMe = event.starterUser === state.session.id;
	if (room?.type === RoomType.ONE_TO_ONE && !isMeetingStartedByMe) {
		sendCustomEvent({ name: EventName.INCOMING_MEETING, data: event });
	}
};
