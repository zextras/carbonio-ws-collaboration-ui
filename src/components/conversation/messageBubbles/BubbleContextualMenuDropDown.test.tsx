/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { screen } from '@testing-library/react';
import React from 'react';
import { setup } from 'test-utils';

import useStore from '../../../store/Store';
import { createMockRoom, createMockTextMessage } from '../../../tests/createMock';
import { RoomBe } from '../../../types/network/models/roomBeTypes';
import { TextMessage } from '../../../types/store/MessageTypes';
import { RoomType } from '../../../types/store/RoomTypes';
import { RootStore } from '../../../types/store/StoreTypes';
import BubbleContextualMenuDropDown from './BubbleContextualMenuDropDown';

const mockedRoom: RoomBe = createMockRoom({
	id: 'roomId',
	type: RoomType.GROUP
});

const mySessionId = 'mySessionId';

describe('Bubble Contextual Menu - other user messages', () => {
	test('Simple text message', async () => {
		const simpleTextMessage: TextMessage = createMockTextMessage({ roomId: mockedRoom.id });
		const store: RootStore = useStore.getState();
		store.addRoom(mockedRoom);
		store.newMessage(simpleTextMessage);
		const { user } = setup(
			<BubbleContextualMenuDropDown message={simpleTextMessage} isMyMessage={false} />
		);
		const arrowButton = screen.getByTestId('icon: ArrowIosDownward');
		await user.click(arrowButton);

		// Actions
		const replyAction = screen.getByText(/Reply/i);
		expect(replyAction).toBeInTheDocument();
		const copyAction = screen.getByText(/Copy/i);
		expect(copyAction).toBeInTheDocument();
		const forwardAction = screen.getByText(/Forward/i);
		expect(forwardAction).toBeInTheDocument();
		const deleteAction = screen.queryByText(/Delete/i);
		expect(deleteAction).not.toBeInTheDocument();
	});

	test('Replied text message', async () => {
		const simpleTextMessage: TextMessage = createMockTextMessage({
			roomId: mockedRoom.id,
			replyTo: 'replyToId',
			repliedMessage: createMockTextMessage({ id: 'replyToId', roomId: mockedRoom.id })
		});
		const store: RootStore = useStore.getState();
		store.addRoom(mockedRoom);
		store.newMessage(simpleTextMessage);
		const { user } = setup(
			<BubbleContextualMenuDropDown message={simpleTextMessage} isMyMessage={false} />
		);
		const arrowButton = screen.getByTestId('icon: ArrowIosDownward');
		await user.click(arrowButton);

		// Actions
		const replyAction = screen.getByText(/Reply/i);
		expect(replyAction).toBeInTheDocument();
		const copyAction = screen.getByText(/Copy/i);
		expect(copyAction).toBeInTheDocument();
		const forwardAction = screen.getByText(/Forward/i);
		expect(forwardAction).toBeInTheDocument();
		const deleteAction = screen.queryByText(/Delete/i);
		expect(deleteAction).not.toBeInTheDocument();
	});

	test('Forwarded text message', async () => {
		const simpleTextMessage: TextMessage = createMockTextMessage({
			roomId: mockedRoom.id,
			forwarded: { id: 'forwardedId', date: 1661441294393, text: 'Forwarded text!' }
		});
		const store: RootStore = useStore.getState();
		store.addRoom(mockedRoom);
		store.newMessage(simpleTextMessage);
		const { user } = setup(
			<BubbleContextualMenuDropDown message={simpleTextMessage} isMyMessage={false} />
		);
		const arrowButton = screen.getByTestId('icon: ArrowIosDownward');
		await user.click(arrowButton);

		// Actions
		const replyAction = screen.getByText(/Reply/i);
		expect(replyAction).toBeInTheDocument();
		const copyAction = screen.getByText(/Copy/i);
		expect(copyAction).toBeInTheDocument();
		const forwardAction = screen.queryByText(/Forward/i);
		expect(forwardAction).not.toBeInTheDocument();
		const deleteAction = screen.queryByText(/Delete/i);
		expect(deleteAction).not.toBeInTheDocument();
	});
});

describe('Bubble Contextual Menu - my messages', () => {
	test('Simple text message', async () => {
		const simpleTextMessage: TextMessage = createMockTextMessage({
			roomId: mockedRoom.id,
			from: mySessionId,
			date: Date.now() - 60
		});
		const store: RootStore = useStore.getState();
		store.setSessionId(mySessionId);
		store.addRoom(mockedRoom);
		store.newMessage(simpleTextMessage);
		const { user } = setup(
			<BubbleContextualMenuDropDown message={simpleTextMessage} isMyMessage />
		);
		const arrowButton = screen.getByTestId('icon: ArrowIosDownward');
		await user.click(arrowButton);

		// Actions
		const replyAction = screen.getByText(/Reply/i);
		expect(replyAction).toBeInTheDocument();
		const copyAction = screen.getByText(/Copy/i);
		expect(copyAction).toBeInTheDocument();
		const forwardAction = screen.getByText(/Forward/i);
		expect(forwardAction).toBeInTheDocument();
		const deleteAction = screen.getByText(/Delete/i);
		expect(deleteAction).toBeInTheDocument();
	});

	test('Replied text message', async () => {
		const simpleTextMessage: TextMessage = createMockTextMessage({
			roomId: mockedRoom.id,
			from: mySessionId,
			date: Date.now() - 60,
			replyTo: 'replyToId',
			repliedMessage: createMockTextMessage({ id: 'replyToId', roomId: mockedRoom.id })
		});
		const store: RootStore = useStore.getState();
		store.addRoom(mockedRoom);
		store.newMessage(simpleTextMessage);
		const { user } = setup(
			<BubbleContextualMenuDropDown message={simpleTextMessage} isMyMessage />
		);
		const arrowButton = screen.getByTestId('icon: ArrowIosDownward');
		await user.click(arrowButton);

		// Actions
		const replyAction = screen.getByText(/Reply/i);
		expect(replyAction).toBeInTheDocument();
		const copyAction = screen.getByText(/Copy/i);
		expect(copyAction).toBeInTheDocument();
		const forwardAction = screen.getByText(/Forward/i);
		expect(forwardAction).toBeInTheDocument();
		const deleteAction = screen.getByText(/Delete/i);
		expect(deleteAction).toBeInTheDocument();
	});

	test('Forwarded text message', async () => {
		const simpleTextMessage: TextMessage = createMockTextMessage({
			roomId: mockedRoom.id,
			from: mySessionId,
			date: Date.now() - 60,
			forwarded: { id: 'forwardedId', date: 1661441294393, text: 'Forwarded text!' }
		});
		const store: RootStore = useStore.getState();
		store.addRoom(mockedRoom);
		store.newMessage(simpleTextMessage);
		const { user } = setup(
			<BubbleContextualMenuDropDown message={simpleTextMessage} isMyMessage />
		);
		const arrowButton = screen.getByTestId('icon: ArrowIosDownward');
		await user.click(arrowButton);

		// Actions
		const replyAction = screen.getByText(/Reply/i);
		expect(replyAction).toBeInTheDocument();
		const copyAction = screen.getByText(/Copy/i);
		expect(copyAction).toBeInTheDocument();
		const forwardAction = screen.queryByText(/Forward/i);
		expect(forwardAction).not.toBeInTheDocument();
		const deleteAction = screen.queryByTestId(/Delete/i);
		expect(deleteAction).not.toBeInTheDocument();
	});
});
