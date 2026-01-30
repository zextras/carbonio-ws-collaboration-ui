/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { act, renderHook } from '@testing-library/react';

import Chat from './Chat';
import { ConversationView } from './Conversation';
import useStore from '../../../store/Store';
import {
	createMockConfigurationMessage,
	createMockMember,
	createMockRoom,
	createMockTextMessage,
	createMockUser
} from '../../../tests/createMock';
import { screen, setup, within } from '../../../tests/test-utils';
import { RoomBe, RoomType } from '../../../types/network/models/roomBeTypes';
import { messageActionType } from '../../../types/store/ActiveConversationTypes';
import { OperationType } from '../../../types/store/ChatsRegistryTypes';
import { RootStore } from '../../../types/store/StoreTypes';

const user1 = createMockUser({ id: 'user1', name: 'user1' });
const mockedRoom: RoomBe = createMockRoom({
	id: 'roomTest',
	type: RoomType.ONE_TO_ONE,
	members: [createMockMember({ userId: user1.id, owner: true })]
});

beforeEach(() => {
	const store = useStore.getState();
	store.setLoginInfo(user1.id, 'user1');
	store.setUserInfo([user1]);
	store.addRooms([mockedRoom]);
});

describe('Chat', () => {
	const iconDropdown = 'icon: ArrowIosDownward';
	const pinSectionDataTestId = 'pin-message';
	const dropdownPinMessageOption = /pin message/i;
	const sendMessageIcon = 'icon: Navigation2';

	describe('Pin message', () => {
		it('should pin the message', async () => {
			const mockedTextMessage = createMockTextMessage({
				id: 'idSimpleTextMessage',
				roomId: mockedRoom.id
			});

			const store: RootStore = useStore.getState();
			store.newMessage(mockedTextMessage);
			const { user } = setup(
				<Chat
					roomId={mockedRoom.id}
					conversationView={ConversationView.CHAT}
					setConversationView={vi.fn()}
				/>
			);

			expect(screen.getByText(mockedTextMessage.text)).toBeVisible();
			await user.hover(screen.getByText(mockedTextMessage.text));
			await user.click(screen.getByTestId(iconDropdown));
			await user.click(screen.getByText(dropdownPinMessageOption));
			const pinSection = screen.getByTestId(pinSectionDataTestId);
			expect(within(pinSection).getByText(mockedTextMessage.text)).toBeVisible();
			expect(
				within(screen.getByTestId(`Bubble-${mockedTextMessage.id}`)).getByTestId('icon: Pin3')
			).toBeVisible();
		});

		describe('Unpin message', () => {
			it('should unpin the message from the dropdown', async () => {
				const mockedTextMessage = createMockTextMessage({
					id: 'idSimpleTextMessage',
					roomId: mockedRoom.id
				});

				const store: RootStore = useStore.getState();
				store.newMessage(mockedTextMessage);
				const { user } = setup(
					<Chat
						roomId={mockedRoom.id}
						conversationView={ConversationView.CHAT}
						setConversationView={vi.fn()}
					/>
				);

				await user.hover(screen.getByText(mockedTextMessage.text));
				const dropdown = screen.getByTestId(iconDropdown);
				await user.click(dropdown);
				await user.click(screen.getByText(dropdownPinMessageOption));
				await user.click(dropdown);
				const unpinMsg = screen.getByText(/unpin message/i);
				expect(unpinMsg).toBeVisible();
				await user.click(unpinMsg);
				expect(screen.queryByTestId(pinSectionDataTestId)).not.toBeInTheDocument();
			});

			it('should unpin the message from the close button', async () => {
				const mockedTextMessage = createMockTextMessage({
					id: 'idSimpleTextMessage',
					roomId: mockedRoom.id
				});

				const store: RootStore = useStore.getState();
				store.newMessage(mockedTextMessage);
				const { user } = setup(
					<Chat
						roomId={mockedRoom.id}
						conversationView={ConversationView.CHAT}
						setConversationView={vi.fn()}
					/>
				);

				await user.hover(screen.getByText(mockedTextMessage.text));
				const dropdown = screen.getByTestId(iconDropdown);
				await user.click(dropdown);
				await user.click(screen.getByText(dropdownPinMessageOption));
				await user.click(screen.getByTestId('icon: Close'));
				expect(screen.queryByTestId(pinSectionDataTestId)).not.toBeInTheDocument();
			});
		});

		describe('Configuration message', () => {
			it('should render the pin configuration message', async () => {
				const mockedTextMessage = createMockTextMessage({
					id: 'idSimpleTextMessage',
					roomId: mockedRoom.id
				});

				const mockPinConfigurationMessage = createMockConfigurationMessage({
					operation: OperationType.MESSAGE_PINNED,
					from: user1.id
				});
				const { result } = renderHook(() => useStore());
				act(() => {
					result.current.updateHistory(mockedRoom.id, [mockPinConfigurationMessage]);
				});

				const store: RootStore = useStore.getState();
				store.newMessage(mockedTextMessage);
				const { user } = setup(
					<Chat
						roomId={mockedRoom.id}
						conversationView={ConversationView.CHAT}
						setConversationView={vi.fn()}
					/>
				);

				await user.hover(screen.getByText(mockedTextMessage.text));
				const dropdown = screen.getByTestId(iconDropdown);
				await user.click(dropdown);
				await user.click(screen.getByText(dropdownPinMessageOption));
				expect(screen.getByText(/you pinned a message/i)).toBeVisible();
			});

			it('should render the unpin configuration message', async () => {
				const mockedTextMessage = createMockTextMessage({
					id: 'idSimpleTextMessage',
					roomId: mockedRoom.id
				});

				const mockPinConfigurationMessage = createMockConfigurationMessage({
					operation: OperationType.MESSAGE_UNPINNED,
					from: user1.id
				});
				const { result } = renderHook(() => useStore());
				act(() => {
					result.current.updateHistory(mockedRoom.id, [mockPinConfigurationMessage]);
				});

				const store: RootStore = useStore.getState();
				store.newMessage(mockedTextMessage);
				const { user } = setup(
					<Chat
						roomId={mockedRoom.id}
						conversationView={ConversationView.CHAT}
						setConversationView={vi.fn()}
					/>
				);

				await user.hover(screen.getByText(mockedTextMessage.text));
				const dropdown = screen.getByTestId(iconDropdown);
				await user.click(dropdown);
				await user.click(screen.getByText(dropdownPinMessageOption));
				await user.click(screen.getByTestId('icon: Close'));
				expect(screen.getByText(/you unpinned a message/i)).toBeVisible();
			});
		});

		it('should remove the pin if its message is deleted', async () => {
			const mockedTextMessage = createMockTextMessage({
				id: 'idSimpleTextMessage',
				roomId: mockedRoom.id
			});

			const store: RootStore = useStore.getState();
			store.newMessage(mockedTextMessage);
			store.setReferenceMessage(mockedRoom.id, {
				messageId: mockedTextMessage.id,
				senderId: mockedTextMessage.from,
				stanzaId: mockedTextMessage.stanzaId,
				actionType: messageActionType.EDIT
			});

			const { user } = setup(
				<Chat
					roomId={mockedRoom.id}
					conversationView={ConversationView.CHAT}
					setConversationView={vi.fn()}
				/>
			);

			await user.hover(screen.getByText(mockedTextMessage.text));
			await user.click(screen.getByTestId(iconDropdown));
			await user.click(screen.getByText(dropdownPinMessageOption));
			await user.click(screen.getByTestId(iconDropdown));
			await user.click(screen.getByText(/delete for all/i));
			expect(screen.queryByTestId(pinSectionDataTestId)).not.toBeInTheDocument();
		});

		describe('Edit', async () => {
			it('should pin the edited message', async () => {
				const mockedTextMessage = createMockTextMessage({
					id: 'idSimpleTextMessage',
					roomId: mockedRoom.id
				});

				const store: RootStore = useStore.getState();
				store.newMessage(mockedTextMessage);

				const updatedText = 'updated text';

				const { user } = setup(
					<Chat
						roomId={mockedRoom.id}
						conversationView={ConversationView.CHAT}
						setConversationView={vi.fn()}
					/>
				);

				await user.hover(screen.getByText(mockedTextMessage.text));
				const dropdown = screen.getByTestId(iconDropdown);
				await user.click(dropdown);
				await user.click(screen.getByText(/edit/i));
				await user.type(screen.getByRole('textbox'), updatedText);
				await user.click(screen.getByRole(sendMessageIcon));
				await user.click(dropdown);
				await user.click(screen.getByText(dropdownPinMessageOption));
				expect(
					within(screen.getByTestId(pinSectionDataTestId)).getByText(updatedText)
				).toBeVisible();
			});

			it('should edit the pin message', async () => {
				const mockedTextMessage = createMockTextMessage({
					id: 'idSimpleTextMessage',
					roomId: mockedRoom.id
				});

				const store: RootStore = useStore.getState();
				store.newMessage(mockedTextMessage);

				const updatedText = 'updated text';

				const { user } = setup(
					<Chat
						roomId={mockedRoom.id}
						conversationView={ConversationView.CHAT}
						setConversationView={vi.fn()}
					/>
				);

				await user.hover(screen.getByText(mockedTextMessage.text));
				const dropdown = screen.getByTestId(iconDropdown);
				await user.click(dropdown);
				await user.click(screen.getByText(dropdownPinMessageOption));
				await user.click(dropdown);
				await user.click(screen.getByText(/edit/i));
				await user.type(screen.getByRole('textbox'), updatedText);
				await user.click(screen.getByRole(sendMessageIcon));
				expect(
					within(screen.getByTestId(pinSectionDataTestId)).getByText(updatedText)
				).toBeVisible();
			});

			it.todo('should edit the edited pin message');

			it('should edit the pin message and maintain the attachment', async () => {
				const mockedTextMsgWithAttachment = createMockTextMessage({
					id: 'idSimpleTextMessage',
					roomId: mockedRoom.id,
					attachment: {
						id: 'attachmentId',
						name: 'file_name',
						mimeType: 'image/png',
						size: 1661441294393
					}
				});

				const store: RootStore = useStore.getState();
				store.newMessage(mockedTextMsgWithAttachment);

				const updatedText = 'updated text';

				const { user } = setup(
					<Chat
						roomId={mockedRoom.id}
						conversationView={ConversationView.CHAT}
						setConversationView={vi.fn()}
					/>
				);

				await user.hover(screen.getByText(mockedTextMsgWithAttachment.text));
				const dropdown = screen.getByTestId(iconDropdown);
				await user.click(dropdown);
				await user.click(screen.getByText(/edit/i));
				await user.type(screen.getByRole('textbox'), updatedText);
				await user.click(screen.getByRole(sendMessageIcon));
				expect(
					within(screen.getByTestId(pinSectionDataTestId)).getByText(updatedText)
				).toBeVisible();
				expect(
					within(screen.getByTestId(pinSectionDataTestId)).getByTestId('hover-container')
				).toBeVisible();
			});
		});
	});
});
