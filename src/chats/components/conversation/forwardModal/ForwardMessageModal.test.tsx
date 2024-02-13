/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen } from '@testing-library/react';

import ForwardMessageModal from './ForwardMessageModal';
import useStore from '../../../../store/Store';
import {
	createMockRoom,
	createMockTextMessage,
	createMockUser
} from '../../../../tests/createMock';
import { mockedForwardMessagesRequest } from '../../../../tests/mocks/network';
import { setup } from '../../../../tests/test-utils';
import { RoomBe } from '../../../../types/network/models/roomBeTypes';
import { RoomType } from '../../../../types/store/RoomTypes';
import { RootStore } from '../../../../types/store/StoreTypes';

const testRoom: RoomBe = createMockRoom({ id: 'roomTest', name: 'Test room' });

const messageToForward = createMockTextMessage({ roomId: testRoom.id });

const chat: RoomBe = createMockRoom({ id: 'chat', name: 'Chat', type: RoomType.ONE_TO_ONE });
const chat2: RoomBe = createMockRoom({ id: 'chat2', name: 'Chat 2', type: RoomType.GROUP });
const chat3: RoomBe = createMockRoom({ id: 'chat3', name: 'Chat 3', type: RoomType.TEMPORARY });

const sessionUser = createMockUser({ id: 'id', name: 'Name' });
const defaultSetupStore = (): void => {
	const store: RootStore = useStore.getState();
	store.setLoginInfo(sessionUser.id, sessionUser.name);
	store.addRoom(testRoom);
	store.addRoom(chat);
	store.addRoom(chat2);
	store.addRoom(chat3);
};
describe('Forward Message Modal', () => {
	test('All elements are rendered', () => {
		defaultSetupStore();
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
		defaultSetupStore();
		setup(
			<ForwardMessageModal
				open
				onClose={jest.fn()}
				roomId={testRoom.id}
				message={messageToForward}
			/>
		);

		const list = screen.getByTestId('list_forward_modal');
		expect(list).not.toHaveTextContent(testRoom.name!);
		expect(list).toHaveTextContent(chat.name!);
	});

	test('Only single and group conversations are displayed', () => {
		defaultSetupStore();
		setup(
			<ForwardMessageModal
				open
				onClose={jest.fn()}
				roomId={testRoom.id}
				message={messageToForward}
			/>
		);

		const list = screen.getByTestId('list_forward_modal');
		expect(list).toHaveTextContent(chat.name!);
		expect(list).toHaveTextContent(chat2.name!);
		expect(list).not.toHaveTextContent(chat3.name!);
	});

	test('Forward a message', async () => {
		defaultSetupStore();
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
		await user.type(chipInput, chat.name![0]);

		// Add Chip on ChipInput
		const conversationComponent = await screen.findByText(chat.name!);
		await user.click(conversationComponent);

		const footerButton = await screen.findByTestId('forward_button');
		expect(footerButton).not.toHaveAttribute('disabled', true);

		await user.click(footerButton);
		expect(mockedForwardMessagesRequest).toHaveBeenCalledTimes(1);
	});

	test('Forward a message to multiple conversations', async () => {
		defaultSetupStore();
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
		await user.type(chipInput, chat.name![0]);
		const conversationComponent = await screen.findByText(chat.name!);
		await user.click(conversationComponent);

		// Select Test Room 2 conversation
		await user.type(chipInput, chat2.name![0]);
		const conversation2Component = await screen.findByText(chat2.name!);
		await user.click(conversation2Component);

		const footerButton = await screen.findByTestId('forward_button');
		await user.click(footerButton);

		expect(mockedForwardMessagesRequest).toHaveBeenCalledTimes(1);
	});

	test('Close modal after forward someone else message', async () => {
		defaultSetupStore();

		const onClose = jest.fn();
		const { user } = setup(
			<ForwardMessageModal open onClose={onClose} roomId={testRoom.id} message={messageToForward} />
		);

		// Forward to Test Room
		await user.type(await screen.findByTestId('chip_input_forward_modal'), chat.name![0]);
		await user.click(await screen.findByText(chat.name!));
		await user.click(await screen.findByTestId('forward_button'));

		expect(onClose).toHaveBeenCalledTimes(1);
	});

	test('Close modal after forward my message', async () => {
		defaultSetupStore();
		const messageToForward = createMockTextMessage({ roomId: testRoom.id, from: sessionUser.id });

		const onClose = jest.fn();
		const { user } = setup(
			<ForwardMessageModal open onClose={onClose} roomId={testRoom.id} message={messageToForward} />
		);

		// Forward to Test Room
		await user.type(await screen.findByTestId('chip_input_forward_modal'), chat.name![0]);
		await user.click(await screen.findByText(chat.name!));
		await user.click(await screen.findByTestId('forward_button'));

		expect(onClose).toHaveBeenCalledTimes(1);
	});
});
