/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen, waitFor } from '@testing-library/react';
import { renderHook } from '@testing-library/react-hooks';

import useAccessMeetingInformation from './useAccessMeetingInformation';
import { PAGE_INFO_TYPE } from '../../../hooks/useRouting';
import useStore from '../../../store/Store';
import { createMockMeeting } from '../../../tests/createMock';
import {
	mockedGetMeetingByMeetingId,
	mockedGetScheduledMeetingName
} from '../../../tests/mocks/network';
import { mockGoToInfoPage } from '../../../tests/mocks/useRouting';
import { ProvidersWrapper, setup } from '../../../tests/test-utils';
import { MeetingType } from '../../../types/network/models/meetingBeTypes';

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
		useStore.getState().setChatsBeStatus(true);
		mockedGetMeetingByMeetingId.mockResolvedValueOnce(createMockMeeting());
		const { result } = renderHook(() => useAccessMeetingInformation(), {
			wrapper: ProvidersWrapper
		});
		await waitFor(() => {
			expect(result.current.hasUserDirectAccess).toBeTruthy();
		});
	});

	test('Internal user has not userHasDirectAccess to scheduled meeting', async () => {
		useStore.getState().setChatsBeStatus(true);
		mockedGetMeetingByMeetingId.mockResolvedValueOnce(
			createMockMeeting({ meetingType: MeetingType.SCHEDULED })
		);
		const { result } = renderHook(() => useAccessMeetingInformation(), {
			wrapper: ProvidersWrapper
		});
		await waitFor(() => {
			expect(result.current.hasUserDirectAccess).toBeFalsy();
		});
	});

	test('Get meeting name for guest users', async () => {
		useStore.getState().setChatsBeStatus(true);
		mockedGetMeetingByMeetingId.mockRejectedValueOnce(new Error('Error'));
		mockedGetScheduledMeetingName.mockResolvedValueOnce({ name: 'Meeting name' });
		const { result } = renderHook(() => useAccessMeetingInformation(), {
			wrapper: ProvidersWrapper
		});
		await waitFor(() => {
			expect(result.current.meetingName).toBe('Meeting name');
		});
	});

	test('Meeting not found for guest users', async () => {
		useStore.getState().setChatsBeStatus(true);
		mockedGetMeetingByMeetingId.mockRejectedValueOnce(new Error('Error'));
		mockedGetScheduledMeetingName.mockRejectedValueOnce(new Error('Error'));
		renderHook(() => useAccessMeetingInformation(), {
			wrapper: ProvidersWrapper
		});
		await waitFor(() => {
			expect(mockGoToInfoPage).toBeCalledWith(PAGE_INFO_TYPE.MEETING_NOT_FOUND);
		});
	});
});
