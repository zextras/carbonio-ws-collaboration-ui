/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { screen } from '@testing-library/react';

import ScreenShareButton from './ScreenShareButton';
import { useParams } from '../../../../__mocks__/react-router';
import useStore from '../../../store/Store';
import { createMockMeeting, createMockRoom } from '../../../tests/createMock';
import { setup } from '../../../tests/test-utils';
import { MeetingBe } from '../../../types/network/models/meetingBeTypes';

const meeting: MeetingBe = createMockMeeting({ roomId: createMockRoom().id });

describe('ScreenShare button', () => {
	test('Should render the component', async () => {
		useParams.mockReturnValue({ meetingId: meeting.id });
		setup(<ScreenShareButton />);
		expect(await screen.findByTestId('screenshare-button')).toBeVisible();
	});

	test('ScreenShare button is disabled when websocket is down', async () => {
		useStore.getState().setWebsocketStatus(false);
		useParams.mockReturnValue({ meetingId: meeting.id });
		setup(<ScreenShareButton />);
		expect(await screen.findByTestId('screenshare-button')).toBeDisabled();
	});

	test('ScreenSharingOff icon when screenshare is disabled', async () => {
		useParams.mockReturnValue({ meetingId: meeting.id });
		const store = useStore.getState();
		store.setWebsocketStatus(true);
		store.setLoginInfo('userId', 'User', 'User');
		store.addMeeting(
			createMockMeeting({
				id: meeting.id,
				participants: [{ userId: 'userId', screenStreamEnabled: false }]
			})
		);
		setup(<ScreenShareButton />);
		const disabledScreenShareIcon = await screen.findByTestId('icon: ScreenSharingOff');
		expect(disabledScreenShareIcon).toBeVisible();
	});

	test('ScreenSharingOn icon when screenshare is enabled', async () => {
		useParams.mockReturnValue({ meetingId: meeting.id });
		const store = useStore.getState();
		store.setWebsocketStatus(true);
		store.setLoginInfo('userId', 'User', 'User');
		store.addMeeting(
			createMockMeeting({
				id: meeting.id,
				participants: [{ userId: 'userId', screenStreamEnabled: true }]
			})
		);
		setup(<ScreenShareButton />);
		const enabledScreenShareIcon = await screen.findByTestId('icon: ScreenSharingOn');
		expect(enabledScreenShareIcon).toBeVisible();
	});
});
