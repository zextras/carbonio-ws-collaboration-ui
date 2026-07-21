/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { sharedConfig } from '../../../config';
import { SOUND_NOTIFICATION_PARTICIPANT_THRESHOLD } from '../../../constants';
import { EventName } from '../../../types/AppEvents';
import { AudioType } from '../../../types/AudioType';
import { MeetingParticipantHandRaisedEvent } from '../../../types/network/websocket/wsMeetingEvents';

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
			sharedConfig.playAudio(AudioType.NEW_HAND_RAISED);
		}
	}
};
