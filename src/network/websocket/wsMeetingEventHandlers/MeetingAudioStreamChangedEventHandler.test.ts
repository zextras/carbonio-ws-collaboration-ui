/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { meetingAudioStreamChangedEventHandler } from './MeetingAudioStreamChangedEventHandler';
import { getActiveMeeting } from '../../../store/selectors/ActiveMeetingSelectors';
import useStore from '../../../store/Store';
import {
	createMockMeeting,
	createMockParticipants,
	createMockRoom
} from '../../../tests/createMock';
import { mockPlayAudio } from '../../../tests/setupTests';
import { WsEventType } from '../../../types/network/websocket/wsEvents';
import { MeetingAudioStreamChangedEvent } from '../../../types/network/websocket/wsMeetingEvents';
import BidirectionalConnectionAudioInOut from '../../webRTC/BidirectionalConnectionAudioInOut';

const room = createMockRoom();
const meeting = createMockMeeting({ roomId: room.id });

const event: MeetingAudioStreamChangedEvent = {
	type: WsEventType.MEETING_AUDIO_STREAM_CHANGED,
	sentDate: '2022-01-01T00:00:00.000Z',
	meetingId: meeting.id,
	userId: 'userId',
	active: true
};

beforeEach(() => {
	const store = useStore.getState();
	store.setLoginInfo('sessionUserId', 'User');
	store.addRooms([room]);
	store.addMeetings([meeting]);
	store.addParticipant(meeting.id, createMockParticipants({ userId: 'sessionUserId' }));
	store.addParticipant(meeting.id, createMockParticipants({ userId: event.userId }));
});
describe('meetingAudioStreamChangedEventHandler tests', () => {
	test('New audio participant information are changes into store', () => {
		meetingAudioStreamChangedEventHandler(event);
		const meet = useStore.getState().meetings[meeting.id];
		expect(meet.participants[event.userId].audioStreamOn).toBe(event.active);
	});

	test('Audio feedback is not sent when event user is not the session user', () => {
		event.userId = 'userId';
		const store = useStore.getState();
		store.meetingConnection(meeting.id);
		meetingAudioStreamChangedEventHandler(event);
		expect(mockPlayAudio).not.toHaveBeenCalled();
	});

	test('Audio feedback is sent when session user is inside meeting and he changes his audio', () => {
		useStore.getState().meetingConnection(meeting.id);
		event.userId = 'sessionUserId';
		meetingAudioStreamChangedEventHandler(event);
		expect(mockPlayAudio).toHaveBeenCalled();
		event.active = false;
		meetingAudioStreamChangedEventHandler(event);
		expect(mockPlayAudio).toHaveBeenCalled();
	});

	test('Audio feedback is not sent outside active meeting', () => {
		event.userId = 'sessionUserId';
		const store = useStore.getState();
		store.meetingConnection(meeting.id);
		store.meetingDisconnection(meeting.id);
		meetingAudioStreamChangedEventHandler(event);
		expect(mockPlayAudio).not.toHaveBeenCalled();
	});

	test('Mute audio if someone performed a muted action on session user', () => {
		event.userId = 'sessionUserId';
		event.active = false;
		event.moderatorId = 'moderatorId';
		const store = useStore.getState();
		store.meetingConnection(meeting.id);
		const activeMeeting = getActiveMeeting(useStore.getState(), meeting.id);
		const closeRtpSender = vi.spyOn(
			activeMeeting!.bidirectionalAudioConn as BidirectionalConnectionAudioInOut,
			'closeRtpSenderTrack'
		);
		meetingAudioStreamChangedEventHandler(event);
		expect(closeRtpSender).toHaveBeenCalled();
	});
});
