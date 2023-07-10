/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { act, renderHook } from '@testing-library/react-hooks';
import { size } from 'lodash';

import { createMockMeeting, createMockParticipants } from '../../tests/createMock';
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
	createdAt: '2022-08-25T17:24:28.961+02:00'
});
const mockMeeting1 = createMockMeeting({
	id: 'meetingId1',
	roomId: 'roomId1',
	participants: [mockParticipant0],
	createdAt: '2022-08-25T18:25:29.961+02:00'
});
const mockMeeting2 = createMockMeeting({
	id: 'meetingId2',
	roomId: 'roomId2',
	participants: [mockParticipant1],
	createdAt: '2022-08-25T19:34:28.961+02:00'
});

describe('Test components slice', () => {
	it('setMeetings setter', () => {
		const { result } = renderHook(() => useStore());
		act(() => result.current.setMeetings([mockMeeting0, mockMeeting1, mockMeeting2]));

		// Check store data
		expect(size(result.current.meetings)).toBe(3);
		expect(result.current.meetings[mockMeeting0.roomId]).not.toBeNull();
		expect(result.current.meetings[mockMeeting0.roomId].id).toBe(mockMeeting0.id);
		expect(result.current.meetings[mockMeeting0.roomId].roomId).toBe(mockMeeting0.roomId);
		expect(size(result.current.meetings[mockMeeting0.roomId].participants)).toBe(
			size(mockMeeting0.participants)
		);
		expect(result.current.meetings[mockMeeting0.roomId].createdAt).toBe(mockMeeting0.createdAt);
	});

	it('addMeeting setter', () => {
		const { result } = renderHook(() => useStore());
		act(() => result.current.addMeeting(mockMeeting0));

		// Check store data
		expect(result.current.meetings[mockMeeting0.roomId]).not.toBeNull();
		expect(result.current.meetings[mockMeeting0.roomId].id).toBe(mockMeeting0.id);
		expect(result.current.meetings[mockMeeting0.roomId].roomId).toBe(mockMeeting0.roomId);
		expect(size(result.current.meetings[mockMeeting0.roomId].participants)).toBe(
			size(mockMeeting0.participants)
		);
		expect(result.current.meetings[mockMeeting0.roomId].createdAt).toBe(mockMeeting0.createdAt);
	});

	it('Combination of set components, add components, and remove components setters', () => {
		const { result } = renderHook(() => useStore());

		act(() => result.current.setMeetings([mockMeeting0, mockMeeting1]));
		expect(size(result.current.meetings)).toBe(2);

		act(() => result.current.addMeeting(mockMeeting2));
		expect(size(result.current.meetings)).toBe(3);

		act(() => result.current.deleteMeeting(mockMeeting1.id));
		expect(size(result.current.meetings)).toBe(2);
	});
});
