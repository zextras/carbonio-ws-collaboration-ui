/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { size } from 'lodash';

import { createMockMeeting, createMockParticipants, createMockRoom } from '../../tests/createMock';
import { STREAM_TYPE } from '../../types/store/ActiveMeetingTypes';
import useStore from '../Store';

const mockParticipant0 = createMockParticipants({
	userId: 'userId0',
	audioStreamEnabled: true,
	videoStreamEnabled: true
});

const mockParticipant1 = createMockParticipants({
	userId: 'userId1',
	audioStreamEnabled: false,
	videoStreamEnabled: true
});

const room1 = createMockRoom({ id: 'roomId1' });
const temporaryRoom = createMockRoom({ id: 'temporaryRoomId' });

const mockMeeting0 = createMockMeeting({
	id: 'meetingId0',
	roomId: room1.id,
	participants: [mockParticipant0, mockParticipant1],
	createdAt: '2022-08-25T17:24:28.961+02:00',
	active: true,
	startedAt: '2022-09-25T18:25:29.961+02:00'
});
const mockMeeting1 = createMockMeeting({
	id: 'meetingId1',
	roomId: 'roomId1',
	participants: [mockParticipant0],
	createdAt: '2022-08-26T18:25:29.961+02:00',
	active: false
});
const mockMeeting2 = createMockMeeting({
	id: 'meetingId2',
	roomId: 'roomId2',
	participants: [mockParticipant1],
	createdAt: '2022-08-27T19:34:28.961+02:00'
});
const scheduleMeeting = createMockMeeting({ id: 'scheduledMeetingId', roomId: temporaryRoom.id });

beforeEach(() => {
	const store = useStore.getState();
	store.addRooms([temporaryRoom]);
});

describe('MeetingStoreSlice tests', () => {
	describe('Meeting lifecycle', () => {
		test('Add a meeting', () => {
			useStore.getState().addRooms([]);
			useStore.getState().addMeetings([mockMeeting0]);

			// Check store data
			const store = useStore.getState();
			const meeting0 = store.meetings[mockMeeting0.id];
			expect(meeting0).not.toBeNull();
			expect(meeting0.id).toBe(mockMeeting0.id);
			expect(meeting0.roomId).toBe(mockMeeting0.roomId);
			expect(size(meeting0.participants)).toBe(size(mockMeeting0.participants));
			expect(meeting0.createdAt).toBe(mockMeeting0.createdAt);
			expect(meeting0.active).toBeTruthy();
			expect(meeting0.startedAt).toBe(mockMeeting0.startedAt);

			// Check room data
			expect(store.rooms[mockMeeting0.roomId].meetingId).toBe(mockMeeting0.id);
		});

		test('Add multiple meetings', () => {
			useStore.getState().addMeetings([mockMeeting0, mockMeeting1, mockMeeting2]);

			// Check store data
			const store = useStore.getState();
			expect(size(store.meetings)).toBe(3);
			const meeting0 = store.meetings[mockMeeting0.id];
			expect(meeting0).not.toBeNull();
			expect(meeting0.id).toBe(mockMeeting0.id);
			expect(meeting0.roomId).toBe(mockMeeting0.roomId);
			const meeting1 = store.meetings[mockMeeting1.id];
			expect(meeting1.active).toBeFalsy();
			expect(meeting1.startedAt).toBeUndefined();
		});

		test('Remove meeting', () => {
			useStore.getState().addMeetings([mockMeeting0, mockMeeting1]);
			useStore.getState().deleteMeeting(mockMeeting0.id);

			// Check store data
			const store = useStore.getState();
			expect(size(store.meetings)).toBe(1);
			expect(store.meetings[mockMeeting0.id]).toBeFalsy();
		});
	});

	describe('Meeting active status', () => {
		test('Set a meeting as active', () => {
			useStore.getState().addMeetings([mockMeeting0]);
			useStore.getState().startMeeting(mockMeeting0.id, '2023-08-25T18:25:29.961+02:00');

			// Check store data
			const meeting0 = useStore.getState().meetings[mockMeeting0.id];
			expect(meeting0.active).toBeTruthy();
			expect(meeting0.startedAt).toBe('2023-08-25T18:25:29.961+02:00');
		});

		test('Set a meeting as disactive', () => {
			useStore.getState().addMeetings([mockMeeting0]);
			useStore.getState().startMeeting(mockMeeting0.id, '2022-08-25T18:25:29.961+02:00');
			useStore.getState().stopMeeting(mockMeeting0.id);

			// Check store data
			const meeting0 = useStore.getState().meetings[mockMeeting0.id];
			expect(meeting0.active).toBeFalsy();
			expect(meeting0.startedAt).toBeUndefined();
		});
	});

	describe('Meeting participants', () => {
		test('Add a participant', () => {
			useStore.getState().addMeetings([mockMeeting1]);
			useStore.getState().addParticipant(mockMeeting1.id, mockParticipant1);

			// Check store data
			const { participants } = useStore.getState().meetings[mockMeeting1.id];
			expect(size(participants)).toBe(2);
			expect(participants[mockParticipant1.userId]).toBeDefined();
		});

		test('Remove a participant', () => {
			useStore.getState().addMeetings([mockMeeting0]);
			useStore.getState().removeParticipant(mockMeeting0.id, mockParticipant1.userId);

			// Check store data
			const { participants } = useStore.getState().meetings[mockMeeting0.id];
			expect(size(participants)).toBe(1);
			expect(participants[mockParticipant1.userId]).toBeUndefined();
		});

		test('Update participant stream status', () => {
			useStore.getState().addMeetings([mockMeeting0]);
			useStore
				.getState()
				.changeStreamStatus(mockMeeting0.id, mockParticipant1.userId, STREAM_TYPE.AUDIO, true);
			useStore
				.getState()
				.changeStreamStatus(mockMeeting0.id, mockParticipant1.userId, STREAM_TYPE.VIDEO, false);
			useStore
				.getState()
				.changeStreamStatus(mockMeeting0.id, mockParticipant1.userId, STREAM_TYPE.SCREEN, true);

			// Check store data
			const { participants } = useStore.getState().meetings[mockMeeting0.id];
			expect(participants[mockParticipant1.userId].audioStreamOn).toBeTruthy();
			expect(participants[mockParticipant1.userId].videoStreamOn).toBeFalsy();
			expect(participants[mockParticipant1.userId].screenStreamOn).toBeTruthy();
		});
	});

	describe('Waiting List', () => {
		test('Set a waiting list from scratch', () => {
			useStore.getState().addMeetings([scheduleMeeting]);
			useStore.getState().setWaitingList(scheduleMeeting.id, ['userId0', 'userId1']);

			// Check store data
			const { waitingList } = useStore.getState().meetings[scheduleMeeting.id];
			expect(waitingList).not.toBeNull();
			expect(size(waitingList)).toBe(2);
			expect(waitingList).toContain('userId0');
			expect(waitingList).toContain('userId1');
		});

		test('Replace existing waiting list', () => {
			useStore.getState().addMeetings([scheduleMeeting]);
			useStore.getState().setWaitingList(scheduleMeeting.id, ['userId0', 'userId1']);
			useStore.getState().setWaitingList(scheduleMeeting.id, ['userId2', 'userId3']);

			// Check store data
			const { waitingList } = useStore.getState().meetings[scheduleMeeting.id];
			expect(waitingList).not.toBeNull();
			expect(size(waitingList)).toBe(2);
			expect(waitingList).not.toContain('userId0');
			expect(waitingList).not.toContain('userId1');
			expect(waitingList).toContain('userId2');
			expect(waitingList).toContain('userId3');
		});

		test('Add a user to an empty waiting list in which the user is not present', () => {
			useStore.getState().addMeetings([scheduleMeeting]);
			useStore.getState().addUserToWaitingList(scheduleMeeting.id, 'userId0');

			// Check store data
			const { waitingList } = useStore.getState().meetings[scheduleMeeting.id];
			expect(waitingList).not.toBeNull();
			expect(size(waitingList)).toBe(1);
			expect(waitingList).toContain('userId0');
		});

		test('Add a user to a waiting list in which the user is already present', () => {
			useStore.getState().addMeetings([scheduleMeeting]);
			useStore.getState().setWaitingList(scheduleMeeting.id, ['userId0', 'userId1']);
			useStore.getState().addUserToWaitingList(scheduleMeeting.id, 'userId0');

			const { waitingList } = useStore.getState().meetings[scheduleMeeting.id];
			expect(waitingList).not.toBeNull();
			expect(size(waitingList)).toBe(2);
			expect(waitingList).toContain('userId0');
			expect(waitingList).toContain('userId1');
		});

		test('Remove a user from a waiting list in which the user is present', () => {
			useStore.getState().addMeetings([scheduleMeeting]);
			useStore.getState().setWaitingList(scheduleMeeting.id, ['userId0', 'userId1']);
			useStore.getState().removeUserFromWaitingList(scheduleMeeting.id, 'userId0');

			const { waitingList } = useStore.getState().meetings[scheduleMeeting.id];
			expect(waitingList).not.toBeNull();
			expect(size(waitingList)).toBe(1);
			expect(waitingList).toContain('userId1');
			expect(waitingList).not.toContain('userId0');
		});

		test('Remove a user from a waiting list in which the user is not present', () => {
			useStore.getState().addMeetings([scheduleMeeting]);
			useStore.getState().setWaitingList(scheduleMeeting.id, ['userId0', 'userId1']);
			useStore.getState().removeUserFromWaitingList(scheduleMeeting.id, 'userId2');

			const { waitingList } = useStore.getState().meetings[scheduleMeeting.id];
			expect(waitingList).not.toBeNull();
			expect(size(waitingList)).toBe(2);
			expect(waitingList).toContain('userId0');
			expect(waitingList).toContain('userId1');
			expect(waitingList).not.toContain('userId2');
		});
	});

	describe('Recording', () => {
		test('Start a new recording', () => {
			useStore.getState().addMeetings([scheduleMeeting]);
			useStore
				.getState()
				.startRecording(scheduleMeeting.id, '2022-08-25T18:24:28.961+02:00', 'userId0');

			const { recStartedAt, recUserId } = useStore.getState().meetings[scheduleMeeting.id];
			expect(recStartedAt).toBe('2022-08-25T18:24:28.961+02:00');
			expect(recUserId).toBe('userId0');
		});

		test('Stop an ongoing recording', () => {
			useStore.getState().addMeetings([scheduleMeeting]);
			useStore.getState().stopRecording(scheduleMeeting.id);

			const { recStartedAt, recUserId } = useStore.getState().meetings[scheduleMeeting.id];
			expect(recStartedAt).toBeUndefined();
			expect(recUserId).toBeUndefined();
		});
	});
});
