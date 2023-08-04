/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// import { screen } from '@testing-library/react';
// import React from 'react';
// import { act } from 'react-dom/test-utils';

// import AccessMeetingModal from './AccessMeetingModal';
import {
	mockedCreateMeetingRequest,
	mockedJoinMeetingRequest,
	mockedStartMeetingRequest
} from '../../../jest-mocks';
import useStore from '../../store/Store';
import { createMockMeeting, createMockRoom } from '../../tests/createMock';
// import { setup } from '../../tests/test-utils';

const room = createMockRoom();
const meeting = createMockMeeting({ id: room.id, active: false });

beforeEach(() => {
	const store = useStore.getState();
	store.addRoom(room);
});

describe('AccessMeetingModal - enter to meeting', () => {
	test("Meeting doesn't exist", async () => {
		mockedCreateMeetingRequest.mockResolvedValueOnce(meeting);
		mockedStartMeetingRequest.mockResolvedValueOnce(meeting);
		mockedJoinMeetingRequest.mockResolvedValueOnce(meeting);

		/* const { user } = setup(<AccessMeetingModal roomId={room.id} />);

		// Click on enter button to join the meeting
		const enterButton = screen.getByText('Enter');
		await user.click(enterButton);

		expect(mockedCreateMeetingRequest).toBeCalled();
		expect(mockedStartMeetingRequest).toBeCalled();
		expect(mockedJoinMeetingRequest).toBeCalled(); */
	});

	test('Meeting exists but is not active', async () => {
		const meeting = createMockMeeting({ roomId: room.id, active: false });
		useStore.getState().addMeeting(meeting);

		mockedStartMeetingRequest.mockResolvedValueOnce(
			createMockMeeting({ roomId: room.id, active: true })
		);
		mockedJoinMeetingRequest.mockResolvedValueOnce(
			createMockMeeting({ roomId: room.id, active: true })
		);

		/* const { user } = setup(<AccessMeetingModal roomId={room.id} />);

		// Click on enter button to join the meeting
		const enterButton = screen.getByText('Enter');
		await user.click(enterButton);

		expect(mockedCreateMeetingRequest).not.toBeCalled();
		expect(mockedStartMeetingRequest).toBeCalled();
		expect(mockedJoinMeetingRequest).toBeCalled(); */
	});

	test('Meeting exists and is active', async () => {
		const meeting = createMockMeeting({ roomId: room.id, active: true });
		useStore.getState().addMeeting(meeting);
		mockedJoinMeetingRequest.mockReturnValueOnce(meeting);

		/* const { user } = setup(<AccessMeetingModal roomId={room.id} />);

		// Click on enter button to join the meeting
		const enterButton = screen.getByText('Enter');
		await user.click(enterButton);

		expect(mockedCreateMeetingRequest).not.toBeCalled();
		expect(mockedStartMeetingRequest).not.toBeCalled();
		expect(mockedJoinMeetingRequest).toBeCalled(); */
	});
});
