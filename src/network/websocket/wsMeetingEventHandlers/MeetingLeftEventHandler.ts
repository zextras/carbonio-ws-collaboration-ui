/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { EventName, sendCustomEvent } from '../../../hooks/useEventListener';
import useStore from '../../../store/Store';
import {
	MeetingLeftEvent,
	MeetingLeftReason
} from '../../../types/network/websocket/wsMeetingEvents';
import { STREAM_TYPE } from '../../../types/store/ActiveMeetingTypes';
import { isMeetingActive, isMyId } from '../eventHandlersUtilities';

export const meetingLeftEventHandler = (event: MeetingLeftEvent): void => {
	const state = useStore.getState();

	if (!isMyId(event.userId) || !isMeetingActive(event.meetingId)) {
		state.removeParticipant(event.meetingId, event.userId);
	}

	if (isMeetingActive(event.meetingId)) {
		if (event.reason === MeetingLeftReason.KICKED && isMyId(event.userId)) {
			sendCustomEvent({ name: EventName.MEETING_PARTICIPANT_KICKED, data: event });
		}
		// Update subscription manager
		state.setDeleteSubscription(event.meetingId, event.userId, [
			STREAM_TYPE.VIDEO,
			STREAM_TYPE.SCREEN
		]);

		// if user is talking, delete his id from the isTalking array
		state.setTalkingUser(event.userId, false);
		state.setUserWithHandRaised(event.userId, false);
	}
};
