/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import useStore from '../../../store/Store';
import { MeetingAudioAnsweredEvent } from '../../../types/network/websocket/wsMeetingEvents';
import { isMeetingActive } from '../eventHandlersUtilities';

export const meetingAudioAnsweredEventHandler = (event: MeetingAudioAnsweredEvent): void => {
	const state = useStore.getState();
	if (isMeetingActive(event.meetingId)) {
		const activeMeeting = state.activeMeeting[event.meetingId];
		activeMeeting.bidirectionalAudioConn?.handleRemoteAnswer({
			sdp: event.sdp,
			type: 'answer'
		});
	}
};
