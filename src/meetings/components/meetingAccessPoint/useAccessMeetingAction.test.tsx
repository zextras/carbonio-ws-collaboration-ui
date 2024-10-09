/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { renderHook } from '@testing-library/react-hooks';

import useAccessMeetingAction from './useAccessMeetingAction';
import { mockDarkReaderEnable } from '../../../../__mocks__/darkreader';
import {
	mockedEnterMeetingRequest,
	mockedJoinMeetingRequest,
	mockedLeaveWaitingRoomRequest
} from '../../../tests/mocks/network';

describe('useAccessMeetingAction tests', () => {
	test('Enable the DarkReader', async () => {
		renderHook(() => useAccessMeetingAction(true, null, false, jest.fn()));
		expect(mockDarkReaderEnable).toHaveBeenCalled();
	});

	test('handleLeave for waiting user', async () => {
		mockedLeaveWaitingRoomRequest.mockResolvedValueOnce({});
		const { result } = renderHook(() => useAccessMeetingAction(true, null, true, jest.fn()));
		result.current.handleLeave();
		expect(mockedLeaveWaitingRoomRequest).toHaveBeenCalled();
	});

	test('handleEnterMeeting', async () => {
		mockedEnterMeetingRequest.mockResolvedValueOnce({});
		const { result } = renderHook(() => useAccessMeetingAction(true, null, true, jest.fn()));
		result.current.handleEnterMeeting();

		expect(mockedEnterMeetingRequest).toHaveBeenCalled();
	});

	test('handleWaitingRoom for waiting user', async () => {
		mockedJoinMeetingRequest.mockResolvedValueOnce({});
		const { result } = renderHook(() => useAccessMeetingAction(true, null, true, jest.fn()));
		result.current.handleWaitingRoom();

		expect(mockedJoinMeetingRequest).toHaveBeenCalled();
	});
});
