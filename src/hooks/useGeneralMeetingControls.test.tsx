/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { act, renderHook, waitFor, screen } from '@testing-library/react';

import useGeneralMeetingControls from './useGeneralMeetingControls';
import { PAGE_INFO_TYPE } from '../meetings/contexts/routerContext';
import useStore from '../store/Store';
import { createMockMeeting, createMockParticipants } from '../tests/createMock';
import { ProvidersWrapper } from '../tests/test-utils';
import { mockGoToInfoPage } from './__mocks__/useRouting';
import * as api from '../network/apis/MeetingsApi';

const meeting = createMockMeeting({ participants: [createMockParticipants({ userId: 'userId' })] });

vi.mock('../hooks/useRouting');

beforeEach(() => {
	const store = useStore.getState();
	store.setLoginInfo({ id: 'userId', name: 'User' });
	store.setChatsBeStatus(true);
	store.setWebsocketStatus(true);
	store.meetingConnection(meeting.id);
	store.addMeetings([meeting]);
});
describe('useGeneralMeetingControl hook', () => {
	test('Show a snackbar when the WebSocket connection is restored and the user is still in the meeting', async () => {
		const spyOnGetMeetingByMeetingId = vi.spyOn(api, 'getMeetingByMeetingId');
		spyOnGetMeetingByMeetingId.mockImplementation(() => Promise.resolve(meeting));
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

	test('Automatically close the meeting if the WebSocket connection is restored but the user is no longer in the meeting', async () => {
		const spyOnGetMeetingByMeetingId = vi.spyOn(api, 'getMeetingByMeetingId');
		spyOnGetMeetingByMeetingId.mockImplementation(() =>
			Promise.resolve({
				...meeting,
				participants: []
			})
		);
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
