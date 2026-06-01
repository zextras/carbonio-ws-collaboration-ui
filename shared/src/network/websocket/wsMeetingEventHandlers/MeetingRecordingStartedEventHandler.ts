/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { sharedConfig } from '../../../config';
import { EventName } from '../../../types/AppEvents';
import { MeetingRecordingStartedEvent } from '../../../types/network/websocket/wsMeetingEvents';
import { isMeetingActive } from '../eventHandlersUtilities';

export const meetingRecordingStartedEventHandler = (event: MeetingRecordingStartedEvent): void => {
	const state = sharedConfig.useStore.getState();
	state.startRecording(event.meetingId, event.sentDate, event.userId);
	if (isMeetingActive(event.meetingId)) {
		sharedConfig.sendCustomEvent({ name: EventName.MEETING_RECORDING_STARTED, data: event });
	}
};
