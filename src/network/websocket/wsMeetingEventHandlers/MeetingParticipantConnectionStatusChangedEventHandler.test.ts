/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { meetingParticipantConnectionStatusChangedEventHandler } from './MeetingParticipantConnectionStatusChangedEventHandler';
import useStore from '../../../store/Store';
import {
	createMockMeeting,
	createMockParticipants,
	createMockRoom
} from '../../../tests/createMock';
import { WsEventType } from '../../../types/network/websocket/wsEvents';
import { MeetingParticipantConnectionStatusChangedEvent } from '../../../types/network/websocket/wsMeetingEvents';

const room = createMockRoom({ id: 'roomId' });
const participant = createMockParticipants({ userId: 'participantId' });
const meeting = createMockMeeting({
	id: 'meetingId',
	roomId: room.id,
	participants: [participant]
});

const baseEvent: MeetingParticipantConnectionStatusChangedEvent = {
	type: WsEventType.MEETING_PARTICIPANT_CONNECTION_STATUS_CHANGED,
	sentDate: '2026-01-01T00:00:00.000Z',
	meetingId: meeting.id,
	userId: participant.userId,
	score: 'optimal',
	changedAt: 1000
};

beforeEach(() => {
	const store = useStore.getState();
	store.addRooms([room]);
	store.addMeetings([meeting]);
	// Connection status lives on the active meeting, so an active meeting must exist to hold it.
	store.meetingConnection(meeting.id);
});

describe('meetingParticipantConnectionStatusChangedEventHandler tests', () => {
	test('Score and changedAt are stored for the participant', () => {
		meetingParticipantConnectionStatusChangedEventHandler(baseEvent);
		const stored = useStore.getState().activeMeeting?.connectionQuality[participant.userId];
		expect(stored?.quality).toBe('optimal');
		expect(stored?.changedAt).toBe(1000);
	});

	test('All 6 score levels are accepted', () => {
		const levels = ['lost', 'terrible', 'poor', 'medium', 'high', 'optimal'] as const;
		levels.forEach((score, index) => {
			meetingParticipantConnectionStatusChangedEventHandler({
				...baseEvent,
				score,
				changedAt: baseEvent.changedAt + index + 1
			});
			const stored = useStore.getState().activeMeeting?.connectionQuality[participant.userId];
			expect(stored?.quality).toBe(score);
		});
	});

	test('A newer changedAt overwrites an existing score', () => {
		meetingParticipantConnectionStatusChangedEventHandler({
			...baseEvent,
			score: 'medium',
			changedAt: 1000
		});
		meetingParticipantConnectionStatusChangedEventHandler({
			...baseEvent,
			score: 'high',
			changedAt: 2000
		});
		const stored = useStore.getState().activeMeeting?.connectionQuality[participant.userId];
		expect(stored?.quality).toBe('high');
		expect(stored?.changedAt).toBe(2000);
	});

	test('An older changedAt does not overwrite a newer score', () => {
		meetingParticipantConnectionStatusChangedEventHandler({
			...baseEvent,
			score: 'high',
			changedAt: 2000
		});
		meetingParticipantConnectionStatusChangedEventHandler({
			...baseEvent,
			score: 'terrible',
			changedAt: 500
		});
		const stored = useStore.getState().activeMeeting?.connectionQuality[participant.userId];
		expect(stored?.quality).toBe('high');
		expect(stored?.changedAt).toBe(2000);
	});

	test('maxTier is stored when present', () => {
		meetingParticipantConnectionStatusChangedEventHandler({
			...baseEvent,
			maxTier: 2
		});
		const stored = useStore.getState().activeMeeting?.connectionQuality[participant.userId];
		expect(stored?.maxTier).toBe(2);
	});

	test('maxTier is undefined when absent from event', () => {
		meetingParticipantConnectionStatusChangedEventHandler(baseEvent);
		const stored = useStore.getState().activeMeeting?.connectionQuality[participant.userId];
		expect(stored?.maxTier).toBeUndefined();
	});

	test('maxTier accepts all valid substream indices (0, 1, 2)', () => {
		([0, 1, 2] as const).forEach((maxTier, i) => {
			meetingParticipantConnectionStatusChangedEventHandler({
				...baseEvent,
				changedAt: baseEvent.changedAt + i + 1,
				maxTier
			});
			const stored = useStore.getState().activeMeeting?.connectionQuality[participant.userId];
			expect(stored?.maxTier).toBe(maxTier);
		});
	});

	test('reciprocates our status on first contact with a participant, once (not twice)', () => {
		const monitor = useStore.getState().activeMeeting?.qualityMonitor;
		expect(monitor).toBeDefined();
		const spy = vi.spyOn(monitor!, 'resyncTo').mockResolvedValue(undefined);

		// first time we learn 'otherUser' -> send ours back so they see us too
		meetingParticipantConnectionStatusChangedEventHandler({
			...baseEvent,
			userId: 'otherUser',
			changedAt: 1000
		});
		expect(spy).toHaveBeenCalledWith('otherUser');

		// already known -> no second reciprocation (the exchange has settled)
		spy.mockClear();
		meetingParticipantConnectionStatusChangedEventHandler({
			...baseEvent,
			userId: 'otherUser',
			changedAt: 2000
		});
		expect(spy).not.toHaveBeenCalled();
	});
});
