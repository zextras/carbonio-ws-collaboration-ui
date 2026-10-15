/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import type { WireMeetingStoppedEvent } from '@zextras/carbonio-ws-collaboration-sdk';
import { find } from 'lodash';

import { EventName, sendCustomEvent } from '../../../hooks/useEventListener';
import useStore from '../../../store/Store';
import { MeetingStoppedEvent } from '../../../types/network/websocket/wsMeetingEvents';
import { RoomType } from '../../../types/store/RoomTypes';
import { isWscPure } from '../../chatClient/ChatClient';
import { wscSdk } from '../../sdk/wscSdk';
import { notifyConfigRow } from '../configRowEffects';

export const meetingStoppedEventHandler = (event: MeetingStoppedEvent): void => {
	const state = useStore.getState();

	// Send custom event to remove incoming meeting notification
	const meeting = find(state.meetings, (meeting) => meeting.id === event.meetingId);
	if (meeting && state.rooms[meeting.roomId]?.type === RoomType.ONE_TO_ONE) {
		sendCustomEvent({ name: EventName.REMOVED_MEETING_NOTIFICATION, data: event });
	}

	// `startedAt` is read before stopMeeting clears it; the v2 event carries the
	// line's author (`endedBy`), v1 lands the line from XMPP
	if (meeting && isWscPure()) {
		const row = wscSdk.handleMeetingStopped(
			event as WireMeetingStoppedEvent,
			meeting.roomId,
			meeting.startedAt
		);
		if (row) {
			notifyConfigRow(row);
		}
	}

	sendCustomEvent({ name: EventName.MEETING_STOPPED, data: event });
	state.stopMeeting(event.meetingId);
};
