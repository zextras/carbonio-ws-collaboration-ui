/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { screen } from '@testing-library/react';
import React from 'react';
import { setup } from 'test-utils';

import ForwardMessageModal from './ForwardMessageModal';
import { mockedForwardMessagesRequest } from '../../../../jest-mocks';
import useStore from '../../../store/Store';
import { createMockRoom, createMockTextMessage } from '../../../tests/createMock';
import { RoomBe } from '../../../types/network/models/roomBeTypes';
import { RootStore } from '../../../types/store/StoreTypes';

const testRoom: RoomBe = createMockRoom({ id: 'roomTest', name: 'Test room' });

const messageToForward = createMockTextMessage({ roomId: testRoom.id });

const chat: RoomBe = createMockRoom({ id: 'chat', name: 'Chat' });
const chat2: RoomBe = createMockRoom({ id: 'chat2', name: 'Chat 2' });

describe('Forward Message Modal', () => {
	test('All elements are rendered', () => {
		const store: RootStore = useStore.getState();
		store.addRoom(testRoom);
		store.addRoom(chat2);
		setup(
			<ForwardMessageModal
				open
				onClose={jest.fn()}
				roomId={testRoom.id}
				message={messageToForward}
			/>
		);

		const title = screen.getByText(`Forward message from ${testRoom.name}`);
		expect(title).toBeInTheDocument();
		const description = screen.getByText('Choose a target chat to forward the message');
		expect(description).toBeInTheDocument();
		const list = screen.getByTestId('list_forward_modal');
		expect(list).toBeInTheDocument();
		const footerButton = screen.getByTestId('forward_button');
		expect(footerButton).toBeInTheDocument();
		expect(footerButton).toHaveAttribute('disabled');
	});

	test("Current conversation isn't displayed in the list", () => {
		const store: RootStore = useStore.getState();
		store.addRoom(testRoom);
		store.addRoom(chat);
		setup(
			<ForwardMessageModal
				open
				onClose={jest.fn()}
				roomId={testRoom.id}
				message={messageToForward}
			/>
		);

		const list = screen.getByTestId('list_forward_modal');
		expect(list).not.toHaveTextContent(testRoom.name);
		expect(list).toHaveTextContent(chat.name);
	});

	test('Forward a message', async () => {
		const store: RootStore = useStore.getState();
		store.addRoom(testRoom);
		store.addRoom(chat);
		const { user } = setup(
			<ForwardMessageModal
				open
				onClose={jest.fn()}
				roomId={testRoom.id}
				message={messageToForward}
			/>
		);

		// Type on ChipInput to trigger a new autoCompleteGalRequest
		const chipInput = await screen.findByTestId('chip_input_forward_modal');
		await user.type(chipInput, chat.name[0]);

		// Add Chip on ChipInput
		const conversationComponent = await screen.findByText(chat.name);
		await user.click(conversationComponent);

		const footerButton = await screen.findByTestId('forward_button');
		expect(footerButton).not.toHaveAttribute('disabled', true);

		await user.click(footerButton);
		expect(mockedForwardMessagesRequest).toHaveBeenCalledTimes(1);
	});

	test('Forward a message to multiple conversations', async () => {
		const store: RootStore = useStore.getState();
		store.addRoom(testRoom);
		store.addRoom(chat);
		store.addRoom(chat2);
		const { user } = setup(
			<ForwardMessageModal
				open
				onClose={jest.fn()}
				roomId={testRoom.id}
				message={messageToForward}
			/>
		);

		// Select Test Room conversation
		const chipInput = await screen.findByTestId('chip_input_forward_modal');
		await user.type(chipInput, chat.name[0]);
		const conversationComponent = await screen.findByText(chat.name);
		await user.click(conversationComponent);

		// Select Test Room 2 conversation
		await user.type(chipInput, chat2.name[0]);
		const conversation2Component = await screen.findByText(chat2.name);
		await user.click(conversation2Component);

		const footerButton = await screen.findByTestId('forward_button');
		await user.click(footerButton);

		expect(mockedForwardMessagesRequest).toHaveBeenCalledTimes(2);
	});
});
