/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { act, screen } from '@testing-library/react';

import SelectVirtualRoomWidgetComponent from './SelectVirtualRoomWidget';
import useStore from '../../../store/Store';
import {
	createMockCapabilityList,
	createMockMeeting,
	createMockMember,
	createMockRoom,
	createMockUser
} from '../../../tests/createMock';
import { mockedGetScheduledMeetingName } from '../../../tests/mocks/network';
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
		mockedGetScheduledMeetingName.mockReturnValue('name');
		const store = useStore.getState();
		store.setLoginInfo(sessionUser.id, sessionUser.name);
		store.setCapabilities(createMockCapabilityList());
		store.setRooms([temporaryRoomMod]);
		store.setMeetings([scheduledMeetingMod]);
		setup(<SelectVirtualRoomWidgetComponent onChange={jest.fn()} defaultValue={undefined} />);

		const selectVirtualRoom = screen.getByTestId('select_virtual_room');

		expect(selectVirtualRoom).toBeInTheDocument();
	});

	test('Should render properly - user has not virtual rooms', async () => {
		mockedGetScheduledMeetingName.mockRejectedValue(new Error('Error'));
		const store = useStore.getState();
		store.setLoginInfo(sessionUser.id, sessionUser.name);
		store.setCapabilities(createMockCapabilityList());
		await act(async () => {
			setup(<SelectVirtualRoomWidgetComponent onChange={() => null} defaultValue={undefined} />);
		});

		const noVirtualRoom = screen.getByTestId('no_virtual_room');

		expect(noVirtualRoom).toBeInTheDocument();
	});
});
