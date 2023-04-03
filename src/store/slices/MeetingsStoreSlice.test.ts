/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { act, renderHook } from '@testing-library/react-hooks';
import { size } from 'lodash';

import { MeetingBe, MeetingParticipantBe } from '../../types/network/models/meetingBeTypes';
import useStore from '../Store';

const mockParticipant0: MeetingParticipantBe = {
	userId: 'userId0',
	sessionId: 'sessionId0',
	hasAudioStreamOn: true,
	hasVideoStreamOn: true
};
const mockParticipant1: MeetingParticipantBe = {
	userId: 'userId1',
	sessionId: 'sessionId1',
	hasAudioStreamOn: false,
	hasVideoStreamOn: true
};

const mockMeeting0: MeetingBe = {
	id: 'meetingId0',
	roomId: 'roomId0',
	participants: [mockParticipant0, mockParticipant1],
	createdAt: '2022-08-25T17:24:28.961+02:00'
};
const mockMeeting1: MeetingBe = {
	id: 'meetingId1',
	roomId: 'roomId1',
	participants: [mockParticipant0],
	createdAt: '2022-08-25T18:25:29.961+02:00'
};
const mockMeeting2: MeetingBe = {
	id: 'meetingId2',
	roomId: 'roomId2',
	participants: [mockParticipant1],
	createdAt: '2022-08-25T19:34:28.961+02:00'
};

describe('Test meetings slice', () => {
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

	it('Combination of set meetings, add meetings, and remove meetings setters', () => {
		const { result } = renderHook(() => useStore());

		act(() => result.current.setMeetings([mockMeeting0, mockMeeting1]));
		expect(size(result.current.meetings)).toBe(2);

		act(() => result.current.addMeeting(mockMeeting2));
		expect(size(result.current.meetings)).toBe(3);

		act(() => result.current.deleteMeeting(mockMeeting1.id));
		expect(size(result.current.meetings)).toBe(2);
	});
});
