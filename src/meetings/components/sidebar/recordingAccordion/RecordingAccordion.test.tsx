/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen, waitFor } from '@testing-library/react';
import { act } from 'react-dom/test-utils';

import RecordingAccordion from './RecordingAccordion';
import useStore from '../../../../store/Store';
import {
	createMockMeeting,
	createMockMember,
	createMockRoom,
	createMockUser
} from '../../../../tests/createMock';
import { mockedStartRecordingRequest } from '../../../../tests/mocks/network';
import { setup } from '../../../../tests/test-utils';
import { MeetingBe, MeetingType } from '../../../../types/network/models/meetingBeTypes';
import { RoomBe } from '../../../../types/network/models/roomBeTypes';
import { RoomType } from '../../../../types/store/RoomTypes';

const user1 = createMockUser({ id: 'user1', name: 'user1' });

const room: RoomBe = createMockRoom({
	type: RoomType.TEMPORARY,
	members: [createMockMember({ userId: user1.id, owner: true })]
});

const meeting: MeetingBe = createMockMeeting({
	roomId: 'id',
	type: MeetingType.SCHEDULED
});

const iconUp = 'icon: ChevronUp';
const iconDown = 'icon: ChevronDown';

beforeEach(() => {
	const store = useStore.getState();
	store.setLoginInfo(user1.id, 'user1');
	store.addRoom(room);
	store.addMeeting(meeting);
	store.meetingConnection(meeting.id, false, undefined, false, undefined);
});
describe('RecordingAccordion tests', () => {
	test('Toggle accordion status', async () => {
		const { user } = setup(<RecordingAccordion meetingId={meeting.id} />);
		expect(screen.getByTestId(iconDown)).toBeVisible();

		await user.click(screen.getByTestId(iconDown));
		expect(screen.getByTestId(iconUp)).toBeVisible();

		await user.click(screen.getByTestId(iconUp));
		expect(screen.getByTestId(iconDown)).toBeVisible();
	});

	test("User can only start the recording if it isn't already active", async () => {
		setup(<RecordingAccordion meetingId={meeting.id} />);
		const startButton = await screen.findByTestId('startRecordingButton');
		const stopButton = await screen.findByTestId('stopRecordingButton');

		expect(startButton).toBeEnabled();
		expect(stopButton).toBeDisabled();
	});

	test("User can only stop the recording if it's already active", async () => {
		setup(<RecordingAccordion meetingId={meeting.id} />);

		act(() => {
			useStore.getState().startRecording(meeting.id, '32423423', 'user1');
		});

		const startButton = await screen.findByTestId('startRecordingButton');
		const stopButton = await screen.findByTestId('stopRecordingButton');

		expect(startButton).toBeDisabled();
		expect(stopButton).toBeEnabled();
	});

	test('When user clicks on the start button the recording starts', async () => {
		mockedStartRecordingRequest.mockResolvedValueOnce({});
		const { user } = setup(<RecordingAccordion meetingId={meeting.id} />);

		const iconChevronDown = 'icon: ChevronDown';
		const chevron = screen.getByTestId(iconChevronDown);
		await user.click(chevron);

		const startButton = await screen.findByTestId('startRecordingButton');
		await waitFor(() => user.click(startButton));

		expect(mockedStartRecordingRequest).toBeCalled();
	});

	test('Show a snackbar when the start recording request fails', async () => {
		mockedStartRecordingRequest.mockRejectedValueOnce({});
		const { user } = setup(<RecordingAccordion meetingId={meeting.id} />);

		const chevron = screen.getByTestId(iconDown);
		await user.click(chevron);

		const startButton = await screen.findByTestId('startRecordingButton');
		await waitFor(() => user.click(startButton));

		const snackbar = await screen.findByText(
			'It is not possible to start the registration, please contact your system administrator.'
		);
		expect(snackbar).toBeVisible();
	});
});
