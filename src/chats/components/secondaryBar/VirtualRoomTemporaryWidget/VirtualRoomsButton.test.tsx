/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen } from '@testing-library/react';

import VirtualRoomsButton from './VirtualRoomsButton';
import useStore from '../../../../store/Store';
import {
	createMockCapabilityList,
	createMockMeeting,
	createMockMember,
	createMockRoom,
	createMockUser
} from '../../../../tests/createMock';
import { setup } from '../../../../tests/test-utils';
import { MeetingBe } from '../../../../types/network/models/meetingBeTypes';
import { RoomBe, RoomType } from '../../../../types/network/models/roomBeTypes';

const sessionUser = createMockUser({ id: 'sessionId', name: 'Session User' });

const temporaryRoomMod: RoomBe = createMockRoom({
	id: 'temporary-mod-room-test',
	type: RoomType.TEMPORARY,
	members: [createMockMember({ userId: sessionUser.id, owner: true })]
});

const scheduledMeetingMod: MeetingBe = createMockMeeting({
	id: 'scheduled-meeting-mod-test',
	roomId: temporaryRoomMod.id
});

describe('VirtualRoomsButton', () => {
	test("user copy virtual room's link", async () => {
		const store = useStore.getState();
		store.setLoginInfo(sessionUser.id, sessionUser.name);
		store.setCapabilities(createMockCapabilityList());
		store.setRooms([temporaryRoomMod]);
		store.setMeetings([scheduledMeetingMod]);

		const { user } = setup(<VirtualRoomsButton expanded />);

		const button = screen.getByRole('button');
		await user.click(button);

		const copyButton = await screen.findByTestId('icon: Link2Outline');
		expect(copyButton).toBeVisible();

		await user.click(copyButton);

		const copiedLink = await window.navigator.clipboard.readText();
		expect(copiedLink).toEqual(
			'https://localhost/carbonio/focus-mode/meetings/scheduled-meeting-mod-test'
		);
	});
	// test('create virtual room', async () => {
	// 	const store = useStore.getState();
	// 	store.setLoginInfo(sessionUser.id, sessionUser.name);
	// 	store.setCapabilities(createMockCapabilityList());
	// 	store.setRooms([temporaryRoomMod]);
	// 	store.setMeetings([scheduledMeetingMod]);
	//
	// 	const { user } = setup(<VirtualRoomsButton expanded />);
	//
	// 	const button = screen.getByRole('button');
	// 	await user.click(button);
	//
	// 	const input = await screen.findByRole('textbox');
	// 	await user.type(input, 'Virtual Room name');
	// });
});
