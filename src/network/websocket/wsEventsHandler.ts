/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { find } from 'lodash';

import { EventName, sendCustomEvent } from '../../hooks/useEventListener';
import useStore from '../../store/Store';
import { MeetingType, MeetingUserType } from '../../types/network/models/meetingBeTypes';
import { GetMeetingResponse } from '../../types/network/responses/meetingsResponses';
import { GetRoomResponse } from '../../types/network/responses/roomsResponses';
import { WsEvent, WsEventType } from '../../types/network/websocket/wsEvents';
import { RoomType } from '../../types/store/RoomTypes';
import { wsDebug } from '../../utils/debug';
import { MeetingsApi, RoomsApi } from '../index';

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
							if (response.meetingId) {
								MeetingsApi.getMeeting(response.id)
									.then((meetingResponse: GetMeetingResponse) => {
										state.addMeeting(meetingResponse);
									})
									.catch();
							}
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
					if (state.meetings[event.roomId] !== undefined) {
						state.deleteMeeting(state.meetings[event.roomId].id);
					}
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
			// TODO: wait for meeting events changes
			// For now, this event doesn't arrive

			state.addMeeting({
				id: event.meetingId,
				name: '', // TODO placeholder
				roomId: event.roomId,
				active: false,
				participants: [],
				createdAt: event.sentDate,
				meetingType: MeetingType.PERMANENT // TODO placeholder
			});

			// Send custom event to open an incoming meeting notification
			const room = state.rooms[event.roomId];
			const isMeetingStartedByMe = event.from === state.session.id;
			if (room?.type === RoomType.ONE_TO_ONE && !isMeetingStartedByMe) {
				sendCustomEvent({ name: EventName.INCOMING_MEETING, data: event });
			}
			break;
		}
		case WsEventType.MEETING_STARTED: {
			// TODO: wait for meeting events changes
			state.startMeeting(event.meetingId);
			break;
		}
		case WsEventType.MEETING_JOINED: {
			// TODO: wait for event changes
			state.addParticipant(event.meetingId, {
				userId: event.from,
				userType: MeetingUserType.REGISTERED, // TODO placeholder
				audioStreamOn: false,
				videoStreamOn: false
			});

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
			// TODO: wait for event changes
			if (eventArrivesFromAnotherSession) {
				if (event.from === state.session.id) {
					state.deleteMeeting(event.meetingId);
				} else {
					state.removeParticipant(event.meetingId, event.sessionId);
				}
			} else {
				state.deleteMeeting(event.meetingId);
			}
			break;
		}
		case WsEventType.MEETING_STOPPED: {
			// TODO: wait for meeting events changes
			state.stopMeeting(event.meetingId);
			break;
		}
		case WsEventType.MEETING_DELETED: {
			// TODO: wait for meeting events changes
			state.deleteMeeting(event.meetingId);
			break;
		}
		case WsEventType.MEETING_VIDEO_STREAM_OPENED: {
			// TODO: wait for meeting events changes
			if (eventArrivesFromAnotherSession) {
				state.changeStreamStatus(event.meetingId, event.sessionId, 'video', true);
			}
			break;
		}
		case WsEventType.MEETING_VIDEO_STREAM_CLOSED: {
			// TODO: wait for meeting events changes
			if (eventArrivesFromAnotherSession) {
				state.changeStreamStatus(event.meetingId, event.sessionId, 'video', false);
			}
			break;
		}
		case WsEventType.MEETING_AUDIO_STREAM_OPENED: {
			// TODO: wait for meeting events changes
			if (eventArrivesFromAnotherSession) {
				state.changeStreamStatus(event.meetingId, event.sessionId, 'audio', true);
			}
			break;
		}
		case WsEventType.MEETING_AUDIO_STREAM_CLOSED: {
			// TODO: wait for meeting events changes
			if (eventArrivesFromAnotherSession) {
				state.changeStreamStatus(event.meetingId, event.sessionId, 'audio', false);
			}
			break;
		}
		case WsEventType.MEETING_SCREEN_STREAM_OPENED: {
			// TODO: wait for meeting events changes
			if (eventArrivesFromAnotherSession) {
				state.changeStreamStatus(event.meetingId, event.sessionId, 'screen', true);
			}
			break;
		}
		case WsEventType.MEETING_SCREEN_STREAM_CLOSED: {
			// TODO: wait for meeting events changes
			if (eventArrivesFromAnotherSession) {
				state.changeStreamStatus(event.meetingId, event.sessionId, 'screen', false);
			}
			break;
		}
		// TODO AUDIO ANSWER
		// case WsEventType.AUDIO_ANSWER: {
		// state.activeMeeting[event.meetingId].bidirectionalAudioConn.handleRemoteAnswer();
		// break;
		// }
		// TODO VIDEO_IN OFFER
		// case WsEventType.VIDEO_IN_OFFER: {
		// state.activeMeeting[event.meetingId].videoIn.handleRemoteOffer();
		// break;
		// }
		// TODO SHARE OFFER
		// case WsEventType.MEETING_SCREEN_STREAM_CLOSED: {
		// state.activeMeeting[event.meetingId].bidirectionalAudioConn.;
		// break;
		// }
		default:
			wsDebug('Unhandled event', event);
	}
}
