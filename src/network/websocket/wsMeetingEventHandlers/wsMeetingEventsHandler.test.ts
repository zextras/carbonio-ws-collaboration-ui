/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import * as MeetingAudioAnsweredEventHandler from './MeetingAudioAnsweredEventHandler';
import * as MeetingAudioStreamChangedEventHandler from './MeetingAudioStreamChangedEventHandler';
import * as MeetingJoinedEventHandler from './MeetingJoinedEventHandler';
import * as MeetingLeftEventHandler from './MeetingLeftEventHandler';
import * as MeetingMediaStreamChangedEventHandler from './MeetingMediaStreamChangedEventHandler';
import * as MeetingParticipantClashedEventHandler from './MeetingParticipantClashedEventHandler';
import * as MeetingParticipantSubscribedEventHandler from './MeetingParticipantSubscribedEventHandler';
import * as MeetingParticipantTalkingHandler from './MeetingParticipantTalkingHandler';
import * as MeetingRecordingStartedEventHandler from './MeetingRecordingStartedEventHandler';
import * as MeetingRecordingStoppedEventHandler from './MeetingRecordingStoppedEventHandler';
import * as MeetingSDPAnsweredEventHandler from './MeetingSDPAnsweredEventHandler';
import * as MeetingSDPOfferedEventHandler from './MeetingSDPOfferedEventHandler';
import * as MeetingStartedEventHandler from './MeetingStartedEventHandler';
import * as MeetingStoppedEventHandler from './MeetingStoppedEventHandler';
import * as MeetingUserAcceptedEventHandler from './MeetingUserAcceptedEventHandler';
import * as MeetingUserRejectedEventHandler from './MeetingUserRejectedEventHandler';
import * as MeetingWaitingParticipantClashedEventHandler from './MeetingWaitingParticipantClashedEventHandler';
import * as MeetingWaitingParticipantJoinedEventHandler from './MeetingWaitingParticipantJoinedEventHandler';
import { wsMeetingEventsHandler } from './wsMeetingEventsHandler';
import useStore from '../../../store/Store';
import { createMockMeeting, createMockRoom } from '../../../tests/createMock';
import { WsEvent, WsEventType } from '../../../types/network/websocket/wsEvents';
import {
	MeetingCreatedEvent,
	MeetingDeletedEvent
} from '../../../types/network/websocket/wsMeetingEvents';
import { STREAM_TYPE } from '../../../types/store/ActiveMeetingTypes';

describe('wsMeetingEventsHandler', () => {
	test('MEETING_CREATED event is handled', () => {
		useStore.getState().addRoom(createMockRoom({ id: 'roomId' }));
		const event: MeetingCreatedEvent = {
			type: WsEventType.MEETING_CREATED,
			meetingId: '123',
			roomId: 'roomId',
			sentDate: '2024-05-30T12:34:56Z'
		};
		wsMeetingEventsHandler(event);
		expect(useStore.getState().meetings[event.roomId]).toBeDefined();
	});

	test('MEETING_STARTED event is handled', () => {
		const event = { type: WsEventType.MEETING_STARTED };
		const handler = jest.spyOn(MeetingStartedEventHandler, 'meetingStartedEventHandler');
		wsMeetingEventsHandler(event as WsEvent);
		expect(handler).toHaveBeenCalledWith(event);
	});

	test('MEETING_JOINED event is handled', () => {
		const event = { type: WsEventType.MEETING_JOINED };
		const handler = jest.spyOn(MeetingJoinedEventHandler, 'meetingJoinedEventHandler');
		wsMeetingEventsHandler(event as WsEvent);
		expect(handler).toHaveBeenCalledWith(event);
	});

	test('MEETING_LEFT event is handled', () => {
		const event = { type: WsEventType.MEETING_LEFT };
		const handler = jest.spyOn(MeetingLeftEventHandler, 'meetingLeftEventHandler');
		wsMeetingEventsHandler(event as WsEvent);
		expect(handler).toHaveBeenCalledWith(event);
	});

	test('MEETING_STOPPED event is handled', () => {
		const event = { type: WsEventType.MEETING_STOPPED };
		const handler = jest.spyOn(MeetingStoppedEventHandler, 'meetingStoppedEventHandler');
		wsMeetingEventsHandler(event as WsEvent);
		expect(handler).toHaveBeenCalledWith(event);
	});

	test('MEETING_DELETED event is handled', () => {
		const store = useStore.getState();
		store.addRoom(createMockRoom({ id: 'roomId' }));
		store.addMeeting(createMockMeeting({ id: 'meetingId', roomId: 'roomId' }));
		const event: MeetingDeletedEvent = {
			type: WsEventType.MEETING_DELETED,
			meetingId: 'meetingId',
			sentDate: '2024-05-30T12:34:56Z'
		};
		wsMeetingEventsHandler(event);
		expect(useStore.getState().meetings.roomId).not.toBeDefined();
	});

	test('MEETING_AUDIO_STREAM_CHANGED event is handled', () => {
		const event = { type: WsEventType.MEETING_AUDIO_STREAM_CHANGED };
		const handler = jest.spyOn(
			MeetingAudioStreamChangedEventHandler,
			'meetingAudioStreamChangedEventHandler'
		);
		wsMeetingEventsHandler(event as WsEvent);
		expect(handler).toHaveBeenCalledWith(event);
	});

	test('MEETING_MEDIA_STREAM_CHANGED event is handled', () => {
		const event = { type: WsEventType.MEETING_MEDIA_STREAM_CHANGED, mediaType: STREAM_TYPE.SCREEN };
		const handler = jest.spyOn(
			MeetingMediaStreamChangedEventHandler,
			'meetingMediaStreamChangedEventHandler'
		);
		wsMeetingEventsHandler(event as WsEvent);
		expect(handler).toHaveBeenCalledWith(event);
	});

	test('MEETING_AUDIO_ANSWERED event is handled', () => {
		const event = { type: WsEventType.MEETING_AUDIO_ANSWERED };
		const handler = jest.spyOn(
			MeetingAudioAnsweredEventHandler,
			'meetingAudioAnsweredEventHandler'
		);
		wsMeetingEventsHandler(event as WsEvent);
		expect(handler).toHaveBeenCalledWith(event);
	});

	test('MEETING_SDP_ANSWERED event is handled', () => {
		const event = { type: WsEventType.MEETING_SDP_ANSWERED };
		const handler = jest.spyOn(MeetingSDPAnsweredEventHandler, 'meetingSDPAnsweredEventHandler');
		wsMeetingEventsHandler(event as WsEvent);
		expect(handler).toHaveBeenCalledWith(event);
	});

	test('MEETING_SDP_OFFERED event is handled', () => {
		const event = { type: WsEventType.MEETING_SDP_OFFERED };
		const handler = jest.spyOn(MeetingSDPOfferedEventHandler, 'meetingSDPOfferedEventHandler');
		wsMeetingEventsHandler(event as WsEvent);
		expect(handler).toHaveBeenCalledWith(event);
	});

	test('MEETING_PARTICIPANT_SUBSCRIBED event is handled', () => {
		const event = { type: WsEventType.MEETING_PARTICIPANT_SUBSCRIBED };
		const handler = jest.spyOn(
			MeetingParticipantSubscribedEventHandler,
			'meetingParticipantSubscribedEventHandler'
		);
		wsMeetingEventsHandler(event as WsEvent);
		expect(handler).toHaveBeenCalledWith(event);
	});

	test('MEETING_PARTICIPANT_TALKING event is handled', () => {
		const event = { type: WsEventType.MEETING_PARTICIPANT_TALKING };
		const handler = jest.spyOn(
			MeetingParticipantTalkingHandler,
			'meetingParticipantTalkingEventHandler'
		);
		wsMeetingEventsHandler(event as WsEvent);
		expect(handler).toHaveBeenCalledWith(event);
	});

	test('MEETING_PARTICIPANT_CLASHED event is handled', () => {
		const event = { type: WsEventType.MEETING_PARTICIPANT_CLASHED };
		const handler = jest.spyOn(
			MeetingParticipantClashedEventHandler,
			'meetingParticipantClashedEventHandler'
		);
		wsMeetingEventsHandler(event as WsEvent);
		expect(handler).toHaveBeenCalledWith(event);
	});

	test('MEETING_WAITING_PARTICIPANT_JOINED event is handled', () => {
		const event = { type: WsEventType.MEETING_WAITING_PARTICIPANT_JOINED };
		const handler = jest.spyOn(
			MeetingWaitingParticipantJoinedEventHandler,
			'meetingWaitingParticipantJoinedEventHandler'
		);
		wsMeetingEventsHandler(event as WsEvent);
		expect(handler).toHaveBeenCalledWith(event);
	});

	test('MEETING_USER_ACCEPTED event is handled', () => {
		const event = { type: WsEventType.MEETING_USER_ACCEPTED };
		const handler = jest.spyOn(MeetingUserAcceptedEventHandler, 'meetingUserAcceptedEventHandler');
		wsMeetingEventsHandler(event as WsEvent);
		expect(handler).toHaveBeenCalledWith(event);
	});

	test('MEETING_USER_REJECTED event is handled', () => {
		const event = { type: WsEventType.MEETING_USER_REJECTED };
		const handler = jest.spyOn(MeetingUserRejectedEventHandler, 'meetingUserRejectedEventHandler');
		wsMeetingEventsHandler(event as WsEvent);
		expect(handler).toHaveBeenCalledWith(event);
	});

	test('MEETING_WAITING_PARTICIPANT_CLASHED event is handled', () => {
		const event = { type: WsEventType.MEETING_WAITING_PARTICIPANT_CLASHED };
		const handler = jest.spyOn(
			MeetingWaitingParticipantClashedEventHandler,
			'meetingWaitingParticipantClashedEventHandler'
		);
		wsMeetingEventsHandler(event as WsEvent);
		expect(handler).toHaveBeenCalledWith(event);
	});

	test('MEETING_RECORDING_STARTED event is handled', () => {
		const event = { type: WsEventType.MEETING_RECORDING_STARTED };
		const handler = jest.spyOn(
			MeetingRecordingStartedEventHandler,
			'meetingRecordingStartedEventHandler'
		);
		wsMeetingEventsHandler(event as WsEvent);
		expect(handler).toHaveBeenCalledWith(event);
	});

	test('MEETING_RECORDING_STOPPED event is handled', () => {
		const event = { type: WsEventType.MEETING_RECORDING_STOPPED };
		const handler = jest.spyOn(
			MeetingRecordingStoppedEventHandler,
			'meetingRecordingStoppedEventHandler'
		);
		wsMeetingEventsHandler(event as WsEvent);
		expect(handler).toHaveBeenCalledWith(event);
	});

	test('Log an error for unhandled event types', () => {
		console.error = jest.fn();
		const event = { type: 'UNHANDLED_EVENT_TYPE' };
		wsMeetingEventsHandler(event as WsEvent);
		expect(console.error).toHaveBeenCalledWith(`Unhandled meeting event type: ${event.type}`);
	});
});
