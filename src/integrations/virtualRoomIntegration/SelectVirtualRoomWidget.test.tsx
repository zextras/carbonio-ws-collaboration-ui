/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { act, screen } from '@testing-library/react';

import SelectVirtualRoomWidgetComponent from './SelectVirtualRoomWidget';
import useStore from '../../store/Store';
import {
	createMockAttributesList,
	createMockMeeting,
	createMockMember,
	createMockRoom,
	createMockUser
} from '../../tests/createMock';
import { setup } from '../../tests/test-utils';
import { MeetingBe } from '../../types/network/models/meetingBeTypes';
import { RoomBe, RoomType } from '../../types/network/models/roomBeTypes';

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
		act(() => {
			const store = useStore.getState();
			store.setLoginInfo({ id: sessionUser.id, name: sessionUser.name });
			store.setAttributes(createMockAttributesList());
			store.addRooms([temporaryRoomMod]);
			store.addMeetings([scheduledMeetingMod]);
		});
		await act(async () => {
			setup(
				<SelectVirtualRoomWidgetComponent
					onChange={vi.fn()}
					defaultValue={{
						label: temporaryRoomMod.name ?? '',
						link: 'https://localhost/carbonio/focus-mode/meetings/scheduled-meeting-mod-test'
					}}
				/>
			);
		});

		const selectVirtualRoom = screen.getByTestId('select_virtual_room');
		expect(selectVirtualRoom).toBeInTheDocument();

		const selectedVirtualRoom = await screen.findByText(temporaryRoomMod.name ?? '');
		expect(selectedVirtualRoom).toBeInTheDocument();
	});

	test('Should render properly - user has not virtual rooms and defaultValue is not undefined', async () => {
		const store = useStore.getState();
		store.setLoginInfo({ id: sessionUser.id, name: sessionUser.name });
		store.setAttributes(createMockAttributesList());
		await act(async () => {
			setup(
				<SelectVirtualRoomWidgetComponent
					onChange={() => null}
					defaultValue={{ label: 'Virtual Room Selected', link: 'a-beautiful-link' }}
				/>
			);
		});

		const selectedVirtualRoom = screen.getByText('Virtual Room Selected');
		expect(selectedVirtualRoom).toBeInTheDocument();
	});
});
