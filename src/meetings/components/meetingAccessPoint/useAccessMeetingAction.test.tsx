/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { renderHook } from '@testing-library/react';

import useAccessMeetingAction from './useAccessMeetingAction';
import { mockDarkReaderEnable } from '../../../../__mocks__/darkreader';
import { MeetingsApiToSpy, spyOnMeetingsApi } from '../../../tests/mocks/network';

describe('useAccessMeetingAction tests', () => {
	test('Enable the DarkReader', async () => {
		renderHook(() => useAccessMeetingAction(true, null, false, jest.fn()));
		expect(mockDarkReaderEnable).toHaveBeenCalled();
	});

	test('handleLeave for waiting user', async () => {
		const spyOnLeaveWaitingRoom = spyOnMeetingsApi(MeetingsApiToSpy.LEAVE_WAITING_ROOM);
		const { result } = renderHook(() => useAccessMeetingAction(true, null, true, jest.fn()));
		result.current.handleLeave();
		expect(spyOnLeaveWaitingRoom).toHaveBeenCalled();
	});

	test('handleEnterMeeting', async () => {
		const spyOnEnterMeeting = spyOnMeetingsApi(MeetingsApiToSpy.ENTER_MEETING);
		const { result } = renderHook(() => useAccessMeetingAction(true, null, true, jest.fn()));
		result.current.handleEnterMeeting();
		expect(spyOnEnterMeeting).toHaveBeenCalled();
	});

	test('handleWaitingRoom for waiting user', async () => {
		const spyOnJoinMeeting = spyOnMeetingsApi(MeetingsApiToSpy.JOIN_MEETING);
		const { result } = renderHook(() => useAccessMeetingAction(true, null, true, jest.fn()));
		result.current.handleWaitingRoom();
		expect(spyOnJoinMeeting).toHaveBeenCalled();
	});
});
