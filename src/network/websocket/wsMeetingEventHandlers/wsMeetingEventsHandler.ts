/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { meetingAudioAnsweredEventHandler } from './MeetingAudioAnsweredEventHandler';
import { meetingAudioStreamChangedEventHandler } from './MeetingAudioStreamChangedEventHandler';
import { meetingJoinedEventHandler } from './MeetingJoinedEventHandler';
import { meetingLeftEventHandler } from './MeetingLeftEventHandler';
import { meetingMediaStreamChangedEventHandler } from './MeetingMediaStreamChangedEventHandler';
import { meetingParticipantClashedEventHandler } from './MeetingParticipantClashedEventHandler';
import { meetingParticipantSubscribedEventHandler } from './MeetingParticipantSubscribedEventHandler';
import { meetingParticipantTalkingEventHandler } from './MeetingParticipantTalkingHandler';
import { meetingRecordingStoppedEventHandler } from './MeetingRecordingStartedEventHandler';
import { meetingRecordingStartedEventHandler } from './MeetingRecordingStoppedEventHandler';
import { meetingSDPAnsweredEventHandler } from './MeetingSDPAnsweredEventHandler';
import { meetingSDPOfferedEventHandler } from './MeetingSDPOfferedEventHandler';
import { meetingStartedEventHandler } from './MeetingStartedEventHandler';
import { meetingStoppedEventHandler } from './MeetingStoppedEventHandler';
import { meetingUserAcceptedEventHandler } from './MeetingUserAcceptedEventHandler';
import { meetingUserRejectedEventHandler } from './MeetingUserRejectedEventHandler';
import { meetingWaitingParticipantClashedEventHandler } from './MeetingWaitingParticipantClashedEventHandler';
import { meetingWaitingParticipantJoinedEventHandler } from './MeetingWaitingParticipantJoinedEventHandler';
import useStore from '../../../store/Store';
import { MeetingType } from '../../../types/network/models/meetingBeTypes';
import { WsEvent, WsEventType } from '../../../types/network/websocket/wsEvents';

// TODO
export const wsMeetingEventsHandler = (event: WsEvent): void => {
	const state = useStore.getState();

	switch (event.type) {
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
			meetingStartedEventHandler(event);
			break;
		}
		case WsEventType.MEETING_JOINED: {
			meetingJoinedEventHandler(event);
			break;
		}
		case WsEventType.MEETING_LEFT: {
			meetingLeftEventHandler(event);
			break;
		}
		case WsEventType.MEETING_STOPPED: {
			meetingStoppedEventHandler(event);
			break;
		}
		case WsEventType.MEETING_DELETED: {
			state.deleteMeeting(event.meetingId);
			break;
		}
		case WsEventType.MEETING_AUDIO_STREAM_CHANGED: {
			meetingAudioStreamChangedEventHandler(event);
			break;
		}
		case WsEventType.MEETING_MEDIA_STREAM_CHANGED: {
			meetingMediaStreamChangedEventHandler(event);
			break;
		}
		case WsEventType.MEETING_AUDIO_ANSWERED: {
			meetingAudioAnsweredEventHandler(event);
			break;
		}
		case WsEventType.MEETING_SDP_ANSWERED: {
			meetingSDPAnsweredEventHandler(event);
			break;
		}
		case WsEventType.MEETING_SDP_OFFERED: {
			meetingSDPOfferedEventHandler(event);
			break;
		}
		case WsEventType.MEETING_PARTICIPANT_SUBSCRIBED: {
			meetingParticipantSubscribedEventHandler(event);
			break;
		}
		case WsEventType.MEETING_PARTICIPANT_TALKING: {
			meetingParticipantTalkingEventHandler(event);
			break;
		}
		case WsEventType.MEETING_PARTICIPANT_CLASHED: {
			meetingParticipantClashedEventHandler(event);
			break;
		}
		case WsEventType.MEETING_WAITING_PARTICIPANT_JOINED: {
			meetingWaitingParticipantJoinedEventHandler(event);
			break;
		}
		case WsEventType.MEETING_USER_ACCEPTED: {
			meetingUserAcceptedEventHandler(event);
			break;
		}
		case WsEventType.MEETING_USER_REJECTED: {
			meetingUserRejectedEventHandler(event);
			break;
		}
		case WsEventType.MEETING_WAITING_PARTICIPANT_CLASHED: {
			meetingWaitingParticipantClashedEventHandler(event);
			break;
		}
		case WsEventType.MEETING_RECORDING_STARTED: {
			meetingRecordingStartedEventHandler(event);
			break;
		}
		case WsEventType.MEETING_RECORDING_STOPPED: {
			meetingRecordingStoppedEventHandler(event);
			break;
		}
		default: {
			console.error(`Unhandled meeting event type: ${event.type}`);
		}
	}
};
