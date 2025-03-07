/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { renderHook, screen, waitFor } from '@testing-library/react';

import useAccessMeetingInformation from './useAccessMeetingInformation';
import useStore from '../../../store/Store';
import { createMockMeeting } from '../../../tests/createMock';
import { MeetingsApiToSpy, spyOnMeetingsApi } from '../../../tests/mocks/network';
import { mockGoToInfoPage } from '../../../tests/mocks/useRouting';
import { ProvidersWrapper, setup } from '../../../tests/test-utils';
import { MeetingType } from '../../../types/network/models/meetingBeTypes';
import { PAGE_INFO_TYPE } from '../../contexts/routerContext';

describe('useAccessMeetingAction tests', () => {
	test('Render ShowMeetingAccessPage', async () => {
		const { result } = renderHook(() => useAccessMeetingInformation(), {
			wrapper: ProvidersWrapper
		});

		const { ShowMeetingAccessPage } = result.current;
		setup(
			<ShowMeetingAccessPage>
				<div />
			</ShowMeetingAccessPage>
		);
		const wrapper = screen.getByTestId('meeting_access_page_view');
		expect(wrapper).toBeVisible();
	});

	test('Internal user has userHasDirectAccess to permanent meeting', async () => {
		const spyOnGetMeetingByMeetingId = spyOnMeetingsApi(MeetingsApiToSpy.GET_MEETING_BY_MEETING_ID);
		spyOnGetMeetingByMeetingId.mockImplementation(() => Promise.resolve(createMockMeeting()));
		useStore.getState().setChatsBeStatus(true);
		const { result } = renderHook(() => useAccessMeetingInformation(), {
			wrapper: ProvidersWrapper
		});
		await waitFor(() => {
			expect(result.current.hasUserDirectAccess).toBeTruthy();
		});
	});

	test('Internal user has not userHasDirectAccess to scheduled meeting', async () => {
		const spyOnGetMeetingByMeetingId = spyOnMeetingsApi(MeetingsApiToSpy.GET_MEETING_BY_MEETING_ID);
		spyOnGetMeetingByMeetingId.mockImplementation(() =>
			Promise.resolve(createMockMeeting({ meetingType: MeetingType.SCHEDULED }))
		);
		useStore.getState().setChatsBeStatus(true);

		const { result } = renderHook(() => useAccessMeetingInformation(), {
			wrapper: ProvidersWrapper
		});
		await waitFor(() => {
			expect(result.current.hasUserDirectAccess).toBeFalsy();
		});
	});

	test('Get meeting name for guest users', async () => {
		const spyOnGetScheduledMeetingName = spyOnMeetingsApi(
			MeetingsApiToSpy.GET_SCHEDULED_MEETING_NAME
		);
		useStore.getState().setChatsBeStatus(true);
		spyOnGetScheduledMeetingName.mockResolvedValueOnce({ name: 'Meeting name' });
		const { result } = renderHook(() => useAccessMeetingInformation(), {
			wrapper: ProvidersWrapper
		});
		await waitFor(() => {
			expect(result.current.meetingName).toBe('Meeting name');
		});
	});

	test('Meeting not found for guest users', async () => {
		const spyOnGetScheduledMeetingName = spyOnMeetingsApi(
			MeetingsApiToSpy.GET_SCHEDULED_MEETING_NAME
		);
		useStore.getState().setChatsBeStatus(true);
		spyOnGetScheduledMeetingName.mockRejectedValue(false);
		renderHook(() => useAccessMeetingInformation(), {
			wrapper: ProvidersWrapper
		});
		await waitFor(() => {
			expect(mockGoToInfoPage).toHaveBeenCalledWith(PAGE_INFO_TYPE.MEETING_NOT_FOUND);
		});
	});
});
