/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { EventName, sendCustomEvent } from '../../../hooks/useEventListener';
import useStore from '../../../store/Store';
import { MeetingAudioStreamChangedEvent } from '../../../types/network/websocket/wsMeetingEvents';
import { STREAM_TYPE } from '../../../types/store/ActiveMeetingTypes';
import { MeetingSoundFeedback, sendAudioFeedback } from '../../../utils/MeetingsUtils';
import { isMeetingActive, isMyId } from '../eventHandlersUtilities';

export const meetingAudioStreamChangedEventHandler = (
	event: MeetingAudioStreamChangedEvent
): void => {
	const state = useStore.getState();
	state.changeStreamStatus(event.meetingId, event.userId, STREAM_TYPE.AUDIO, event.active);

	if (isMeetingActive(event.meetingId)) {
		// If user is talking, delete his id from the isTalking array
		if (!event.active) {
			state.setTalkingUser(event.meetingId, event.userId, false);
		}

		if (isMyId(event.userId)) {
			// Send to session user audio feedback on audio status changes
			event.active
				? sendAudioFeedback(MeetingSoundFeedback.MEETING_AUDIO_ON)
				: sendAudioFeedback(MeetingSoundFeedback.MEETING_AUDIO_OFF);

			// Mute the tile if someone performed this state on me
			if (!event.active && !!event.moderatorId) {
				const activeMeeting = state.activeMeeting[event.meetingId];
				activeMeeting.bidirectionalAudioConn?.closeRtpSenderTrack();
				// Custom event to show snackbar
				sendCustomEvent({ name: EventName.MEMBER_MUTED, data: event });
			}
		}
	}
};
