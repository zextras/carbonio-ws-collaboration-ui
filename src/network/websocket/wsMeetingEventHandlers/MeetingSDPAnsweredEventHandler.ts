/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import useStore from '../../../store/Store';
import { MeetingSDPAnsweredEvent } from '../../../types/network/websocket/wsMeetingEvents';
import { STREAM_TYPE } from '../../../types/store/ActiveMeetingTypes';
import { isMeetingActive } from '../eventHandlersUtilities';

export const meetingSDPAnsweredEventHandler = (event: MeetingSDPAnsweredEvent): void => {
	const state = useStore.getState();
	if (isMeetingActive(event.meetingId)) {
		const mediaType = event.mediaType?.toLowerCase() as STREAM_TYPE;
		if (mediaType === STREAM_TYPE.VIDEO) {
			state.activeMeeting?.videoOutConn?.handleRemoteAnswer({
				sdp: event.sdp,
				type: 'answer'
			});
		}
		if (mediaType === STREAM_TYPE.SCREEN) {
			state.activeMeeting?.screenOutConn?.handleRemoteAnswer({
				sdp: event.sdp,
				type: 'answer'
			});
		}
	}
};
