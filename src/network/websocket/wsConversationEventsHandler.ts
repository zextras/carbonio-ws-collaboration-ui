/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { EventName, sendCustomEvent } from '../../hooks/useEventListener';
import { getMeetingIdFromRoom } from '../../store/selectors/RoomsSelectors';
import useStore from '../../store/Store';
import { GetMeetingResponse } from '../../types/network/responses/meetingsResponses';
import { GetRoomResponse } from '../../types/network/responses/roomsResponses';
import { WsEvent, WsEventType } from '../../types/network/websocket/wsEvents';
import { RoomType } from '../../types/store/RoomTypes';
import { MeetingsApi, RoomsApi } from '../index';

export const wsConversationEventsHandler = (event: WsEvent): void => {
	const state = useStore.getState();
	const isMyId = (userId: string): boolean => userId === state.session.id;

	switch (event.type) {
		case WsEventType.ROOM_CREATED: {
			RoomsApi.getRoom(event.roomId).then((response: GetRoomResponse) =>
				state.addRooms([response])
			);
			state.connections.xmppClient.setOnline();
			break;
		}
		case WsEventType.ROOM_UPDATED: {
			state.editRoom(event.roomId, { name: event.name, description: event.description });
			break;
		}
		case WsEventType.ROOM_DELETED: {
			state.removeRoom(event.roomId);
			break;
		}
		case WsEventType.ROOM_OWNER_PROMOTED: {
			state.setMemberModeratorStatus(event.roomId, event.userId, true);
			if (isMyId(event.userId)) {
				sendCustomEvent({
					name: EventName.MEMBER_PROMOTED,
					data: event
				});
			}
			break;
		}
		case WsEventType.ROOM_OWNER_DEMOTED: {
			state.setMemberModeratorStatus(event.roomId, event.userId, false);
			if (isMyId(event.userId)) {
				sendCustomEvent({
					name: EventName.MEMBER_DEMOTED,
					data: event
				});
			}
			break;
		}
		case WsEventType.ROOM_PICTURE_CHANGED: {
			state.editRoom(event.roomId, { pictureUpdatedAt: event.updatedAt });
			break;
		}
		case WsEventType.ROOM_PICTURE_DELETED: {
			state.editRoom(event.roomId, { pictureUpdatedAt: undefined });
			break;
		}
		case WsEventType.ROOM_MEMBER_ADDED: {
			if (isMyId(event.userId)) {
				RoomsApi.getRoom(event.roomId).then((response: GetRoomResponse) => {
					state.addRooms([response]);
					if (response.meetingId) {
						MeetingsApi.getMeeting(response.id).then((meetingResponse: GetMeetingResponse) =>
							state.addMeetings([meetingResponse])
						);
					}
				});
			} else {
				state.addRoomMember(event.roomId, {
					userId: event.userId,
					owner: event.isOwner
				});
			}
			break;
		}
		case WsEventType.ROOM_MEMBER_REMOVED: {
			if (isMyId(event.userId)) {
				const meetingId = getMeetingIdFromRoom(useStore.getState(), event.roomId);
				if (meetingId) {
					state.deleteMeeting(meetingId);
				}
				state.removeRoom(event.roomId);
			} else {
				state.removeRoomMember(event.roomId, event.userId);
			}
			break;
		}
		case WsEventType.ROOM_MUTED: {
			state.setRoomMuteStatus(event.roomId, true);
			break;
		}
		case WsEventType.ROOM_UNMUTED: {
			state.setRoomMuteStatus(event.roomId, false);
			break;
		}
		case WsEventType.ROOM_HISTORY_CLEARED: {
			state.clearConversation(event.roomId, event.clearedAt);
			if (state.rooms[event.roomId]?.type === RoomType.TEMPORARY) {
				state.removePinnedMessage(event.roomId);
			}
			break;
		}
		default: {
			console.error(`Unhandled conversation event type: ${event.type}`);
		}
	}
};
