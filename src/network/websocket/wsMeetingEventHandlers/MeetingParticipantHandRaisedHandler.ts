/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import useStore from '../../../store/Store';
import { MeetingParticipantHandRaisedEvent } from '../../../types/network/websocket/wsMeetingEvents';
import { isMeetingActive } from '../eventHandlersUtilities';

export const meetingParticipantHandRaisedHandler = (
	event: MeetingParticipantHandRaisedEvent
): void => {
	const state = useStore.getState();
	if (isMeetingActive(event.meetingId)) {
		state.setUserWithHandRaised(event.meetingId, event.userId, event.raised);
	}
};
