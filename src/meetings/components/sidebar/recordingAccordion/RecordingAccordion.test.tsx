/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen } from '@testing-library/react';

import RecordingAccordion from './RecordingAccordion';
import useStore from '../../../../store/Store';
import {
	createMockMeeting,
	createMockMember,
	createMockRoom,
	createMockUser
} from '../../../../tests/createMock';
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

beforeEach(() => {
	const store = useStore.getState();
	store.setLoginInfo(user1.id, 'user1');
	store.addRoom(room);
	store.addMeeting(meeting);
	store.meetingConnection(meeting.id, false, undefined, false, undefined);
});
describe('RecordingAccordion tests', () => {
	test('Toggle accordion status', async () => {
		const iconUp = 'icon: ChevronUp';
		const iconDown = 'icon: ChevronDown';
		const { user } = setup(<RecordingAccordion meetingId={meeting.id} />);
		expect(screen.getByTestId(iconDown)).toBeVisible();

		await user.click(screen.getByTestId(iconDown));
		expect(screen.getByTestId(iconUp)).toBeVisible();

		await user.click(screen.getByTestId(iconUp));
		expect(screen.getByTestId(iconDown)).toBeVisible();
	});

	test.todo("Recording can only be started if there isn't an active recording");

	test.todo('Recording can only be stopped when there is an active recording');

	test.todo('When user clicks on the start button the recording starts');
});
