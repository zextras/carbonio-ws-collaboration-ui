/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { act, renderHook, waitFor, screen } from '@testing-library/react';

import useGeneralMeetingControls from './useGeneralMeetingControls';
import { PAGE_INFO_TYPE } from './useRouting';
import useStore from '../store/Store';
import { createMockMeeting } from '../tests/createMock';
import { mockedGetMeetingByMeetingId } from '../tests/mocks/network';
import { mockGoToInfoPage } from '../tests/mocks/useRouting';
import { ProvidersWrapper } from '../tests/test-utils';

const meeting = createMockMeeting({ participants: [{ userId: 'userId' }] });

beforeEach(() => {
	const store = useStore.getState();
	store.setLoginInfo('userId', 'User');
	store.setChatsBeStatus(true);
	store.setWebsocketStatus(true);
	store.addMeeting(meeting);
	store.meetingConnection(meeting.id, false, undefined, false, undefined);
});
describe('useGeneralMeetingControl hook', () => {
	test('Display snackbar when web socket connection is back and users is already in it', async () => {
		mockedGetMeetingByMeetingId.mockReturnValueOnce(meeting);
		renderHook(() => useGeneralMeetingControls(meeting.id), {
			wrapper: ProvidersWrapper
		});
		act(() => {
			useStore.getState().setWebsocketStatus(false);
		});
		act(() => {
			useStore.getState().setWebsocketStatus(true);
		});
		await waitFor(() => {
			expect(
				screen.getByText('Connection re-established, meeting can continue without interruption.')
			).toBeInTheDocument();
		});
	});

	test('Close meeting if web socket connection is back but user is not in meeting anymore', async () => {
		mockedGetMeetingByMeetingId.mockReturnValueOnce({
			...meeting,
			participants: []
		});
		renderHook(() => useGeneralMeetingControls(meeting.id), {
			wrapper: ProvidersWrapper
		});
		act(() => {
			useStore.getState().setWebsocketStatus(false);
		});
		act(() => {
			useStore.getState().setWebsocketStatus(true);
		});
		await waitFor(() => {
			expect(mockGoToInfoPage).toHaveBeenCalledWith(PAGE_INFO_TYPE.GENERAL_ERROR);
		});
	});
});
