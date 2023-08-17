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
	const eventArrivesFromAnotherSession = false;

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
				state.changeStreamStatus(event.meetingId, event.sessionId, STREAM_TYPE.VIDEO, true);
			}
			break;
		}
		case WsEventType.MEETING_VIDEO_STREAM_CLOSED: {
			// TODO: wait for meeting events changes
			if (eventArrivesFromAnotherSession) {
				state.changeStreamStatus(event.meetingId, event.sessionId, STREAM_TYPE.VIDEO, false);
			}
			break;
		}
		case WsEventType.MEETING_AUDIO_STREAM_ENABLED: {
			// TODO: wait for meeting events changes
			if (eventArrivesFromAnotherSession) {
				state.changeStreamStatus(event.meetingId, event.sessionId, STREAM_TYPE.AUDIO, true);
			}
			break;
		}
		case WsEventType.MEETING_AUDIO_STREAM_CLOSED: {
			// TODO: wait for meeting events changes
			if (eventArrivesFromAnotherSession) {
				state.changeStreamStatus(event.meetingId, event.sessionId, STREAM_TYPE.AUDIO, false);
			}
			break;
		}
		case WsEventType.MEETING_SCREEN_STREAM_OPENED: {
			// TODO: wait for meeting events changes
			if (eventArrivesFromAnotherSession) {
				state.changeStreamStatus(event.meetingId, event.sessionId, STREAM_TYPE.SCREEN, true);
			}
			break;
		}
		case WsEventType.MEETING_SCREEN_STREAM_CLOSED: {
			// TODO: wait for meeting events changes
			if (eventArrivesFromAnotherSession) {
				state.changeStreamStatus(event.meetingId, event.sessionId, STREAM_TYPE.SCREEN, false);
			}
			break;
		}
		case WsEventType.MEETING_MEDIA_STREAM_CHANGED: {
			// TODO COMMENTED ONLY FOR TEST PURPOSE
			// if (eventArrivesFromAnotherSession) {
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			const mediaType = event.mediaType.toLowerCase();
			MeetingsApi.subscribeToMedia(event.meetingId, event.sessionId, mediaType)
				.then((res) => {
					console.log(res);
				})
				.catch((er) => console.error(er));
			// }
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
		// TODO SCREEN OFFER
		// case WsEventType.MEETING_SCREEN_STREAM_CLOSED: {
		// state.activeMeeting[event.meetingId].bidirectionalAudioConn.;
		// break;
		// }
		default:
			wsDebug('Unhandled event', event);
	}
	// TODO REPLACE WITH NEW MEETINGS EVENTS
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore
	if (event.type === 8) {
		console.log('TEST ANSWER');
		console.log(event);
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		if (event.event.jsep.sdp.includes('AudioBridge')) {
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			if (event.event.jsep.type === 'ANSWER') {
				console.log('AUDIO ANSWER');
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				state.activeMeeting[event.meeting_id].bidirectionalAudioConn.handleRemoteAnswer({
					// eslint-disable-next-line @typescript-eslint/ban-ts-comment
					// @ts-ignore
					...event.event.jsep,
					type: 'answer'
				});
			}
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
		} else if (event.event.jsep.sdp.includes('VideoRoom')) {
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			if (event.event.jsep.type === 'ANSWER') {
				console.log('VIDEO ANSWER');
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				state.activeMeeting[event.meeting_id].videoOutConn.handleRemoteAnswer({
					// eslint-disable-next-line @typescript-eslint/ban-ts-comment
					// @ts-ignore
					...event.event.jsep,
					type: 'answer'
				});
			}
		}
	}
}
