/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { EventName, sendCustomEvent } from '../../../hooks/useEventListener';
import useStore from '../../../store/Store';
import { MeetingRecordingStoppedEvent } from '../../../types/network/websocket/wsMeetingEvents';
import { inThisMeetingTab } from '../eventHandlersUtilities';

export const meetingRecordingStoppedEventHandler = (event: MeetingRecordingStoppedEvent): void => {
	const state = useStore.getState();
	state.stopRecording(event.meetingId);
	if (inThisMeetingTab(event.meetingId)) {
		sendCustomEvent({ name: EventName.MEETING_RECORDING_STOPPED, data: event });
	}
	state.stopMeeting(event.meetingId);
};
