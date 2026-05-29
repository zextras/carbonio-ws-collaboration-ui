/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { find } from 'lodash';

import { sharedConfig } from '../../../config';
import { MeetingStartedEvent } from '../../../types/network/websocket/wsMeetingEvents';
import { RoomType } from '../../../types/store/RoomTypes';
import { EventName } from 'wsc-shared';

export const meetingStartedEventHandler = (event: MeetingStartedEvent): void => {
	const state = sharedConfig.useStore.getState();
	state.startMeeting(event.meetingId, event.startedAt);

	// Send custom event to open an incoming meeting notification
	const meeting = find(state.meetings, (meeting) => meeting.id === event.meetingId);
	const room = find(state.rooms, (room) => room.id === meeting?.roomId);
	const isMeetingStartedByMe = event.starterUser === state.session.id;
	if (room?.type === RoomType.ONE_TO_ONE && !isMeetingStartedByMe) {
		sharedConfig.sendCustomEvent({ name: EventName.INCOMING_MEETING, data: event });
	}
};
