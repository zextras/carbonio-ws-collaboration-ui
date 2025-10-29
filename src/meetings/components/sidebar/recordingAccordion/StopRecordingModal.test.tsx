/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen } from '@testing-library/react';

import StopRecordingModal from './StopRecordingModal';
import useStore from '../../../../store/Store';
import {
	createMockMeeting,
	createMockMember,
	createMockRoom,
	createMockUser
} from '../../../../tests/createMock';
import { MeetingsApiToSpy, spyOnMeetingsApi } from '../../../../tests/mocks/network';
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
	meetingType: MeetingType.SCHEDULED
});

beforeEach(() => {
	const store = useStore.getState();
	store.setLoginInfo(user1.id, 'user1');
	store.addRooms([room]);
	store.addMeetings([meeting]);
	store.meetingConnection(meeting.id);
});
describe('StopRecordingModal tests', () => {
	test('Show a snackbar when the stop recording request fails', async () => {
		const spyOnStopRecording = spyOnMeetingsApi(MeetingsApiToSpy.STOP_RECORDING);
		spyOnStopRecording.mockRejectedValue(false);
		const { user } = setup(
			<StopRecordingModal isOpen closeModal={jest.fn} meetingId={meeting.id} />
		);
		await user.click(screen.getByText('Stop'));

		const snackbar = await screen.findByText(
			'It is not possible to stop the registration, please contact your system administrator.'
		);
		expect(snackbar).toBeVisible();
	});
});
