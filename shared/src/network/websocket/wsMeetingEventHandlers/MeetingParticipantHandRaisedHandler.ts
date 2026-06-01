/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { sharedConfig } from '../../../config';
import { SOUND_NOTIFICATION_PARTICIPANT_THRESHOLD } from '../../../constants';
import { MeetingParticipantHandRaisedEvent } from '../../../types/network/websocket/wsMeetingEvents';
import { MeetingSoundFeedback } from '../../../utils/MeetingsUtils';
import { EventName } from 'wsc-shared';

export const meetingParticipantHandRaisedHandler = (
	event: MeetingParticipantHandRaisedEvent
): void => {
	const { activeMeeting, setUserWithHandRaised } = sharedConfig.useStore.getState();
	if (activeMeeting) {
		setUserWithHandRaised(event.userId, event.raised);
		sharedConfig.sendCustomEvent({ name: EventName.MEETING_PARTICIPANT_RAISE_HAND, data: event });
		if (
			event.raised &&
			activeMeeting.usersWithHandRaised.length < SOUND_NOTIFICATION_PARTICIPANT_THRESHOLD
		) {
			sharedConfig.sendAudioFeedback(MeetingSoundFeedback.NEW_HAND_RAISED);
		}
	}
};
