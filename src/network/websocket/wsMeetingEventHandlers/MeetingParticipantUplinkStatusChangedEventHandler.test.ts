/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { meetingParticipantUplinkStatusChangedEventHandler } from './MeetingParticipantUplinkStatusChangedEventHandler';
import useStore from '../../../store/Store';
import {
	createMockMeeting,
	createMockParticipants,
	createMockRoom
} from '../../../tests/createMock';
import { WsEventType } from '../../../types/network/websocket/wsEvents';
import { MeetingParticipantUplinkStatusChangedEvent } from '../../../types/network/websocket/wsMeetingEvents';

const room = createMockRoom({ id: 'roomId' });
const participant = createMockParticipants({ userId: 'participantId' });
const meeting = createMockMeeting({
	id: 'meetingId',
	roomId: room.id,
	participants: [participant]
});

const baseEvent: MeetingParticipantUplinkStatusChangedEvent = {
	type: WsEventType.MEETING_PARTICIPANT_UPLINK_STATUS_CHANGED,
	sentDate: '2026-01-01T00:00:00.000Z',
	meetingId: meeting.id,
	userId: participant.userId,
	relativeScore: 10,
	changedAt: 1000
};

beforeEach(() => {
	const store = useStore.getState();
	store.addRooms([room]);
	store.addMeetings([meeting]);
	// Connection status lives on the active meeting, so an active meeting must exist to hold it.
	store.meetingConnection(meeting.id);
});

describe('meetingParticipantUplinkStatusChangedEventHandler tests', () => {
	test('relativeScore and changedAt are stored for the participant', () => {
		meetingParticipantUplinkStatusChangedEventHandler(baseEvent);
		const stored = useStore.getState().activeMeeting?.connectionQuality[participant.userId];
		expect(stored?.relativeScore).toBe(10);
		expect(stored?.changedAt).toBe(1000);
	});

	test('null relativeScore (LOST) is stored correctly', () => {
		meetingParticipantUplinkStatusChangedEventHandler({
			...baseEvent,
			relativeScore: null,
			changedAt: 2000
		});
		const stored = useStore.getState().activeMeeting?.connectionQuality[participant.userId];
		expect(stored?.relativeScore).toBeNull();
	});

	test('numeric relativeScore values in the full 0..10 range are stored', () => {
		[0, 2, 4, 6, 8, 10].forEach((relativeScore, index) => {
			meetingParticipantUplinkStatusChangedEventHandler({
				...baseEvent,
				relativeScore,
				changedAt: baseEvent.changedAt + index + 1
			});
			const stored = useStore.getState().activeMeeting?.connectionQuality[participant.userId];
			expect(stored?.relativeScore).toBe(relativeScore);
		});
	});

	test('maxUplinkTier is stored alongside relativeScore when present', () => {
		meetingParticipantUplinkStatusChangedEventHandler({
			...baseEvent,
			maxUplinkTier: 2,
			changedAt: 2000
		});
		const stored = useStore.getState().activeMeeting?.connectionQuality[participant.userId];
		expect(stored?.maxUplinkTier).toBe(2);
	});

	test('maxUplinkTier=0 is stored (falsy value must not be dropped)', () => {
		meetingParticipantUplinkStatusChangedEventHandler({
			...baseEvent,
			maxUplinkTier: 0,
			changedAt: 3000
		});
		const stored = useStore.getState().activeMeeting?.connectionQuality[participant.userId];
		expect(stored?.maxUplinkTier).toBe(0);
	});

	test('maxHardwareTier is stored when present', () => {
		meetingParticipantUplinkStatusChangedEventHandler({
			...baseEvent,
			maxUplinkTier: 1,
			maxHardwareTier: 2,
			changedAt: 4000
		});
		const stored = useStore.getState().activeMeeting?.connectionQuality[participant.userId];
		expect(stored?.maxUplinkTier).toBe(1);
		expect(stored?.maxHardwareTier).toBe(2);
	});

	test('maxUplinkTier and maxHardwareTier are undefined when the event does not carry them', () => {
		meetingParticipantUplinkStatusChangedEventHandler({ ...baseEvent, changedAt: 5000 });
		const stored = useStore.getState().activeMeeting?.connectionQuality[participant.userId];
		expect(stored?.maxUplinkTier).toBeUndefined();
		expect(stored?.maxHardwareTier).toBeUndefined();
	});

	test('absoluteScore is stored when the event carries it', () => {
		meetingParticipantUplinkStatusChangedEventHandler({
			...baseEvent,
			absoluteScore: 6.3,
			changedAt: 6000
		});
		const stored = useStore.getState().activeMeeting?.connectionQuality[participant.userId];
		expect(stored?.absoluteScore).toBe(6.3);
	});

	test('absoluteScore null (LOST) is stored correctly', () => {
		meetingParticipantUplinkStatusChangedEventHandler({
			...baseEvent,
			relativeScore: null,
			absoluteScore: null,
			changedAt: 7000
		});
		const stored = useStore.getState().activeMeeting?.connectionQuality[participant.userId];
		expect(stored?.absoluteScore).toBeNull();
	});

	test('absoluteScore is undefined when the event does not carry it', () => {
		meetingParticipantUplinkStatusChangedEventHandler({ ...baseEvent, changedAt: 8000 });
		const stored = useStore.getState().activeMeeting?.connectionQuality[participant.userId];
		expect(stored?.absoluteScore).toBeUndefined();
	});

	test('reciprocates our status on first contact with a participant, once (not twice)', () => {
		const monitor = useStore.getState().activeMeeting?.qualityMonitor;
		expect(monitor).toBeDefined();
		const spy = vi.spyOn(monitor!, 'resyncTo').mockResolvedValue(undefined);

		// first time we learn 'otherUser' -> send ours back so they see us too
		meetingParticipantUplinkStatusChangedEventHandler({
			...baseEvent,
			userId: 'otherUser',
			changedAt: 1000
		});
		expect(spy).toHaveBeenCalledWith('otherUser');

		// already known -> no second reciprocation (the exchange has settled)
		spy.mockClear();
		meetingParticipantUplinkStatusChangedEventHandler({
			...baseEvent,
			userId: 'otherUser',
			changedAt: 2000
		});
		expect(spy).not.toHaveBeenCalled();
	});
});
