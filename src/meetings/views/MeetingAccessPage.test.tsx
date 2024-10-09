/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen } from '@testing-library/react';

import MeetingAccessPage from './MeetingAccessPage';
import useStore from '../../store/Store';
import { createMockMeeting } from '../../tests/createMock';
import { mockMediaDevicesResolve } from '../../tests/mocks/global';
import { mockedGetMeetingByMeetingId } from '../../tests/mocks/network';
import { setup } from '../../tests/test-utils';
import { MeetingType } from '../../types/network/models/meetingBeTypes';

beforeAll(() => {
	mockMediaDevicesResolve();
});

describe('MeetingAccessPage', () => {
	test('Leave button for guest user', async () => {
		const store = useStore.getState();
		store.setChatsBeStatus(true);
		mockedGetMeetingByMeetingId.mockReturnValueOnce(
			createMockMeeting({ meetingType: MeetingType.SCHEDULED })
		);

		setup(<MeetingAccessPage />);
		const icon = await screen.findByTestId('icon: LogOut');
		expect(icon).toBeVisible();
	});
});
