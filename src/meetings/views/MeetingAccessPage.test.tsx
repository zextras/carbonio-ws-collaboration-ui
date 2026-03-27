/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen } from '@testing-library/react';

import MeetingAccessPage from './MeetingAccessPage';
import { mockDarkReaderEnable } from '../../../__mocks__/darkreader';
import * as api from '../../network/apis/MeetingsApi';
import useStore from '../../store/Store';
import { createMockMeeting } from '../../tests/createMock';
import { setup } from '../../tests/test-utils';
import { MeetingType } from '../../types/network/models/meetingBeTypes';

describe('MeetingAccessPage', () => {
	test('Enable the DarkReader on first render', async () => {
		setup(<MeetingAccessPage />);
		expect(mockDarkReaderEnable).toHaveBeenCalled();
	});
	test('Internal user has userHasDirectAccess to permanent meeting', async () => {
		const spyOnGetMeetingByMeetingId = vi.spyOn(api, 'getMeetingByMeetingId');
		spyOnGetMeetingByMeetingId.mockImplementation(() => Promise.resolve(createMockMeeting()));
		useStore.getState().setChatsBeStatus(true);
		setup(<MeetingAccessPage />);
		expect(await screen.findByText(/Participate to.*meeting/i)).toBeVisible();
	});

	test('Internal user has not userHasDirectAccess to scheduled meeting', async () => {
		const spyOnGetMeetingByMeetingId = vi.spyOn(api, 'getMeetingByMeetingId');
		spyOnGetMeetingByMeetingId.mockImplementation(() =>
			Promise.resolve(createMockMeeting({ meetingType: MeetingType.SCHEDULED }))
		);
		useStore.getState().setChatsBeStatus(true);
		setup(<MeetingAccessPage />);
		expect(
			await screen.findByText('Click on “READY TO PARTICIPATE” to enter the meeting')
		).toBeVisible();
	});
});
