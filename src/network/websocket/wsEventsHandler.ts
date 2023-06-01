/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { find } from 'lodash';

import { EventName, sendCustomEvent } from '../../hooks/useEventListener';
import useStore from '../../store/Store';
import { GetRoomResponse } from '../../types/network/responses/roomsResponses';
import { WsEvent, WsEventType } from '../../types/network/websocket/wsEvents';
import { RoomType } from '../../types/store/RoomTypes';
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
		case WsEventType.ROOM_HISTORY_CLEARED: {
			if (eventArrivesFromAnotherSession) {
				state.setClearedAt(event.roomId, event.clearedAt);
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
		case WsEventType.MEETING_CREATED: {
			if (eventArrivesFromAnotherSession) {
				state.addMeeting({
					id: event.meetingId,
					roomId: event.roomId,
					participants: [],
					createdAt: event.sentDate
				});

				// Send custom event to open an incoming meeting notification
				const room = state.rooms[event.roomId];
				const isMeetingStartedByMe = event.from === state.session.id;
				if (room?.type === RoomType.ONE_TO_ONE && !isMeetingStartedByMe) {
					sendCustomEvent({ name: EventName.INCOMING_MEETING, data: event });
				}
			}
			break;
		}
		case WsEventType.MEETING_JOINED: {
			if (eventArrivesFromAnotherSession) {
				state.addParticipant(event.meetingId, {
					sessionId: event.sessionId,
					userId: event.from,
					audioStreamOn: false,
					videoStreamOn: false
				});
			}

			// Send custom event to delete an incoming meeting notification
			// if I joined the meeting from another session
			const meeting = find(state.meetings, (meeting) => meeting.id === event.meetingId);
			if (
				meeting &&
				state.rooms[meeting.roomId]?.type === RoomType.ONE_TO_ONE &&
				event.from === state.session.id
			) {
				sendCustomEvent({ name: EventName.REMOVED_MEETING_NOTIFICATION, data: event });
			}
			break;
		}
		case WsEventType.MEETING_LEFT: {
			if (eventArrivesFromAnotherSession) {
				state.removeParticipant(event.meetingId, event.sessionId);
			}
			break;
		}
		case WsEventType.MEETING_DELETED: {
			state.deleteMeeting(event.meetingId);
			break;
		}
		case WsEventType.MEETING_VIDEO_STREAM_OPENED: {
			if (eventArrivesFromAnotherSession) {
				state.changeStreamStatus(event.meetingId, event.sessionId, 'video', true);
			}
			break;
		}
		case WsEventType.MEETING_VIDEO_STREAM_CLOSED: {
			if (eventArrivesFromAnotherSession) {
				state.changeStreamStatus(event.meetingId, event.sessionId, 'video', false);
			}
			break;
		}
		case WsEventType.MEETING_AUDIO_STREAM_OPENED: {
			if (eventArrivesFromAnotherSession) {
				state.changeStreamStatus(event.meetingId, event.sessionId, 'audio', true);
			}
			break;
		}
		case WsEventType.MEETING_AUDIO_STREAM_CLOSED: {
			if (eventArrivesFromAnotherSession) {
				state.changeStreamStatus(event.meetingId, event.sessionId, 'audio', false);
			}
			break;
		}
		case WsEventType.MEETING_SCREEN_STREAM_OPENED: {
			if (eventArrivesFromAnotherSession) {
				state.changeStreamStatus(event.meetingId, event.sessionId, 'screen', true);
			}
			break;
		}
		case WsEventType.MEETING_SCREEN_STREAM_CLOSED: {
			if (eventArrivesFromAnotherSession) {
				state.changeStreamStatus(event.meetingId, event.sessionId, 'screen', false);
			}
			break;
		}
		default:
			wsDebug('Unhandled event', event);
	}
}
