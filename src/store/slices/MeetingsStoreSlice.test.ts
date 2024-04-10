/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { act, renderHook } from '@testing-library/react-hooks';
import { size } from 'lodash';

import { createMockMeeting, createMockParticipants, createMockRoom } from '../../tests/createMock';
import useStore from '../Store';

const mockParticipant0 = createMockParticipants({
	userId: 'userId0',
	audioStreamOn: true,
	videoStreamOn: true
});

const mockParticipant1 = createMockParticipants({
	userId: 'userId1',
	audioStreamOn: false,
	videoStreamOn: true
});

const mockMeeting0 = createMockMeeting({
	id: 'meetingId0',
	roomId: 'roomId0',
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

const temporaryRoom = createMockRoom();
const scheduleMeeting = createMockMeeting({ roomId: temporaryRoom.id });

describe('Test components slice', () => {
	test('setMeetings setter', () => {
		const { result } = renderHook(() => useStore());
		act(() => result.current.setMeetings([mockMeeting0, mockMeeting1, mockMeeting2]));

		// Check store data
		expect(size(result.current.meetings)).toBe(3);
		const meeting0 = result.current.meetings[mockMeeting0.roomId];
		expect(meeting0).not.toBeNull();
		expect(meeting0.id).toBe(mockMeeting0.id);
		expect(meeting0.roomId).toBe(mockMeeting0.roomId);
		expect(size(meeting0.participants)).toBe(size(mockMeeting0.participants));
		expect(meeting0.createdAt).toBe(mockMeeting0.createdAt);
		expect(meeting0.active).toBeTruthy();
		expect(meeting0.startedAt).toBe(mockMeeting0.startedAt);

		const meeting1 = result.current.meetings[mockMeeting1.roomId];
		expect(meeting1.active).toBeFalsy();
		expect(meeting1.startedAt).toBeUndefined();
	});

	test('addMeeting setter', () => {
		const { result } = renderHook(() => useStore());
		act(() => result.current.addMeeting(mockMeeting0));

		// Check store data
		const meeting0 = result.current.meetings[mockMeeting0.roomId];
		expect(meeting0).not.toBeNull();
		expect(meeting0.id).toBe(mockMeeting0.id);
		expect(meeting0.roomId).toBe(mockMeeting0.roomId);
		expect(size(meeting0.participants)).toBe(size(mockMeeting0.participants));
		expect(meeting0.createdAt).toBe(mockMeeting0.createdAt);
		expect(meeting0.active).toBeTruthy();
		expect(meeting0.startedAt).toBe(mockMeeting0.startedAt);
	});

	test('Combination of set components, add components, and remove components setters', () => {
		const { result } = renderHook(() => useStore());

		act(() => result.current.setMeetings([mockMeeting0, mockMeeting1]));
		expect(size(result.current.meetings)).toBe(2);

		act(() => result.current.addMeeting(mockMeeting2));
		expect(size(result.current.meetings)).toBe(3);

		act(() => result.current.deleteMeeting(mockMeeting1.id));
		expect(size(result.current.meetings)).toBe(2);
	});

	test('Start a meeting', () => {
		const { result } = renderHook(() => useStore());
		act(() => {
			result.current.addMeeting(mockMeeting1);
			result.current.startMeeting(mockMeeting1.id, '2022-08-25T18:25:29.961+02:00');
		});

		// Check store data
		const meeting1 = result.current.meetings[mockMeeting1.roomId];
		expect(meeting1.active).toBeTruthy();
		expect(meeting1.startedAt).toBe('2022-08-25T18:25:29.961+02:00');
	});

	test('Stop a meeting', () => {
		const { result } = renderHook(() => useStore());
		act(() => {
			result.current.addMeeting(mockMeeting0);
			result.current.stopMeeting(mockMeeting0.id);
		});

		// Check store data
		const meeting0 = result.current.meetings[mockMeeting0.roomId];
		expect(meeting0.active).toBeFalsy();
		expect(meeting0.startedAt).toBeUndefined();
	});

	describe('Waiting List', () => {
		test('Set a waiting list from scratch', () => {
			const { result } = renderHook(() => useStore());
			act(() => {
				result.current.addRoom(temporaryRoom);
				result.current.addMeeting(scheduleMeeting);
				result.current.setWaitingList(scheduleMeeting.id, ['userId0', 'userId1']);
			});

			// Check store data
			const { waitingList } = result.current.meetings[temporaryRoom.id];
			expect(waitingList).not.toBeNull();
			expect(size(waitingList)).toBe(2);
			expect(waitingList).toContain('userId0');
			expect(waitingList).toContain('userId1');
		});

		test('Replace existing waiting list', () => {
			const { result } = renderHook(() => useStore());
			act(() => {
				result.current.addRoom(temporaryRoom);
				result.current.addMeeting(scheduleMeeting);
				result.current.setWaitingList(scheduleMeeting.id, ['userId0', 'userId1']);
				result.current.setWaitingList(scheduleMeeting.id, ['userId2', 'userId3']);
			});

			// Check store data
			const { waitingList } = result.current.meetings[temporaryRoom.id];
			expect(waitingList).not.toBeNull();
			expect(size(waitingList)).toBe(2);
			expect(waitingList).not.toContain('userId0');
			expect(waitingList).not.toContain('userId1');
			expect(waitingList).toContain('userId2');
			expect(waitingList).toContain('userId3');
		});

		test('Add a user to an empty waiting list in which the user is not present', () => {
			const { result } = renderHook(() => useStore());
			act(() => {
				result.current.addRoom(temporaryRoom);
				result.current.addMeeting(scheduleMeeting);
				result.current.addUserToWaitingList(scheduleMeeting.id, 'userId0');
			});

			// Check store data
			const { waitingList } = result.current.meetings[temporaryRoom.id];
			expect(waitingList).not.toBeNull();
			expect(size(waitingList)).toBe(1);
			expect(waitingList).toContain('userId0');
		});

		test('Add a user to a waiting list in which the user is already present', () => {
			const { result } = renderHook(() => useStore());
			act(() => {
				result.current.addRoom(temporaryRoom);
				result.current.addMeeting(scheduleMeeting);
				result.current.setWaitingList(scheduleMeeting.id, ['userId0', 'userId1']);
				result.current.addUserToWaitingList(scheduleMeeting.id, 'userId0');
			});

			const { waitingList } = result.current.meetings[temporaryRoom.id];
			expect(waitingList).not.toBeNull();
			expect(size(waitingList)).toBe(2);
			expect(waitingList).toContain('userId0');
			expect(waitingList).toContain('userId1');
		});

		test('Remove a user from a waiting list in which the user is present', () => {
			const { result } = renderHook(() => useStore());
			act(() => {
				result.current.addRoom(temporaryRoom);
				result.current.addMeeting(scheduleMeeting);
				result.current.setWaitingList(scheduleMeeting.id, ['userId0', 'userId1']);
				result.current.removeUserFromWaitingList(scheduleMeeting.id, 'userId0');
			});

			const { waitingList } = result.current.meetings[temporaryRoom.id];
			expect(waitingList).not.toBeNull();
			expect(size(waitingList)).toBe(1);
			expect(waitingList).toContain('userId1');
			expect(waitingList).not.toContain('userId0');
		});

		test('Remove a user from a waiting list in which the user is not present', () => {
			const { result } = renderHook(() => useStore());
			act(() => {
				result.current.addRoom(temporaryRoom);
				result.current.addMeeting(scheduleMeeting);
				result.current.setWaitingList(scheduleMeeting.id, ['userId0', 'userId1']);
				result.current.removeUserFromWaitingList(scheduleMeeting.id, 'userId2');
			});

			const { waitingList } = result.current.meetings[temporaryRoom.id];
			expect(waitingList).not.toBeNull();
			expect(size(waitingList)).toBe(2);
			expect(waitingList).toContain('userId0');
			expect(waitingList).toContain('userId1');
			expect(waitingList).not.toContain('userId2');
		});
	});

	describe('Recording', () => {
		test('Start a new recording', () => {
			const { result } = renderHook(() => useStore());
			act(() => {
				result.current.addMeeting(scheduleMeeting);
				result.current.startRecording(
					scheduleMeeting.id,
					'2022-08-25T18:24:28.961+02:00',
					'userId0'
				);
			});

			const { recStartedAt, recUserId } = result.current.meetings[scheduleMeeting.roomId];
			expect(recStartedAt).toBe('2022-08-25T18:24:28.961+02:00');
			expect(recUserId).toBe('userId0');
		});

		test('Stop an ongoing recording', () => {
			const { result } = renderHook(() => useStore());
			act(() => {
				result.current.addMeeting(scheduleMeeting);
				result.current.stopRecording(scheduleMeeting.id);
			});

			const { recStartedAt, recUserId } = result.current.meetings[scheduleMeeting.roomId];
			expect(recStartedAt).toBeUndefined();
			expect(recUserId).toBeUndefined();
		});
	});
});
