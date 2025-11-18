/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { SOUND_NOTIFICATION_PARTICIPANT_THRESHOLD } from '../../../constants/appConstants';
import { EventName, sendCustomEvent } from '../../../hooks/useEventListener';
import useStore from '../../../store/Store';
import { MeetingParticipantHandRaisedEvent } from '../../../types/network/websocket/wsMeetingEvents';
import { MeetingSoundFeedback, sendAudioFeedback } from '../../../utils/MeetingsUtils';

export const meetingParticipantHandRaisedHandler = (
	event: MeetingParticipantHandRaisedEvent
): void => {
	const { activeMeeting, setUserWithHandRaised } = useStore.getState();
	if (activeMeeting) {
		setUserWithHandRaised(event.userId, event.raised);
		sendCustomEvent({ name: EventName.MEETING_PARTICIPANT_RAISE_HAND, data: event });
		if (
			event.raised &&
			activeMeeting.usersWithHandRaised.length < SOUND_NOTIFICATION_PARTICIPANT_THRESHOLD
		) {
			sendAudioFeedback(MeetingSoundFeedback.NEW_HAND_RAISED);
		}
	}
};
