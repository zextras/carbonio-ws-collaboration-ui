/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen } from '@testing-library/react';

import ReferenceMessageView from './ReferenceMessageView';
import useStore from '../../../../store/Store';
import {
	createMockMember,
	createMockRoom,
	createMockTextMessage
} from '../../../../tests/createMock';
import { setup } from '../../../../tests/test-utils';
import { RoomBe } from '../../../../types/network/models/roomBeTypes';
import { messageActionType } from '../../../../types/store/ActiveConversationTypes';
import { MarkerStatus } from '../../../../types/store/MarkersTypes';
import { MessageType } from '../../../../types/store/MessageTypes';
import { RoomType } from '../../../../types/store/RoomTypes';
import { RootStore } from '../../../../types/store/StoreTypes';
import MessagesList from '../MessagesList';

const mockedRoom: RoomBe = createMockRoom({
	id: 'roomTest',
	type: RoomType.GROUP,
	members: [
		createMockMember({ userId: 'idPaolo', owner: true }),
		createMockMember({ userId: 'idRoberto' })
	]
});

const mockedMessage = createMockTextMessage({
	id: 'idSimpleTextMessage',
	roomId: 'roomTest',
	date: 1657099586818, // 18.08
	type: MessageType.TEXT_MSG,
	from: 'idRoberto',
	text: 'Hi guys! Today I will not be present to the components sorry!',
	read: MarkerStatus.UNREAD
});

describe('Reply to a message by opening the contextual menu', () => {
	test('Display the contextual menu of a message', async () => {
		const store: RootStore = useStore.getState();
		store.addRoom(mockedRoom);
		store.newMessage(mockedMessage);
		const { user } = setup(<MessagesList roomId={mockedRoom.id} />);
		const messageBubble = screen.getByTestId(`Bubble-${mockedMessage.id}`);
		expect(messageBubble).toBeVisible();
		await user.hover(messageBubble);
		const ctxMenu = screen.getByTestId(`cxtMenu-${mockedMessage.id}-iconOpen`);
		expect(ctxMenu).toBeVisible();
	});
	test('Display of reference message shows correctly', () => {
		const store: RootStore = useStore.getState();
		store.addRoom(mockedRoom);
		store.newMessage(mockedMessage);
		store.setReferenceMessage(
			mockedRoom.id,
			mockedMessage.id,
			mockedMessage.from,
			mockedMessage.stanzaId,
			messageActionType.REPLY
		);
		setup(<ReferenceMessageView roomId={mockedRoom.id} />);
		const referenceMessage = screen.getByTestId('reference_message');
		expect(referenceMessage).toBeInTheDocument();
		const closeButton = screen.getByTestId('icon: Close');
		expect(closeButton).toBeInTheDocument();
	});
	test('Close reference message', async () => {
		const store: RootStore = useStore.getState();
		store.addRoom(mockedRoom);
		store.newMessage(mockedMessage);
		store.setReferenceMessage(
			mockedRoom.id,
			mockedMessage.id,
			mockedMessage.from,
			mockedMessage.stanzaId,
			messageActionType.REPLY
		);
		const { user } = setup(<ReferenceMessageView roomId={mockedRoom.id} />);
		const referenceMessage = screen.getByTestId('reference_message');
		expect(referenceMessage).toBeInTheDocument();
		const closeButton = screen.getByTestId('icon: Close');
		await user.click(closeButton);
		expect(referenceMessage).not.toBeInTheDocument();
	});
});
