/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { sharedConfig } from '../../../config';
import { MeetingAudioStreamChangedEvent } from '../../../types/network/websocket/wsMeetingEvents';
import { STREAM_TYPE } from '../../../types/store/ActiveMeetingTypes';
import { MeetingSoundFeedback } from '../../../utils/MeetingsUtils';
import { isMeetingActive, isMyId } from '../eventHandlersUtilities';
import { EventName } from 'wsc-shared';

export const meetingAudioStreamChangedEventHandler = (
	event: MeetingAudioStreamChangedEvent
): void => {
	const state = sharedConfig.useStore.getState();
	state.changeStreamStatus(event.meetingId, event.userId, STREAM_TYPE.AUDIO, event.active);

	if (isMeetingActive(event.meetingId)) {
		// If user is talking, delete his id from the isTalking array
		if (!event.active) {
			state.setTalkingUser(event.userId, false);
		}

		if (isMyId(event.userId)) {
			// Send to session user audio feedback on audio status changes
			event.active
				? sharedConfig.sendAudioFeedback(MeetingSoundFeedback.MEETING_AUDIO_ON)
				: sharedConfig.sendAudioFeedback(MeetingSoundFeedback.MEETING_AUDIO_OFF);

			// Mute the tile if someone performed this state on me
			if (!event.active && !!event.moderatorId) {
				state.activeMeeting?.bidirectionalAudioConn?.closeRtpSenderTrack();
				// Custom event to show snackbar
				sharedConfig.sendCustomEvent({ name: EventName.MEMBER_MUTED, data: event });
			}
		}
	}
};
