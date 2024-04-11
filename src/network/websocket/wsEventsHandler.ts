/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
/* eslint-disable sonarjs/max-switch-cases */

import { find } from 'lodash';

import { MEETINGS_PATH } from '../../constants/appConstants';
import { EventName, sendCustomEvent } from '../../hooks/useEventListener';
import displayWaitingListNotification from '../../meetings/components/sidebar/waitingListAccordion/displayWaitingListNotification';
import useStore from '../../store/Store';
import { MeetingType } from '../../types/network/models/meetingBeTypes';
import { GetMeetingResponse } from '../../types/network/responses/meetingsResponses';
import { GetRoomResponse } from '../../types/network/responses/roomsResponses';
import { WsEvent, WsEventType } from '../../types/network/websocket/wsEvents';
import { STREAM_TYPE } from '../../types/store/ActiveMeetingTypes';
import { MeetingParticipant } from '../../types/store/MeetingTypes';
import { RoomType } from '../../types/store/RoomTypes';
import { wsDebug } from '../../utils/debug';
import { MeetingSoundFeedback, sendAudioFeedback } from '../../utils/MeetingsUtils';
import { MeetingsApi, RoomsApi } from '../index';

export function wsEventsHandler(event: WsEvent): void {
	const state = useStore.getState();
	const inThisMeetingTab = (meetingId: string): boolean =>
		window.location.pathname.includes(`${MEETINGS_PATH}${meetingId}`);
	const sessionId = state.session.id;

	const isMyId = (userId: string): boolean => userId === sessionId;

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
			if (event.userId === sessionId) {
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
			if (event.userId === sessionId) {
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
			state.startMeeting(event.meetingId, event.startedAt);

			// Send custom event to open an incoming meeting notification
			const meeting = find(state.meetings, (meeting) => meeting.id === event.meetingId);
			const room = find(state.rooms, (room) => room.id === meeting?.roomId);
			const isMeetingStartedByMe = event.starterUser === sessionId;
			if (room?.type === RoomType.ONE_TO_ONE && !isMeetingStartedByMe) {
				sendCustomEvent({ name: EventName.INCOMING_MEETING, data: event });
			}
			break;
		}
		case WsEventType.MEETING_JOINED: {
			const newParticipant: MeetingParticipant = {
				userId: event.userId,
				audioStreamOn: false,
				videoStreamOn: false,
				joinedAt: event.sentDate
			};
			state.addParticipant(event.meetingId, newParticipant);

			// Send custom event to delete an incoming meeting notification if I joined the meeting from another session
			const meeting = find(state.meetings, (meeting) => meeting.id === event.meetingId);
			if (
				meeting &&
				state.rooms[meeting.roomId]?.type === RoomType.ONE_TO_ONE &&
				event.userId === sessionId
			) {
				sendCustomEvent({ name: EventName.REMOVED_MEETING_NOTIFICATION, data: event });
			}

			// Send audio feedback to other participants session user join
			if (inThisMeetingTab(event.meetingId) && !isMyId(event.userId)) {
				sendAudioFeedback(MeetingSoundFeedback.MEETING_JOIN_NOTIFICATION);
			}
			break;
		}
		case WsEventType.MEETING_LEFT: {
			state.removeParticipant(event.meetingId, event.userId);

			// Update subscription manager
			state.setDeleteSubscription(event.meetingId, event.userId);

			if (inThisMeetingTab(event.meetingId)) {
				// Send audio feedback to other participants session user leave
				if (!isMyId(event.userId)) {
					sendAudioFeedback(MeetingSoundFeedback.MEETING_LEAVE_NOTIFICATION);
				}

				// if user is talking, delete his id from the isTalking array
				state.setTalkingUser(event.meetingId, event.userId, false);
			}
			break;
		}
		case WsEventType.MEETING_STOPPED: {
			const meeting = find(state.meetings, (meeting) => meeting.id === event.meetingId);
			if (meeting && state.rooms[meeting.roomId]?.type === RoomType.ONE_TO_ONE) {
				sendCustomEvent({ name: EventName.REMOVED_MEETING_NOTIFICATION, data: event });
			}
			if (inThisMeetingTab(event.meetingId)) {
				sendCustomEvent({ name: EventName.MEETING_STOPPED, data: event });
			}
			state.stopMeeting(event.meetingId);
			break;
		}
		case WsEventType.MEETING_DELETED: {
			state.deleteMeeting(event.meetingId);
			break;
		}
		case WsEventType.MEETING_AUDIO_STREAM_CHANGED: {
			state.changeStreamStatus(event.meetingId, event.userId, STREAM_TYPE.AUDIO, event.active);

			if (inThisMeetingTab(event.meetingId)) {
				// If user is talking, delete his id from the isTalking array
				if (!event.active) {
					state.setTalkingUser(event.meetingId, event.userId, false);
				}

				if (isMyId(event.userId)) {
					// Send to session user audio feedback on audio status changes
					event.active
						? sendAudioFeedback(MeetingSoundFeedback.MEETING_AUDIO_ON)
						: sendAudioFeedback(MeetingSoundFeedback.MEETING_AUDIO_OFF);

					// Mute the tile if someone performed this state on me
					if (!event.active && !!event.moderatorId) {
						const activeMeeting = state.activeMeeting[event.meetingId];
						activeMeeting.bidirectionalAudioConn?.closeRtpSenderTrack();
						// Custom event to show snackbar
						sendCustomEvent({ name: EventName.MEMBER_MUTED, data: event });
					}
				}
			}
			break;
		}
		case WsEventType.MEETING_MEDIA_STREAM_CHANGED: {
			const mediaType = event.mediaType.toLowerCase() as STREAM_TYPE;

			// Update subscription manager
			if (!isMyId(event.userId)) {
				const sub = { userId: event.userId, type: mediaType };
				if (!event.active) {
					state.setRemoveSubscription(event.meetingId, sub);
				}
			}

			state.changeStreamStatus(event.meetingId, event.userId, mediaType, event.active);

			// Auto pin new screen share
			if (mediaType === STREAM_TYPE.SCREEN && event.active) {
				state.setPinnedTile(event.meetingId, { userId: event.userId, type: mediaType });
			}

			// Send audio feedback of session user screen sharing
			if (inThisMeetingTab(event.meetingId) && mediaType === STREAM_TYPE.SCREEN) {
				sendAudioFeedback(MeetingSoundFeedback.MEETING_SCREENSHARE_NOTIFICATION);
			}

			// Update subscription manager
			if (!isMyId(event.userId)) {
				const sub = { userId: event.userId, type: mediaType };
				if (event.active) {
					state.setAddSubscription(event.meetingId, sub);
				}
			}

			break;
		}
		case WsEventType.MEETING_AUDIO_ANSWERED: {
			if (inThisMeetingTab(event.meetingId)) {
				const activeMeeting = state.activeMeeting[event.meetingId];
				activeMeeting.bidirectionalAudioConn?.handleRemoteAnswer({
					sdp: event.sdp,
					type: 'answer'
				});
			}
			break;
		}
		case WsEventType.MEETING_SDP_ANSWERED: {
			if (inThisMeetingTab(event.meetingId)) {
				const mediaType = event.mediaType.toLowerCase() as STREAM_TYPE;
				const activeMeeting = state.activeMeeting[event.meetingId];
				if (mediaType === STREAM_TYPE.VIDEO) {
					activeMeeting.videoOutConn?.handleRemoteAnswer({
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
			if (inThisMeetingTab(event.meetingId)) {
				const activeMeeting = state.activeMeeting[event.meetingId];
				activeMeeting.videoScreenIn?.handleRemoteOffer(event.sdp);
			}
			break;
		}
		case WsEventType.MEETING_PARTICIPANT_SUBSCRIBED: {
			if (inThisMeetingTab(event.meetingId)) {
				const activeMeeting = state.activeMeeting[event.meetingId];
				activeMeeting.videoScreenIn?.handleParticipantsSubscribed(event.streams);
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
			if (inThisMeetingTab(event.meetingId)) {
				sendCustomEvent({ name: EventName.MEETING_PARTICIPANT_CLASHED, data: event });
			}
			break;
		}
		case WsEventType.MEETING_WAITING_PARTICIPANT_JOINED: {
			const meeting = find(state.meetings, (meeting) => meeting.id === event.meetingId);
			const userIsParticipant = find(
				meeting?.participants,
				(participant) => participant.userId === useStore.getState().session.id
			);
			if (userIsParticipant) {
				state.addUserToWaitingList(event.meetingId, event.userId);
				sendCustomEvent({ name: EventName.NEW_WAITING_USER, data: event });
				if (inThisMeetingTab(event.meetingId)) {
					displayWaitingListNotification(event.meetingId);
				}
			}
			break;
		}
		case WsEventType.MEETING_USER_ACCEPTED: {
			state.removeUserFromWaitingList(event.meetingId, event.userId);
			if (inThisMeetingTab(event.meetingId)) {
				sendCustomEvent({ name: EventName.MEETING_USER_ACCEPTED, data: event });
			}
			break;
		}
		case WsEventType.MEETING_USER_REJECTED: {
			state.removeUserFromWaitingList(event.meetingId, event.userId);
			if (inThisMeetingTab(event.meetingId)) {
				sendCustomEvent({ name: EventName.MEETING_USER_REJECTED, data: event });
			}
			break;
		}
		case WsEventType.MEETING_WAITING_PARTICIPANT_CLASHED: {
			if (inThisMeetingTab(event.meetingId)) {
				sendCustomEvent({ name: EventName.MEETING_WAITING_PARTICIPANT_CLASHED, data: event });
			}
			break;
		}
		case WsEventType.MEETING_RECORDING_STARTED: {
			state.startRecording(event.meetingId, event.sentDate, event.userId);
			if (inThisMeetingTab(event.meetingId)) {
				sendCustomEvent({ name: EventName.MEETING_RECORDING_STARTED, data: event });
			}
			break;
		}
		case WsEventType.MEETING_RECORDING_STOPPED: {
			state.stopRecording(event.meetingId);
			if (inThisMeetingTab(event.meetingId)) {
				sendCustomEvent({ name: EventName.MEETING_RECORDING_STOPPED, data: event });
			}
			break;
		}
		default:
			wsDebug('Unhandled event', event);
			break;
	}
}
