/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { setup } from 'test-utils';

import useStore from '../../store/Store';
import { createMockMember, createMockRoom, createMockTextMessage } from '../../tests/createMock';
import { RoomBe } from '../../types/network/models/roomBeTypes';
import { MarkerStatus } from '../../types/store/MarkersTypes';
import { TextMessage } from '../../types/store/MessageTypes';
import { RoomType } from '../../types/store/RoomTypes';
import { RootStore } from '../../types/store/StoreTypes';
import MessagesList from './MessagesList';

const mockedRoom: RoomBe = createMockRoom({
	id: 'roomTest',
	type: RoomType.GROUP,
	members: [
		createMockMember({ userId: 'idPaolo', owner: true }),
		createMockMember({ userId: 'idRoberto' })
	]
});

const mockedMessage: TextMessage = createMockTextMessage({
	id: 'idSimpleTextMessage',
	roomId: 'roomTest',
	date: 1657099586818, // 18.08
	type: 'text',
	from: 'idRoberto',
	text: 'Hi guys! Today I will not be present to the meeting sorry!',
	read: MarkerStatus.UNREAD
});

describe('Replay to a message by opening the contextual menu', () => {
	test('Display the contextual menu of a message', () => {
		const store: RootStore = useStore.getState();
		store.addRoom(mockedRoom);
		store.newMessage(mockedMessage);
		setup(<MessagesList roomId={mockedRoom.id} />);
		const messageBubble = screen.getByTestId(`Bubble-${mockedMessage.id}`);
		expect(messageBubble).toBeVisible();
		userEvent.hover(messageBubble);
		// TODO fix test
		// const ctxMenu = screen.getByTestId(`cxtMenu-${simpleTextMessage.id}-iconOpen`);
		// expect(ctxMenu).toBeVisible();
	});
});
