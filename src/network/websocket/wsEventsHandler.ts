/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { find } from 'lodash';

import { EventName, sendCustomEvent } from '../../hooks/useEventListener';
import useStore from '../../store/Store';
import { MeetingType } from '../../types/network/models/meetingBeTypes';
import { GetMeetingResponse } from '../../types/network/responses/meetingsResponses';
import { GetRoomResponse } from '../../types/network/responses/roomsResponses';
import { WsEvent, WsEventType } from '../../types/network/websocket/wsEvents';
import { STREAM_TYPE } from '../../types/store/ActiveMeetingTypes';
import { RoomType } from '../../types/store/RoomTypes';
import { wsDebug } from '../../utils/debug';
import { MeetingSoundFeedback, sendAudioFeedback } from '../../utils/MeetingsUtils';
import { MeetingsApi, RoomsApi } from '../index';

// eslint-disable-next-line sonarjs/cognitive-complexity
export function wsEventsHandler(event: WsEvent): void {
	const state = useStore.getState();

	switch (event.type) {
		case WsEventType.INITIALIZATION: {
			state.setSessionId(event.queueId);
			break;
		}
		case WsEventType.ROOM_CREATED: {
			RoomsApi.getRoom(event.roomId).then((response: GetRoomResponse) => state.addRoom(response));
			state.connections.xmppClient.setOnline();
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
				audioStreamOn: false,
				videoStreamOn: false,
				joinedAt: event.sentDate
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

			// Send audio feedback to other participants session user join
			const activeMeeting = state.activeMeeting[event.meetingId];
			if (activeMeeting && event.userId !== state.session.id) {
				sendAudioFeedback(MeetingSoundFeedback.MEETING_JOIN_NOTIFICATION);
			}
			break;
		}
		case WsEventType.MEETING_LEFT: {
			state.removeParticipant(event.meetingId, event.userId);

			// Update subscription manager
			const subscriptionsManager =
				state.activeMeeting[event.meetingId]?.videoScreenIn?.subscriptionManager;
			if (subscriptionsManager) {
				subscriptionsManager?.removeStreamToAsk(event.userId, STREAM_TYPE.VIDEO);
				subscriptionsManager?.removeStreamToAsk(event.userId, STREAM_TYPE.SCREEN);
			}

			// Send audio feedback to other participants session user leave
			const activeMeeting = state.activeMeeting[event.meetingId];
			if (activeMeeting && event.userId !== state.session.id) {
				sendAudioFeedback(MeetingSoundFeedback.MEETING_LEAVE_NOTIFICATION);
			}

			// if user is talking, delete his id from the isTalking array
			if (activeMeeting) {
				state.setTalkingUser(event.meetingId, event.userId, false);
			}
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

			// Send to session user audio feedback on audio status changes
			const activeMeeting = state.activeMeeting[event.meetingId];
			if (activeMeeting && event.userId === state.session.id) {
				event.active
					? sendAudioFeedback(MeetingSoundFeedback.MEETING_AUDIO_ON)
					: sendAudioFeedback(MeetingSoundFeedback.MEETING_AUDIO_OFF);
			}
			// if user is talking, delete his id from the isTalking array
			if (activeMeeting && !event.active) {
				state.setTalkingUser(event.meetingId, event.userId, false);
			}

			// mute the tile if someone performed this state on me
			if (activeMeeting && event.userId === state.session.id && !event.active) {
				activeMeeting.bidirectionalAudioConn?.closeRtpSenderTrack();
				// custom event to show snackbar
				sendCustomEvent({ name: EventName.MEMBER_MUTED, data: event });
			}
			break;
		}
		case WsEventType.MEETING_MEDIA_STREAM_CHANGED: {
			const mediaType = event.mediaType.toLowerCase() as STREAM_TYPE;
			state.changeStreamStatus(event.meetingId, event.userId, mediaType, event.active);

			// Auto pin new screen share
			if (mediaType === STREAM_TYPE.SCREEN && event.active) {
				state.setPinnedTile(event.meetingId, { userId: event.userId, type: mediaType });
			}

			// Send audio feedback of session user screen sharing
			const activeMeeting = state.activeMeeting[event.meetingId];
			if (activeMeeting && mediaType === STREAM_TYPE.SCREEN) {
				sendAudioFeedback(MeetingSoundFeedback.MEETING_SCREENSHARE_NOTIFICATION);
			}

			// Update subscription manager
			if (event.userId !== state.session.id) {
				const subscriptionsManager =
					state.activeMeeting[event.meetingId]?.videoScreenIn?.subscriptionManager;
				if (event.active) {
					subscriptionsManager?.addStreamToAsk(event.userId, mediaType);
				} else {
					subscriptionsManager?.removeStreamToAsk(event.userId, mediaType);
				}
			}
			break;
		}
		case WsEventType.MEETING_AUDIO_ANSWERED: {
			const activeMeeting = state.activeMeeting[event.meetingId];
			if (activeMeeting?.bidirectionalAudioConn) {
				activeMeeting.bidirectionalAudioConn.handleRemoteAnswer({
					sdp: event.sdp,
					type: 'answer'
				});
			}
			break;
		}
		case WsEventType.MEETING_SDP_ANSWERED: {
			const activeMeeting = state.activeMeeting[event.meetingId];
			if (activeMeeting) {
				const mediaType = event.mediaType.toLowerCase() as STREAM_TYPE;
				if (mediaType === STREAM_TYPE.VIDEO && activeMeeting.videoOutConn) {
					activeMeeting.videoOutConn.handleRemoteAnswer({
						sdp: event.sdp,
						type: 'answer'
					});
				}
				if (mediaType === STREAM_TYPE.SCREEN) {
					activeMeeting.screenOutConn?.handleRemoteAnswer({
						sdp: event.sdp,
						type: 'answer'
					});
				}
			}
			break;
		}
		case WsEventType.MEETING_SDP_OFFERED: {
			const activeMeeting = state.activeMeeting[event.meetingId];
			if (activeMeeting?.videoScreenIn) {
				activeMeeting.videoScreenIn.handleRemoteOffer(event.sdp);
			}
			break;
		}
		case WsEventType.MEETING_PARTICIPANT_SUBSCRIBED: {
			const activeMeeting = state.activeMeeting[event.meetingId];
			if (activeMeeting?.videoScreenIn) {
				activeMeeting.videoScreenIn.handleParticipantsSubscribed(event.streams);
			}
			break;
		}
		case WsEventType.MEETING_PARTICIPANT_TALKING: {
			const activeMeeting = state.activeMeeting[event.meetingId];
			if (activeMeeting) {
				state.setTalkingUser(event.meetingId, event.userId, event.isTalking);
			}
			break;
		}
		case WsEventType.MEETING_PARTICIPANT_CLASHED: {
			// TODO
			break;
		}
		default:
			wsDebug('Unhandled event', event);
			break;
	}
}
