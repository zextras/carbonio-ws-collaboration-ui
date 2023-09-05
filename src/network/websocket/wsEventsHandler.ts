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
import { STREAM_TYPE } from '../../types/store/ActiveMeetingTypes';
import { RoomType } from '../../types/store/RoomTypes';
import { wsDebug } from '../../utils/debug';
import { MeetingsApi, RoomsApi } from '../index';

export function wsEventsHandler(event: WsEvent): void {
	const state = useStore.getState();

	switch (event.type) {
		case WsEventType.INITIALIZATION: {
			state.setSessionId(event.queueId);
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
				RoomsApi.getRoom(event.roomId).then((response: GetRoomResponse) => {
					state.addRoom(response);
					if (response.meetingId) {
						MeetingsApi.getMeeting(response.id).then((meetingResponse: GetMeetingResponse) =>
							state.addMeeting(meetingResponse)
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
			if (event.userId === state.session.id) {
				if (state.meetings[event.roomId] !== undefined) {
					state.deleteMeeting(state.meetings[event.roomId].id);
				}
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
		case WsEventType.MEETING_CREATED: {
			state.addMeeting({
				id: event.meetingId,
				name: '',
				roomId: event.roomId,
				active: false,
				participants: [],
				createdAt: event.sentDate,
				meetingType: MeetingType.PERMANENT
			});
			break;
		}
		case WsEventType.MEETING_STARTED: {
			state.startMeeting(event.meetingId);

			// Send custom event to open an incoming meeting notification
			const meeting = find(state.meetings, (meeting) => meeting.id === event.meetingId);
			const room = find(state.rooms, (room) => room.id === meeting?.roomId);
			const isMeetingStartedByMe = event.starterUser === state.session.id;
			if (room?.type === RoomType.ONE_TO_ONE && !isMeetingStartedByMe) {
				sendCustomEvent({ name: EventName.INCOMING_MEETING, data: event });
			}
			break;
		}
		case WsEventType.MEETING_JOINED: {
			state.addParticipant(event.meetingId, {
				userId: event.userId,
				userType: MeetingUserType.REGISTERED,
				audioStreamOn: false,
				videoStreamOn: false
			});

			// Send custom event to delete an incoming meeting notification if I joined the meeting from another session
			const meeting = find(state.meetings, (meeting) => meeting.id === event.meetingId);
			if (
				meeting &&
				state.rooms[meeting.roomId]?.type === RoomType.ONE_TO_ONE &&
				event.userId === state.session.id
			) {
				sendCustomEvent({ name: EventName.REMOVED_MEETING_NOTIFICATION, data: event });
			}
			break;
		}
		case WsEventType.MEETING_LEFT: {
			state.removeParticipant(event.meetingId, event.userId);
			break;
		}
		case WsEventType.MEETING_STOPPED: {
			state.stopMeeting(event.meetingId);
			break;
		}
		case WsEventType.MEETING_DELETED: {
			state.deleteMeeting(event.meetingId);
			break;
		}
		case WsEventType.MEETING_AUDIO_STREAM_CHANGED: {
			state.changeStreamStatus(event.meetingId, event.userId, STREAM_TYPE.AUDIO, event.active);
			break;
		}
		case WsEventType.MEETING_MEDIA_STREAM_CHANGED: {
			const mediaType = event.mediaType.toLowerCase() as STREAM_TYPE;
			if (mediaType === STREAM_TYPE.VIDEO) {
				state.changeStreamStatus(event.meetingId, event.userId, STREAM_TYPE.VIDEO, event.active);
			}
			if (mediaType === STREAM_TYPE.SCREEN) {
				state.changeStreamStatus(event.meetingId, event.userId, STREAM_TYPE.SCREEN, event.active);
			}
			if (event.userId !== state.session.id) {
				MeetingsApi.subscribeToMedia(event.meetingId, event.userId, mediaType)
					.then((res) => console.log(res))
					.catch((er) => console.error(er));
			}
			break;
		}
		case WsEventType.MEETING_AUDIO_ANSWERED: {
			const activeMeeting = state.activeMeeting[event.meetingId];
			if (activeMeeting.bidirectionalAudioConn) {
				activeMeeting.bidirectionalAudioConn.handleRemoteAnswer({
					sdp: event.sdp,
					type: 'answer'
				});
			}
			break;
		}
		case WsEventType.MEETING_SDP_ANSWERED: {
			const activeMeeting = state.activeMeeting[event.meetingId];
			if (activeMeeting.videoOutConn) {
				if (event.mediaType === STREAM_TYPE.VIDEO) {
					activeMeeting.videoOutConn.handleRemoteAnswer({
						sdp: event.sdp,
						type: 'answer'
					});
				}
			}
			break;
		}
		case WsEventType.MEETING_SDP_OFFERED: {
			console.log('MEETING_SDP_OFFERED ', event);
			break;
		}
		default:
			wsDebug('Unhandled event', event);
			break;
	}
}
