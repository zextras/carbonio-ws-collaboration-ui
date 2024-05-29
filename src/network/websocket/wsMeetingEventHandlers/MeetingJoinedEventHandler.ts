/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { find } from 'lodash';

import { EventName, sendCustomEvent } from '../../../hooks/useEventListener';
import useStore from '../../../store/Store';
import { MeetingJoinedEvent } from '../../../types/network/websocket/wsMeetingEvents';
import { MeetingParticipant } from '../../../types/store/MeetingTypes';
import { RoomType } from '../../../types/store/RoomTypes';
import { MeetingSoundFeedback, sendAudioFeedback } from '../../../utils/MeetingsUtils';
import { isMeetingActive, isMyId } from '../eventHandlersUtilities';

export const meetingJoinedEventHandler = (event: MeetingJoinedEvent): void => {
	const state = useStore.getState();
	const newParticipant: MeetingParticipant = {
		userId: event.userId,
		audioStreamOn: false,
		videoStreamOn: false,
		joinedAt: event.sentDate
	};
	state.addParticipant(event.meetingId, newParticipant);

	// Send custom event to delete an incoming meeting notification if I joined the meeting from another session
	const meeting = find(state.meetings, (meeting) => meeting.id === event.meetingId);
	if (
		meeting &&
		state.rooms[meeting.roomId]?.type === RoomType.ONE_TO_ONE &&
		isMyId(event.userId)
	) {
		sendCustomEvent({ name: EventName.REMOVED_MEETING_NOTIFICATION, data: event });
	}

	// Send audio feedback to other participants session user join
	if (isMeetingActive(event.meetingId) && !isMyId(event.userId)) {
		sendAudioFeedback(MeetingSoundFeedback.MEETING_JOIN_NOTIFICATION);
	}
};
