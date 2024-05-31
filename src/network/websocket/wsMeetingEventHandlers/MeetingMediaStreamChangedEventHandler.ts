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
		state.setRemoveSubscription(event.meetingId, sub);
	}

	state.changeStreamStatus(event.meetingId, event.userId, mediaType, event.active);

	// Auto pin new screen share
	if (mediaType === STREAM_TYPE.SCREEN && event.active) {
		state.setPinnedTile(event.meetingId, { userId: event.userId, type: mediaType });
	}

	// Send audio feedback of session user screen sharing
	if (isMeetingActive(event.meetingId) && mediaType === STREAM_TYPE.SCREEN) {
		sendAudioFeedback(MeetingSoundFeedback.MEETING_SCREENSHARE_NOTIFICATION);
	}

	// Update subscription manager
	if (!isMyId(event.userId) && event.active) {
		const sub = { userId: event.userId, type: mediaType };
		state.setAddSubscription(event.meetingId, sub);
	}
};
