/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import useStore from '../../../store/Store';
import { MeetingLeftEvent } from '../../../types/network/websocket/wsMeetingEvents';
import { MeetingSoundFeedback, sendAudioFeedback } from '../../../utils/MeetingsUtils';
import { isMeetingActive, isMyId } from '../eventHandlersUtilities';

export const meetingLeftEventHandler = (event: MeetingLeftEvent): void => {
	const state = useStore.getState();
	state.removeParticipant(event.meetingId, event.userId);

	// Update subscription manager
	state.setDeleteSubscription(event.meetingId, event.userId);

	if (isMeetingActive(event.meetingId)) {
		// Send audio feedback to other participants session user leave
		if (!isMyId(event.userId)) {
			sendAudioFeedback(MeetingSoundFeedback.MEETING_LEAVE_NOTIFICATION);
		}

		// if user is talking, delete his id from the isTalking array
		state.setTalkingUser(event.meetingId, event.userId, false);
	}
};
