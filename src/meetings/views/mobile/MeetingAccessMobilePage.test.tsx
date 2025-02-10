/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen } from '@testing-library/react';

import MeetingAccessMobilePage from './MeetingAccessMobilePage';
import useStore from '../../../store/Store';
import { createMockMeeting } from '../../../tests/createMock';
import { MeetingsApiToSpy, spyOnMeetingsApi } from '../../../tests/mocks/network';
import { setup } from '../../../tests/test-utils';
import { MeetingType } from '../../../types/network/models/meetingBeTypes';

describe('MeetingAccessMobilePage', () => {
	test('Enter button for internal user with direct access', async () => {
		const spyOnGetMeetingByMeetingId = spyOnMeetingsApi(MeetingsApiToSpy.GET_MEETING_BY_MEETING_ID);
		spyOnGetMeetingByMeetingId.mockImplementation(() =>
			Promise.resolve(createMockMeeting({ meetingType: MeetingType.PERMANENT }))
		);
		const store = useStore.getState();
		store.setChatsBeStatus(true);

		setup(<MeetingAccessMobilePage />);
		const enterButton = await screen.findByRole('button', { name: /Enter/i });
		expect(enterButton).toBeVisible();
	});

	test('Enter button is disabled when ws connection is down', async () => {
		const spyOnGetMeetingByMeetingId = spyOnMeetingsApi(MeetingsApiToSpy.GET_MEETING_BY_MEETING_ID);
		spyOnGetMeetingByMeetingId.mockImplementation(() =>
			Promise.resolve(createMockMeeting({ meetingType: MeetingType.PERMANENT }))
		);
		const store = useStore.getState();
		store.setChatsBeStatus(true);
		store.setWebsocketStatus(false);

		setup(<MeetingAccessMobilePage />);

		const enterButton = await screen.findByRole('button', { name: /Enter/i });
		expect(enterButton).toBeDisabled();
	});

	test('Enter button for waiting user', async () => {
		const spyOnGetMeetingByMeetingId = spyOnMeetingsApi(MeetingsApiToSpy.GET_MEETING_BY_MEETING_ID);
		spyOnGetMeetingByMeetingId.mockImplementation(() =>
			Promise.resolve(createMockMeeting({ meetingType: MeetingType.SCHEDULED }))
		);
		const store = useStore.getState();
		store.setChatsBeStatus(true);

		setup(<MeetingAccessMobilePage />);
		const enterButton = await screen.findByRole('button', { name: /Ready to participate/i });
		expect(enterButton).toBeVisible();
	});
});
