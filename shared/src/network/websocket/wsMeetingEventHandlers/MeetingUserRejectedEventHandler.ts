/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { sharedConfig } from '../../../config';
import { MeetingUserRejectedEvent } from '../../../types/network/websocket/wsMeetingEvents';
import { inThisMeetingTab, isMyId } from '../eventHandlersUtilities';
import { EventName } from '../../../types/AppEvents';

export const meetingUserRejectedEventHandler = (event: MeetingUserRejectedEvent): void => {
	const state = sharedConfig.useStore.getState();
	state.removeUserFromWaitingList(event.meetingId, event.userId);

	// Send custom event to let session user know he is rejected
	if (isMyId(event.userId) && inThisMeetingTab(event.meetingId)) {
		sharedConfig.sendCustomEvent({
			name: EventName.MEETING_WAITING_PARTICIPANT_REJECTED,
			data: event
		});
	}
};
