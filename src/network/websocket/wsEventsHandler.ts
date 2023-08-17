/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import useStore from '../../store/Store';
import { GetRoomResponse } from '../../types/network/responses/roomsResponses';
import { WsEvent, WsEventType } from '../../types/network/websocket/wsEvents';
import { wsDebug } from '../../utils/debug';
import { RoomsApi } from '../index';

export function wsEventsHandler(event: WsEvent): void {
	const state = useStore.getState();
	switch (event.type) {
		case WsEventType.INITIALIZATION: {
			state.setSessionId(event.sessionId);
			break;
		}
		case WsEventType.ROOM_CREATED: {
			RoomsApi.getRoom(event.roomId).then((response: GetRoomResponse) => state.addRoom(response));
			break;
		}
		case WsEventType.ROOM_UPDATED: {
			state.setRoomNameAndDescription(event.roomId, event.name, event.description);
			break;
		}
		case WsEventType.ROOM_DELETED: {
			state.deleteRoom(event.roomId);
			break;
		}
		case WsEventType.ROOM_OWNER_PROMOTED: {
			state.promoteMemberToModerator(event.roomId, event.userId);
			break;
		}
		case WsEventType.ROOM_OWNER_DEMOTED: {
			state.demoteMemberFromModerator(event.roomId, event.userId);
			break;
		}
		case WsEventType.ROOM_PICTURE_CHANGED: {
			state.setRoomPictureUpdated(event.roomId, event.updatedAt);
			break;
		}
		case WsEventType.ROOM_PICTURE_DELETED: {
			state.setRoomPictureDeleted(event.roomId);
			break;
		}
		case WsEventType.ROOM_MEMBER_ADDED: {
			if (event.userId === state.session.id) {
				RoomsApi.getRoom(event.roomId)
					.then((response: GetRoomResponse) => {
						state.addRoom(response);
					})
					.catch(() => null);
			} else {
				state.addRoomMember(event.roomId, {
					userId: event.userId,
					owner: event.isOwner
				});
			}
			break;
		}
		case WsEventType.ROOM_MEMBER_REMOVED: {
			if (event.userId === state.session.id) {
				state.deleteRoom(event.roomId);
			} else {
				state.removeRoomMember(event.roomId, event.userId);
			}
			break;
		}
		case WsEventType.ROOM_MUTED: {
			state.setRoomMuted(event.roomId);
			break;
		}
		case WsEventType.ROOM_UNMUTED: {
			state.setRoomUnmuted(event.roomId);
			break;
		}
		case WsEventType.USER_PICTURE_CHANGED: {
			state.setUserPictureUpdated(event.userId, event.sentDate);
			break;
		}
		case WsEventType.USER_PICTURE_DELETED: {
			state.setUserPictureDeleted(event.userId);
			break;
		}
		case WsEventType.ROOM_HISTORY_CLEARED: {
			state.setClearedAt(event.roomId, event.clearedAt);
			break;
		}
		default:
			wsDebug('Unhandled event', event);
	}
}
