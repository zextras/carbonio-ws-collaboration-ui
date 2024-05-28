/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { EventName, sendCustomEvent } from '../../../hooks/useEventListener';
import useStore from '../../../store/Store';
import { MeetingRecordingStartedEvent } from '../../../types/network/websocket/wsMeetingEvents';
import { inThisMeetingTab } from '../eventHandlersUtilities';

export const meetingRecordingStartedEventHandler = (event: MeetingRecordingStartedEvent): void => {
	const state = useStore.getState();
	state.startRecording(event.meetingId, event.sentDate, event.userId);
	if (inThisMeetingTab(event.meetingId)) {
		sendCustomEvent({ name: EventName.MEETING_RECORDING_STARTED, data: event });
	}
};
