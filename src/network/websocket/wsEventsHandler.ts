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
	const eventArrivesFromAnotherSession = event.sessionId !== useStore.getState().session.sessionId;

	switch (event.type) {
		case WsEventType.INITIALIZATION: {
			state.setSessionId(event.sessionId);
			break;
		}
		case WsEventType.ROOM_CREATED: {
			if (eventArrivesFromAnotherSession) {
				RoomsApi.getRoom(event.roomId)
					.then((response: GetRoomResponse) => {
						state.addRoom(response);
					})
					.catch(() => null);
			}
			break;
		}
		case WsEventType.ROOM_UPDATED: {
			if (eventArrivesFromAnotherSession) {
				state.setRoomNameAndDescription(event.roomId, event.name, event.description);
			}
			break;
		}
		case WsEventType.ROOM_DELETED: {
			if (eventArrivesFromAnotherSession) {
				state.deleteRoom(event.roomId);
			}
			break;
		}
		case WsEventType.ROOM_OWNER_CHANGED: {
			if (eventArrivesFromAnotherSession) {
				if (event.owner) {
					state.promoteMemberToModerator(event.roomId, event.userId);
				} else {
					state.demoteMemberFromModerator(event.roomId, event.userId);
				}
			}
			break;
		}
		case WsEventType.ROOM_PICTURE_CHANGED: {
			if (eventArrivesFromAnotherSession) {
				state.setRoomPictureUpdated(event.roomId, event.sentDate);
			}
			break;
		}
		case WsEventType.ROOM_PICTURE_DELETED: {
			if (eventArrivesFromAnotherSession) {
				state.setRoomPictureDeleted(event.roomId);
			}
			break;
		}
		case WsEventType.ROOM_MEMBER_ADDED: {
			if (eventArrivesFromAnotherSession) {
				if (event.member.userId === state.session.id) {
					RoomsApi.getRoom(event.roomId)
						.then((response: GetRoomResponse) => {
							state.addRoom(response);
						})
						.catch(() => null);
				} else {
					state.addRoomMember(event.roomId, event.member);
				}
			}
			break;
		}
		case WsEventType.ROOM_MEMBER_REMOVED: {
			if (eventArrivesFromAnotherSession) {
				if (event.userId === state.session.id) {
					state.deleteRoom(event.roomId);
				} else {
					state.removeRoomMember(event.roomId, event.userId);
				}
			}
			break;
		}
		case WsEventType.ATTACHMENT_ADDED: {
			// TODO handle
			break;
		}
		case WsEventType.ATTACHMENT_REMOVED: {
			// TODO handle
			break;
		}
		case WsEventType.ROOM_MUTED: {
			if (eventArrivesFromAnotherSession) {
				state.setRoomMuted(event.roomId);
			}
			break;
		}
		case WsEventType.ROOM_UNMUTED: {
			if (eventArrivesFromAnotherSession) {
				state.setRoomUnmuted(event.roomId);
			}
			break;
		}
		case WsEventType.USER_PICTURE_CHANGED: {
			if (eventArrivesFromAnotherSession) {
				state.setUserPictureUpdated(event.userId, event.sentDate);
			}
			break;
		}
		case WsEventType.USER_PICTURE_DELETED: {
			if (eventArrivesFromAnotherSession) {
				state.setUserPictureDeleted(event.userId);
			}
			break;
		}
		case WsEventType.ROOM_HISTORY_CLEARED: {
			if (eventArrivesFromAnotherSession) {
				state.setClearedAt(event.roomId, event.clearedAt);
			}
			break;
		}
		default:
			wsDebug('Unhandled event', event);
	}
}
