/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { find } from 'lodash';

import { EventName, sendCustomEvent } from '../../../hooks/useEventListener';
import useStore from '../../../store/Store';
import { MeetingParticipantHandRaisedEvent } from '../../../types/network/websocket/wsMeetingEvents';
import { MeetingSoundFeedback, sendAudioFeedback } from '../../../utils/MeetingsUtils';
import { isMeetingActive } from '../eventHandlersUtilities';

export const meetingParticipantHandRaisedHandler = (
	event: MeetingParticipantHandRaisedEvent
): void => {
	const state = useStore.getState();
	const meeting = find(state.meetings, (meeting) => meeting.id === event.meetingId);

	if (isMeetingActive(event.meetingId)) {
		state.setUserWithHandRaised(event.meetingId, event.userId, event.raised);
		sendCustomEvent({ name: EventName.MEETING_PARTICIPANT_RAISE_HAND, data: event });
		if (meeting?.participants && Object.keys(meeting?.participants).length < 20) {
			sendAudioFeedback(MeetingSoundFeedback.NEW_HAND_RAISED);
		}
	}
};
