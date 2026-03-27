/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { screen } from '@testing-library/react';

import ScreenShareButton from './ScreenShareButton';
import { useParams } from '../../../../__mocks__/react-router-dom';
import useStore from '../../../store/Store';
import {
	createMockMeeting,
	createMockParticipants,
	createMockRoom
} from '../../../tests/createMock';
import { routerContextSetup, setup } from '../../../tests/test-utils';
import { MeetingBe } from '../../../types/network/models/meetingBeTypes';
import { MEETINGS_ROUTES } from '../../contexts/routerContext';

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
		store.addMeetings([
			createMockMeeting({
				id: meeting.id,
				participants: [createMockParticipants({ userId: 'userId', screenStreamEnabled: false })]
			})
		]);
		setup(<ScreenShareButton />);
		const disabledScreenShareIcon = await screen.findByTestId('icon: ScreenSharingOff');
		expect(disabledScreenShareIcon).toBeVisible();
	});

	test('ScreenSharingOn icon when screenshare is enabled', async () => {
		const store = useStore.getState();
		store.setWebsocketStatus(true);
		store.setLoginInfo('userId', 'User', 'User');
		store.addMeetings([
			createMockMeeting({
				id: meeting.id,
				participants: [createMockParticipants({ userId: 'userId', screenStreamEnabled: true })]
			})
		]);
		routerContextSetup(<ScreenShareButton />, {
			meetingId: meeting.id,
			route: MEETINGS_ROUTES.MEETING
		});
		const enabledScreenShareIcon = await screen.findByTestId('icon: ScreenSharingOn');
		expect(enabledScreenShareIcon).toBeVisible();
	});
});
