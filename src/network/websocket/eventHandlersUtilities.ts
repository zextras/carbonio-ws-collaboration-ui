/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { MEETINGS_PATH } from '../../constants/appConstants';
import useStore from '../../store/Store';
import { WsEventType } from '../../types/network/websocket/wsEvents';

export enum EventArea {
	GENERAL = 'general',
	MEETING = 'meeting',
	CONVERSATION = 'conversation'
}

export const eventHandlersUtilities = (eventType: WsEventType): EventArea | undefined => {
	switch (eventType) {
		case WsEventType.INITIALIZATION:
		case WsEventType.PONG: {
			return EventArea.GENERAL;
		}
		case WsEventType.ROOM_CREATED:
		case WsEventType.ROOM_UPDATED:
		case WsEventType.ROOM_DELETED:
		case WsEventType.ROOM_OWNER_PROMOTED:
		case WsEventType.ROOM_OWNER_DEMOTED:
		case WsEventType.ROOM_PICTURE_CHANGED:
		case WsEventType.ROOM_PICTURE_DELETED:
		case WsEventType.ROOM_MEMBER_ADDED:
		case WsEventType.ROOM_MEMBER_REMOVED:
		case WsEventType.ROOM_MUTED:
		case WsEventType.ROOM_UNMUTED:
		case WsEventType.USER_PICTURE_CHANGED:
		case WsEventType.USER_PICTURE_DELETED:
		case WsEventType.ROOM_HISTORY_CLEARED: {
			return EventArea.CONVERSATION;
		}
		case WsEventType.MEETING_CREATED:
		case WsEventType.MEETING_STARTED:
		case WsEventType.MEETING_JOINED:
		case WsEventType.MEETING_LEFT:
		case WsEventType.MEETING_STOPPED:
		case WsEventType.MEETING_DELETED:
		case WsEventType.MEETING_AUDIO_STREAM_CHANGED:
		case WsEventType.MEETING_MEDIA_STREAM_CHANGED:
		case WsEventType.MEETING_AUDIO_ANSWERED:
		case WsEventType.MEETING_SDP_ANSWERED:
		case WsEventType.MEETING_SDP_OFFERED:
		case WsEventType.MEETING_PARTICIPANT_SUBSCRIBED:
		case WsEventType.MEETING_PARTICIPANT_TALKING:
		case WsEventType.MEETING_PARTICIPANT_CLASHED:
		case WsEventType.MEETING_WAITING_PARTICIPANT_JOINED:
		case WsEventType.MEETING_USER_ACCEPTED:
		case WsEventType.MEETING_USER_REJECTED:
		case WsEventType.MEETING_WAITING_PARTICIPANT_CLASHED:
		case WsEventType.MEETING_RECORDING_STARTED:
		case WsEventType.MEETING_RECORDING_STOPPED: {
			return EventArea.MEETING;
		}
		default: {
			return undefined;
		}
	}
};

export const isMyId = (userId: string): boolean => userId === useStore.getState().session.id;

export const inThisMeetingTab = (meetingId: string): boolean =>
	window.location.pathname.includes(`${MEETINGS_PATH}${meetingId}`);
