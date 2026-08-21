/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { meetingParticipantConnectionQualityChangedEventHandler } from './MeetingParticipantConnectionQualityChangedEventHandler';
import useStore from '../../../store/Store';
import {
	createMockMeeting,
	createMockParticipants,
	createMockRoom
} from '../../../tests/createMock';
import { WsEventType } from '../../../types/network/websocket/wsEvents';
import { MeetingParticipantConnectionQualityChangedEvent } from '../../../types/network/websocket/wsMeetingEvents';

const room = createMockRoom({ id: 'roomId' });
const participant = createMockParticipants({ userId: 'participantId' });
const meeting = createMockMeeting({
	id: 'meetingId',
	roomId: room.id,
	participants: [participant]
});

const baseEvent: MeetingParticipantConnectionQualityChangedEvent = {
	type: WsEventType.MEETING_PARTICIPANT_CONNECTION_QUALITY_CHANGED,
	sentDate: '2026-01-01T00:00:00.000Z',
	meetingId: meeting.id,
	userId: participant.userId,
	quality: 'optimal',
	changedAt: 1000
};

beforeEach(() => {
	const store = useStore.getState();
	store.addRooms([room]);
	store.addMeetings([meeting]);
	// Connection quality lives on the active meeting, so an active meeting must exist to hold it.
	store.meetingConnection(meeting.id);
});

describe('meetingParticipantConnectionQualityChangedEventHandler tests', () => {
	test('Quality and changedAt are stored for the participant', () => {
		meetingParticipantConnectionQualityChangedEventHandler(baseEvent);
		const stored = useStore.getState().activeMeeting?.connectionQuality[participant.userId];
		expect(stored?.quality).toBe('optimal');
		expect(stored?.changedAt).toBe(1000);
	});

	test('All 6 quality levels are accepted', () => {
		const levels = ['lost', 'terrible', 'poor', 'medium', 'high', 'optimal'] as const;
		levels.forEach((quality, index) => {
			meetingParticipantConnectionQualityChangedEventHandler({
				...baseEvent,
				quality,
				changedAt: baseEvent.changedAt + index + 1
			});
			const stored = useStore.getState().activeMeeting?.connectionQuality[participant.userId];
			expect(stored?.quality).toBe(quality);
		});
	});

	test('A newer changedAt overwrites an existing quality', () => {
		meetingParticipantConnectionQualityChangedEventHandler({
			...baseEvent,
			quality: 'medium',
			changedAt: 1000
		});
		meetingParticipantConnectionQualityChangedEventHandler({
			...baseEvent,
			quality: 'high',
			changedAt: 2000
		});
		const stored = useStore.getState().activeMeeting?.connectionQuality[participant.userId];
		expect(stored?.quality).toBe('high');
		expect(stored?.changedAt).toBe(2000);
	});

	test('An older changedAt does not overwrite a newer quality', () => {
		meetingParticipantConnectionQualityChangedEventHandler({
			...baseEvent,
			quality: 'high',
			changedAt: 2000
		});
		meetingParticipantConnectionQualityChangedEventHandler({
			...baseEvent,
			quality: 'terrible',
			changedAt: 500
		});
		const stored = useStore.getState().activeMeeting?.connectionQuality[participant.userId];
		expect(stored?.quality).toBe('high');
		expect(stored?.changedAt).toBe(2000);
	});

	test('reciprocates our quality on first contact with a participant, once (not twice)', () => {
		const monitor = useStore.getState().activeMeeting?.qualityMonitor;
		expect(monitor).toBeDefined();
		const spy = vi.spyOn(monitor!, 'resyncTo').mockResolvedValue(undefined);

		// first time we learn 'otherUser' -> send ours back so they see us too
		meetingParticipantConnectionQualityChangedEventHandler({
			...baseEvent,
			userId: 'otherUser',
			changedAt: 1000
		});
		expect(spy).toHaveBeenCalledWith('otherUser');

		// already known -> no second reciprocation (the exchange has settled)
		spy.mockClear();
		meetingParticipantConnectionQualityChangedEventHandler({
			...baseEvent,
			userId: 'otherUser',
			changedAt: 2000
		});
		expect(spy).not.toHaveBeenCalled();
	});
});
