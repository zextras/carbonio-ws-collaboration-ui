/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { sharedConfig } from '../../../config';
import { EventName } from '../../../types/AppEvents';
import { MeetingUserAcceptedEvent } from '../../../types/network/websocket/wsMeetingEvents';
import { isMyId } from '../eventHandlersUtilities';

export const meetingUserAcceptedEventHandler = (event: MeetingUserAcceptedEvent): void => {
	const state = sharedConfig.useStore.getState();
	state.removeUserFromWaitingList(event.meetingId, event.userId);

	// Send custom event to let session user know he is accepted
	if (isMyId(event.userId)) {
		sharedConfig.sendCustomEvent({
			name: EventName.MEETING_WAITING_PARTICIPANT_ACCEPTED,
			data: event
		});
	}
};
