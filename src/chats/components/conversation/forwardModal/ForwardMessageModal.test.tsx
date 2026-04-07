/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen } from '@testing-library/react';

import ForwardMessageModal from './ForwardMessageModal';
import { mockGoToRoomPage } from '../../../../hooks/__mocks__/useRouting';
import * as api from '../../../../network/apis/RoomsApi';
import useStore from '../../../../store/Store';
import {
	createMockMember,
	createMockRoom,
	createMockTextMessage,
	createMockUser
} from '../../../../tests/createMock';
import { setup } from '../../../../tests/test-utils';
import { RoomBe } from '../../../../types/network/models/roomBeTypes';
import { RoomType } from '../../../../types/store/RoomTypes';
import { RootStore } from '../../../../types/store/StoreTypes';

const sessionUser = createMockUser({ id: 'id', name: 'Name' });
const user1 = createMockUser({ id: 'user1', name: 'User 1' });

const testRoom: RoomBe = createMockRoom({ id: 'roomTest', name: 'Test room' });

const messageToForward = createMockTextMessage({ roomId: testRoom.id });
const messageToForward2 = createMockTextMessage({ roomId: testRoom.id });
const messageToForward3 = createMockTextMessage({ roomId: testRoom.id });

const chat: RoomBe = createMockRoom({
	id: 'chat',
	type: RoomType.ONE_TO_ONE,
	members: [createMockMember({ userId: user1.id })]
});
const chat2: RoomBe = createMockRoom({ id: 'chat2', name: 'Chat 2', type: RoomType.GROUP });
const chat3: RoomBe = createMockRoom({ id: 'chat3', name: 'Chat 3', type: RoomType.TEMPORARY });

vi.mock('../../../../hooks/useRouting');

beforeEach(() => {
	const store: RootStore = useStore.getState();
	store.setLoginInfo({ id: sessionUser.id, name: sessionUser.name });
	store.setUserInfo([user1]);
	store.addRooms([testRoom, chat, chat2, chat3]);
});

describe('Forward Message Modal', () => {
	test('All elements are rendered', () => {
		setup(
			<ForwardMessageModal
				open
				onClose={vi.fn()}
				roomId={testRoom.id}
				messagesToForward={[messageToForward]}
			/>
		);

		const title = screen.getByText(`Forward message from ${testRoom.name}`);
		expect(title).toBeInTheDocument();
		const description = screen.getByText('Choose a target chat to forward the message');
		expect(description).toBeInTheDocument();
		const list = screen.getByTestId('list_forward_modal');
		expect(list).toBeInTheDocument();
		const footerButton = screen.getByRole('button', { name: /Forward/i });
		expect(footerButton).toBeInTheDocument();
		expect(footerButton).toBeDisabled();
	});

	test("Current conversation isn't displayed in the list", () => {
		setup(
			<ForwardMessageModal
				open
				onClose={vi.fn()}
				roomId={testRoom.id}
				messagesToForward={[messageToForward]}
			/>
		);

		const list = screen.getByTestId('list_forward_modal');
		expect(list).not.toHaveTextContent(testRoom.name!);
		expect(list).toHaveTextContent(user1.name);
		expect(list).toHaveTextContent(chat2.name!);
	});

	test('Only single and group conversations are displayed', () => {
		setup(
			<ForwardMessageModal
				open
				onClose={vi.fn()}
				roomId={testRoom.id}
				messagesToForward={[messageToForward]}
			/>
		);

		const list = screen.getByTestId('list_forward_modal');
		expect(list).toHaveTextContent(user1.name);
		expect(list).toHaveTextContent(chat2.name!);
		expect(list).not.toHaveTextContent(chat3.name!);
	});

	test('Forward a message to a 1-to-1 room', async () => {
		const spyOnForwardMessage = vi.spyOn(api, 'forwardMessages');
		const { user } = setup(
			<ForwardMessageModal
				open
				onClose={vi.fn()}
				roomId={testRoom.id}
				messagesToForward={[messageToForward]}
			/>
		);

		// Type on ChipInput to trigger a new autoCompleteGalRequest
		const chipInput = await screen.findByTestId('chip_input_forward_modal');
		await user.type(chipInput, user1.name![0]);

		// Add Chip on ChipInput
		const conversationComponent = await screen.findByText(user1.name!);
		await user.click(conversationComponent);

		const footerButton = await screen.findByRole('button', { name: /Forward/i });
		expect(footerButton).toBeEnabled();

		await user.click(footerButton);
		expect(spyOnForwardMessage).toHaveBeenCalledTimes(1);
	});

	test('Forward a message to a group', async () => {
		const spyOnForwardMessage = vi.spyOn(api, 'forwardMessages');
		const { user } = setup(
			<ForwardMessageModal
				open
				onClose={vi.fn()}
				roomId={testRoom.id}
				messagesToForward={[messageToForward]}
			/>
		);

		// Type on ChipInput to trigger a new autoCompleteGalRequest
		const chipInput = await screen.findByTestId('chip_input_forward_modal');
		await user.type(chipInput, chat2.name![0]);

		// Add Chip on ChipInput
		const conversationComponent = await screen.findByText(chat2.name!);
		await user.click(conversationComponent);

		const footerButton = await screen.findByRole('button', { name: /Forward/i });
		expect(footerButton).toBeEnabled();

		await user.click(footerButton);
		expect(spyOnForwardMessage).toHaveBeenCalledTimes(1);
	});

	test('Forward more than one message to a group', async () => {
		const spyOnForwardMessage = vi.spyOn(api, 'forwardMessages');
		const { user } = setup(
			<ForwardMessageModal
				open
				onClose={vi.fn()}
				roomId={testRoom.id}
				messagesToForward={[messageToForward, messageToForward2, messageToForward3]}
			/>
		);

		// Type on ChipInput to trigger a new autoCompleteGalRequest
		const chipInput = await screen.findByTestId('chip_input_forward_modal');
		await user.type(chipInput, chat2.name![0]);

		// Add Chip on ChipInput
		const conversationComponent = await screen.findByText(chat2.name!);
		await user.click(conversationComponent);

		const footerButton = await screen.findByRole('button', { name: /Forward/i });
		expect(footerButton).toBeEnabled();

		await user.click(footerButton);
		expect(spyOnForwardMessage).toHaveBeenCalledTimes(1);
	});

	test('Forward a message to multiple conversations', async () => {
		const spyOnForwardMessage = vi.spyOn(api, 'forwardMessages');
		const { user } = setup(
			<ForwardMessageModal
				open
				onClose={vi.fn()}
				roomId={testRoom.id}
				messagesToForward={[messageToForward]}
			/>
		);

		// Select Test Room conversation
		const chipInput = await screen.findByTestId('chip_input_forward_modal');
		await user.type(chipInput, user1.name[0]);
		const conversationComponent = await screen.findByText(user1.name);
		await user.click(conversationComponent);

		// Select Test Room 2 conversation
		await user.type(chipInput, chat2.name![0]);
		const conversation2Component = await screen.findByText(chat2.name!);
		await user.click(conversation2Component);

		const footerButton = await screen.findByRole('button', { name: /Forward/i });
		await user.click(footerButton);

		expect(spyOnForwardMessage).toHaveBeenCalledTimes(1);
	});

	test('Forward more than one message to multiple conversations', async () => {
		const spyOnForwardMessage = vi.spyOn(api, 'forwardMessages');
		const { user } = setup(
			<ForwardMessageModal
				open
				onClose={vi.fn()}
				roomId={testRoom.id}
				messagesToForward={[messageToForward, messageToForward2, messageToForward3]}
			/>
		);

		// Select Test Room conversation
		const chipInput = await screen.findByTestId('chip_input_forward_modal');
		await user.type(chipInput, user1.name[0]);
		const conversationComponent = await screen.findByText(user1.name);
		await user.click(conversationComponent);

		// Select Test Room 2 conversation
		await user.type(chipInput, chat2.name![0]);
		const conversation2Component = await screen.findByText(chat2.name!);
		await user.click(conversation2Component);

		const footerButton = await screen.findByRole('button', { name: /Forward/i });
		await user.click(footerButton);

		expect(spyOnForwardMessage).toHaveBeenCalledTimes(1);
	});

	test('Close modal after forward someone else message', async () => {
		vi.spyOn(api, 'forwardMessages').mockImplementation(() => Promise.resolve([]));

		const onClose = vi.fn();
		const { user } = setup(
			<ForwardMessageModal
				open
				onClose={onClose}
				roomId={testRoom.id}
				messagesToForward={[messageToForward]}
			/>
		);

		// Forward to Test Room
		await user.type(await screen.findByTestId('chip_input_forward_modal'), chat2.name![0]);
		await user.click(await screen.findByText(chat2.name!));
		await user.click(await screen.findByRole('button', { name: /Forward/i }));

		expect(onClose).toHaveBeenCalledTimes(1);
	});

	test('Close modal after forward my message', async () => {
		vi.spyOn(api, 'forwardMessages').mockImplementation(() => Promise.resolve([]));

		const messageToForward = createMockTextMessage({ roomId: testRoom.id, from: sessionUser.id });

		const onClose = vi.fn();
		const { user } = setup(
			<ForwardMessageModal
				open
				onClose={onClose}
				roomId={testRoom.id}
				messagesToForward={[messageToForward]}
			/>
		);

		// Forward to Test Room
		await user.type(await screen.findByTestId('chip_input_forward_modal'), chat2.name![0]);
		await user.click(await screen.findByText(chat2.name!));
		await user.click(await screen.findByRole('button', { name: /Forward/i }));

		expect(onClose).toHaveBeenCalledTimes(1);
	});

	test('forwarding to one room redirect to tht room', async () => {
		vi.spyOn(api, 'forwardMessages').mockImplementation(() => Promise.resolve([]));

		const messageToForward = createMockTextMessage({ roomId: testRoom.id, from: sessionUser.id });

		const onClose = vi.fn();
		const { user } = setup(
			<ForwardMessageModal
				open
				onClose={onClose}
				roomId={testRoom.id}
				messagesToForward={[messageToForward]}
			/>
		);

		// Forward to Test Room
		await user.type(await screen.findByTestId('chip_input_forward_modal'), chat2.name![0]);
		await user.click(await screen.findByText(chat2.name!));
		await user.click(await screen.findByRole('button', { name: /Forward/i }));

		expect(mockGoToRoomPage).toHaveBeenCalled();
	});
});
