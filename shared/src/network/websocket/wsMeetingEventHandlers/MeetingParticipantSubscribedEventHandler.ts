/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { sharedConfig } from '../../../config';
import { MeetingParticipantSubscribedEvent } from '../../../types/network/websocket/wsMeetingEvents';
import { isMeetingActive } from '../eventHandlersUtilities';

export const meetingParticipantSubscribedEventHandler = (
	event: MeetingParticipantSubscribedEvent
): void => {
	const state = sharedConfig.useStore.getState();
	if (isMeetingActive(event.meetingId)) {
		state.activeMeeting?.videoScreenIn?.handleParticipantsSubscribed(event.streams);
	}
};
