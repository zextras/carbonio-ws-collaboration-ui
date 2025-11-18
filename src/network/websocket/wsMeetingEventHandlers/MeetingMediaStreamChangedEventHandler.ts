/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import useStore from '../../../store/Store';
import { MeetingMediaStreamChangedEvent } from '../../../types/network/websocket/wsMeetingEvents';
import { STREAM_TYPE } from '../../../types/store/ActiveMeetingTypes';
import { MeetingSoundFeedback, sendAudioFeedback } from '../../../utils/MeetingsUtils';
import { isMeetingActive, isMyId } from '../eventHandlersUtilities';

export const meetingMediaStreamChangedEventHandler = (
	event: MeetingMediaStreamChangedEvent
): void => {
	const state = useStore.getState();
	const mediaType = event.mediaType?.toLowerCase() as STREAM_TYPE;

	// Update subscription manager
	if (!isMyId(event.userId) && !event.active) {
		const sub = { userId: event.userId, type: mediaType };
		if (mediaType === STREAM_TYPE.VIDEO) {
			state.setRemoveSubscription(event.meetingId, sub);
		}
		if (mediaType === STREAM_TYPE.SCREEN) {
			state.setDeleteSubscription(event.meetingId, event.userId, [STREAM_TYPE.SCREEN]);
		}
	}

	state.changeStreamStatus(event.meetingId, event.userId, mediaType, event.active);

	// Send audio feedback when a new screen share started
	if (isMeetingActive(event.meetingId) && mediaType === STREAM_TYPE.SCREEN && event.active) {
		sendAudioFeedback(MeetingSoundFeedback.MEETING_SCREENSHARE_NOTIFICATION);
	}

	// Update subscription manager
	if (!isMyId(event.userId) && event.active) {
		const sub = { userId: event.userId, type: mediaType };
		state.setAddSubscription(event.meetingId, sub);
	}
};
