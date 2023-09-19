/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { screen } from '@testing-library/react';
import React from 'react';

import AccessMeetingModal from './AccessMeetingModal';
import { mockedEnterMeetingRequest, mockedJoinMeetingRequest } from '../../../jest-mocks';
import useStore from '../../store/Store';
import { createMockMeeting, createMockRoom } from '../../tests/createMock';
import { setup } from '../../tests/test-utils';

const room = createMockRoom();

beforeEach(() => {
	const store = useStore.getState();
	store.addRoom(room);
});

describe('AccessMeetingModal - enter to meeting', () => {
	test('Enter to meeting', async () => {
		const meeting = createMockMeeting({ roomId: room.id, active: true });
		useStore.getState().addMeeting(meeting);
		mockedEnterMeetingRequest.mockReturnValueOnce('meetingId');

		const { user } = setup(<AccessMeetingModal roomId={room.id} />);

		// Click on enter button to join the meeting
		const enterButton = await screen.findByText('Enter');
		await user.click(enterButton);

		expect(mockedEnterMeetingRequest).toBeCalled();
	});

	test('Select audio device', async () => {
		const meeting = createMockMeeting({ roomId: room.id, active: true });
		useStore.getState().addMeeting(meeting);
		mockedJoinMeetingRequest.mockReturnValueOnce(meeting);

		const { user } = setup(<AccessMeetingModal roomId={room.id} />);

		const audioButtonSelect = await screen.findAllByTestId('icon: ChevronDownOutline');
		await user.click(audioButtonSelect[1]);

		const device = await screen.findByText('Audio Device 2');
		expect(device).toBeInTheDocument();
	});
	test('Select video device', async () => {
		const meeting = createMockMeeting({ roomId: room.id, active: true });
		useStore.getState().addMeeting(meeting);
		mockedJoinMeetingRequest.mockReturnValueOnce(meeting);

		const { user } = setup(<AccessMeetingModal roomId={room.id} />);

		const videoButtonSelect = await screen.findAllByTestId('icon: ChevronDownOutline');
		await user.click(videoButtonSelect[0]);

		const device = await screen.findByText('Video Device 2');
		expect(device).toBeInTheDocument();
	});
});
