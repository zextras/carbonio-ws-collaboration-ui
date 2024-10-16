/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { screen } from '@testing-library/react';

import SelectVirtualRoomWidget from './SelectVirtualRoomWidget';
import useStore from '../../../store/Store';
import {
	createMockCapabilityList,
	createMockMeeting,
	createMockMember,
	createMockRoom,
	createMockUser
} from '../../../tests/createMock';
import { setup } from '../../../tests/test-utils';
import { MeetingBe } from '../../../types/network/models/meetingBeTypes';
import { RoomBe, RoomType } from '../../../types/network/models/roomBeTypes';

const sessionUser = createMockUser({ id: 'sessionId', name: 'Session User' });

const temporaryRoomMod: RoomBe = createMockRoom({
	id: 'temporary-mod-room-test',
	type: RoomType.TEMPORARY,
	name: 'Temporary mod room',
	members: [createMockMember({ userId: sessionUser.id, owner: true })]
});

const scheduledMeetingMod: MeetingBe = createMockMeeting({
	id: 'scheduled-meeting-mod-test',
	roomId: temporaryRoomMod.id
});

describe('SelectVirtualRoomWidget', () => {
	test('Should render properly - user has virtual rooms', async () => {
		const store = useStore.getState();
		store.setLoginInfo(sessionUser.id, sessionUser.name);
		store.setCapabilities(createMockCapabilityList());
		store.setRooms([temporaryRoomMod]);
		store.setMeetings([scheduledMeetingMod]);
		setup(
			<SelectVirtualRoomWidget onChange={jest.fn()} defaultValue={{ label: 'aa', link: 'link' }} />
		);

		const selectVirtualRoom = screen.getByTestId('select_virtual_room');

		expect(selectVirtualRoom).toBeInTheDocument();
	});

	test('Should render properly - user has not virtual rooms', async () => {
		const store = useStore.getState();
		store.setLoginInfo(sessionUser.id, sessionUser.name);
		store.setCapabilities(createMockCapabilityList());
		setup(
			<SelectVirtualRoomWidget onChange={jest.fn()} defaultValue={{ label: 'aa', link: 'link' }} />
		);

		const noVirtualRoom = screen.getByTestId('no_virtual_room');

		expect(noVirtualRoom).toBeInTheDocument();
	});
});
