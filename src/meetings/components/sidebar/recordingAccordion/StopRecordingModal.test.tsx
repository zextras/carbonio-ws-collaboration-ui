/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { act, screen } from '@testing-library/react';

import StopRecordingModal from './StopRecordingModal';
import useStore from '../../../../store/Store';
import {
	createMockMeeting,
	createMockMember,
	createMockRoom,
	createMockUser
} from '../../../../tests/createMock';
import { mockedStopRecordingRequest } from '../../../../tests/mocks/network';
import { setup } from '../../../../tests/test-utils';
import { MeetingBe, MeetingType } from '../../../../types/network/models/meetingBeTypes';
import { RoomBe } from '../../../../types/network/models/roomBeTypes';
import { RoomType } from '../../../../types/store/RoomTypes';
import { formatDate } from '../../../../utils/dateUtils';

const user1 = createMockUser({ id: 'user1', name: 'user1' });

const room: RoomBe = createMockRoom({
	type: RoomType.TEMPORARY,
	members: [createMockMember({ userId: user1.id, owner: true })]
});

const meeting: MeetingBe = createMockMeeting({
	roomId: 'id',
	type: MeetingType.SCHEDULED
});

beforeEach(() => {
	const store = useStore.getState();
	store.setLoginInfo(user1.id, 'user1');
	store.addRoom(room);
	store.addMeeting(meeting);
	store.meetingConnection(meeting.id, false, undefined, false, undefined);
});
describe('StopRecordingModal tests', () => {
	test('Stop recording without modifying the recording name', async () => {
		mockedStopRecordingRequest.mockResolvedValueOnce({});
		const { user } = setup(
			<StopRecordingModal isOpen closeModal={jest.fn} meetingId={meeting.id} />
		);
		act(() => {
			user.click(screen.getByText('Stop'));
		});

		const defaultRecordingName = `Rec ${formatDate(new Date(), 'YYYY-MM-DD HHmm')} ${
			room.name
		}`.replaceAll(' ', '_');
		const snackbar = await screen.findByText(
			`You will find ${defaultRecordingName} in Home as soon as it is available`
		);
		expect(snackbar).toBeVisible();
		expect(mockedStopRecordingRequest).toBeCalled();
	});

	test('Stop recording with a modified recording name', async () => {
		mockedStopRecordingRequest.mockResolvedValueOnce({});
		const { user } = setup(
			<StopRecordingModal isOpen closeModal={jest.fn} meetingId={meeting.id} />
		);
		const newName = 'NewRecordingName';
		await user.clear(screen.getByRole('textbox'));
		await user.type(screen.getByRole('textbox'), newName);
		act(() => {
			user.click(screen.getByText('Stop'));
		});

		const snackbar = await screen.findByText(
			`You will find ${newName} in Home as soon as it is available`
		);
		expect(snackbar).toBeVisible();
		expect(mockedStopRecordingRequest).toBeCalled();
	});

	test('SHow a snackbar when the stop recording request fails', async () => {
		mockedStopRecordingRequest.mockRejectedValueOnce({});
		const { user } = setup(
			<StopRecordingModal isOpen closeModal={jest.fn} meetingId={meeting.id} />
		);
		act(() => {
			user.click(screen.getByText('Stop'));
		});

		const snackbar = await screen.findByText(
			'It is not possible to stop the registration, please contact your system administrator.'
		);
		expect(snackbar).toBeVisible();
	});
});
