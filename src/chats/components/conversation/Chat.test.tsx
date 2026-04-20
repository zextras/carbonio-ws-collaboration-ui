/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { now } from 'moment';

import Chat from './Chat';
import { ConversationView } from './Conversation';
import { xmppClient } from '../../../network/xmpp/XMPPClient';
import useStore from '../../../store/Store';
import {
	createMockAttributesList,
	createMockConfigurationMessage,
	createMockMember,
	createMockMessageFastening,
	createMockRoom,
	createMockTextMessage,
	createMockUser
} from '../../../tests/createMock';
import { screen, setup, within } from '../../../tests/test-utils';
import { RoomBe, RoomType } from '../../../types/network/models/roomBeTypes';
import {
	FasteningAction,
	OperationType,
	TextMessage
} from '../../../types/store/ChatsRegistryTypes';
import { RootStore } from '../../../types/store/StoreTypes';
import { dateToTimestamp } from '../../../utils/dateUtils';

const user1 = createMockUser({ id: 'user1', name: 'user1' });
const mockedRoom: RoomBe = createMockRoom({
	id: 'roomTest',
	type: RoomType.ONE_TO_ONE,
	members: [createMockMember({ userId: user1.id, owner: true })]
});

beforeEach(() => {
	const store = useStore.getState();
	store.setLoginInfo({ id: user1.id, name: 'user1' });
	store.setUserInfo([user1]);
	store.addRooms([mockedRoom]);
});

describe('Chat', () => {
	const iconDropdown = 'icon: ArrowIosDownward';
	const pinSectionDataTestId = 'pin-message';
	const dropdownPinMessageOption = /pin message/i;
	const sendMessageIcon = 'icon: Navigation2';
	const replaceLabel = /replace pinned message/i;

	describe('Pin message', () => {
		it('should not show pin option when feature is not supported', async () => {
			const mockedTextMessage = createMockTextMessage({
				id: 'idSimpleTextMessage',
				roomId: mockedRoom.id
			});

			const store: RootStore = useStore.getState();
			store.newMessage(mockedTextMessage);
			xmppClient.features = [];

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
			expect(screen.queryByText(dropdownPinMessageOption)).not.toBeInTheDocument();
		});

		it('should pin the message', async () => {
			const mockedTextMessage = createMockTextMessage({
				id: 'idSimpleTextMessage',
				roomId: mockedRoom.id
			});

			const store: RootStore = useStore.getState();
			store.newMessage(mockedTextMessage);

			// Mock xmppClient.pinMessage to update the store
			vi.spyOn(xmppClient, 'pinMessage').mockImplementation(() => {
				store.setPinnedMessage(mockedRoom.id, mockedTextMessage);
			});

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

		it('should show confirmation modal when trying to replace a pinned message', async () => {
			const firstMessage = createMockTextMessage({
				id: 'firstMessageId',
				stanzaId: 'firstStanzaId',
				roomId: mockedRoom.id,
				text: 'First message'
			});
			const secondMessage = createMockTextMessage({
				id: 'secondMessageId',
				stanzaId: 'secondStanzaId',
				roomId: mockedRoom.id,
				text: 'Second message'
			});

			const store: RootStore = useStore.getState();
			store.newMessage(firstMessage);
			store.newMessage(secondMessage);
			store.setPinnedMessage(mockedRoom.id, firstMessage);

			// Mock xmppClient.pinMessage to update the store with the new pinned message
			vi.spyOn(xmppClient, 'pinMessage').mockImplementation((_roomId, stanzaId) => {
				if (stanzaId === secondMessage.stanzaId) {
					store.setPinnedMessage(mockedRoom.id, secondMessage);
				}
			});

			const { user } = setup(
				<Chat
					roomId={mockedRoom.id}
					conversationView={ConversationView.CHAT}
					setConversationView={vi.fn()}
				/>
			);

			expect(
				within(screen.getByTestId(pinSectionDataTestId)).getByText(firstMessage.text)
			).toBeVisible();
			const secondBubble = screen.getByTestId(`Bubble-${secondMessage.id}`);
			await user.hover(within(secondBubble).getByText(secondMessage.text));
			const dropdown = within(secondBubble).getByTestId(iconDropdown);
			await user.click(dropdown);
			await user.click(screen.getByText(dropdownPinMessageOption));
			expect(screen.getByText(replaceLabel)).toBeVisible();
			expect(screen.getByText(/This conversation already has a pinned message/i)).toBeVisible();
			await user.click(screen.getByRole('button', { name: /Replace pin/i }));
			expect(
				within(screen.getByTestId(pinSectionDataTestId)).getByText(secondMessage.text)
			).toBeVisible();
		});

		it('should cancel replacing pin when clicking cancel in modal', async () => {
			const firstMessage = createMockTextMessage({
				id: 'firstMessageId',
				stanzaId: 'firstStanzaId',
				roomId: mockedRoom.id,
				text: 'First message'
			});
			const secondMessage = createMockTextMessage({
				id: 'secondMessageId',
				stanzaId: 'secondStanzaId',
				roomId: mockedRoom.id,
				text: 'Second message'
			});

			const store: RootStore = useStore.getState();
			store.newMessage(firstMessage);
			store.newMessage(secondMessage);
			store.setPinnedMessage(mockedRoom.id, firstMessage);

			const pinMessageSpy = vi.spyOn(xmppClient, 'pinMessage');

			const { user } = setup(
				<Chat
					roomId={mockedRoom.id}
					conversationView={ConversationView.CHAT}
					setConversationView={vi.fn()}
				/>
			);

			expect(
				within(screen.getByTestId(pinSectionDataTestId)).getByText(firstMessage.text)
			).toBeVisible();
			const secondBubble = screen.getByTestId(`Bubble-${secondMessage.id}`);
			await user.hover(within(secondBubble).getByText(secondMessage.text));
			const dropdown = within(secondBubble).getByTestId(iconDropdown);
			await user.click(dropdown);
			await user.click(screen.getByText(dropdownPinMessageOption));

			expect(screen.getByText(replaceLabel)).toBeVisible();
			await user.click(screen.getByText(/cancel/i));
			expect(screen.queryByText(replaceLabel)).not.toBeInTheDocument();
			expect(pinMessageSpy).not.toHaveBeenCalled();
			expect(
				within(screen.getByTestId(pinSectionDataTestId)).getByText(firstMessage.text)
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

				// Mock xmppClient.pinMessage and unpinMessage to update the store
				vi.spyOn(xmppClient, 'pinMessage').mockImplementation(() => {
					store.setPinnedMessage(mockedRoom.id, mockedTextMessage);
				});
				vi.spyOn(xmppClient, 'unpinMessage').mockImplementation(() => {
					store.removePinnedMessage(mockedRoom.id);
				});

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

				// Mock xmppClient.pinMessage and unpinMessage to update the store
				vi.spyOn(xmppClient, 'pinMessage').mockImplementation(() => {
					store.setPinnedMessage(mockedRoom.id, mockedTextMessage);
				});
				vi.spyOn(xmppClient, 'unpinMessage').mockImplementation(() => {
					store.removePinnedMessage(mockedRoom.id);
				});

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
				await user.click(screen.getByTestId('icon: Unpin3'));
				expect(screen.queryByTestId(pinSectionDataTestId)).not.toBeInTheDocument();
			});
		});

		describe('Configuration message', () => {
			it('should render the pin configuration message', async () => {
				const mockedTextMessage = createMockTextMessage({
					id: 'idSimpleTextMessage',
					roomId: mockedRoom.id
				});

				const store: RootStore = useStore.getState();
				store.newMessage(mockedTextMessage);

				// Mock xmppClient.pinMessage to update the store
				vi.spyOn(xmppClient, 'pinMessage').mockImplementation(() => {
					store.setPinnedMessage(mockedRoom.id, mockedTextMessage);
					store.newMessage(
						createMockConfigurationMessage({
							roomId: mockedRoom.id,
							operation: OperationType.MESSAGE_PINNED,
							from: user1.id
						})
					);
				});

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

				const store: RootStore = useStore.getState();
				store.newMessage(mockedTextMessage);
				store.newMessage(mockPinConfigurationMessage);

				// Mock xmppClient.pinMessage and unpinMessage to update the store
				vi.spyOn(xmppClient, 'pinMessage').mockImplementation(() => {
					store.setPinnedMessage(mockedRoom.id, mockedTextMessage);
					store.newMessage(
						createMockConfigurationMessage({
							id: 'pinConfigMsg',
							roomId: mockedRoom.id,
							operation: OperationType.MESSAGE_PINNED,
							from: user1.id
						})
					);
				});
				vi.spyOn(xmppClient, 'unpinMessage').mockImplementation(() => {
					store.removePinnedMessage(mockedRoom.id);
					store.newMessage(
						createMockConfigurationMessage({
							id: 'unpinConfigMsg',
							roomId: mockedRoom.id,
							operation: OperationType.MESSAGE_UNPINNED,
							from: user1.id
						})
					);
				});

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
				await user.click(screen.getByTestId('icon: Unpin3'));
				expect(screen.getByText(/you unpinned a message/i)).toBeVisible();
			});
		});

		it('should remove the pin if its message is deleted', async () => {
			const mockedTextMessage = createMockTextMessage({
				id: 'idSimpleTextMessage',
				roomId: mockedRoom.id,
				text: 'message to delete',
				from: user1.id,
				date: dateToTimestamp(now())
			});

			const store: RootStore = useStore.getState();
			store.newMessage(mockedTextMessage);
			store.setAttributes(createMockAttributesList({ carbonioWscMessageDeleteTimeLimit: '5m' }));

			// Mock xmppClient.pinMessage and sendChatMessageDeletion to update the store
			vi.spyOn(xmppClient, 'pinMessage').mockImplementation(() => {
				store.setPinnedMessage(mockedRoom.id, mockedTextMessage);
			});
			vi.spyOn(xmppClient, 'sendChatMessageDeletion').mockImplementation(() => {
				store.removePinnedMessage(mockedRoom.id);
			});

			const { user } = setup(
				<Chat
					roomId={mockedRoom.id}
					conversationView={ConversationView.CHAT}
					setConversationView={vi.fn()}
				/>
			);

			const messageBubble = screen.getByTestId(`Bubble-${mockedTextMessage.id}`);
			await user.hover(within(messageBubble).getByText(mockedTextMessage.text));
			await user.click(screen.getByTestId(iconDropdown));
			await user.click(screen.getByText(dropdownPinMessageOption));
			await user.click(screen.getByTestId(iconDropdown));
			await user.click(screen.getByText(/delete for all/i));
			expect(screen.queryByTestId(pinSectionDataTestId)).not.toBeInTheDocument();
		});

		describe('Edit', async () => {
			it('should pin the edited message', async () => {
				const editedText = 'edited message text';
				const mockedTextMessage = createMockTextMessage({
					id: 'idSimpleTextMessage',
					roomId: mockedRoom.id,
					from: user1.id,
					date: dateToTimestamp(now()),
					text: editedText,
					edited: true
				});

				const store: RootStore = useStore.getState();
				store.newMessage(mockedTextMessage);

				// Mock xmppClient.pinMessage to update the store
				vi.spyOn(xmppClient, 'pinMessage').mockImplementation(() => {
					store.setPinnedMessage(mockedRoom.id, mockedTextMessage);
				});

				const { user } = setup(
					<Chat
						roomId={mockedRoom.id}
						conversationView={ConversationView.CHAT}
						setConversationView={vi.fn()}
					/>
				);

				await user.hover(screen.getByText(editedText));
				const dropdown = screen.getByTestId(iconDropdown);
				await user.click(dropdown);
				await user.click(screen.getByText(dropdownPinMessageOption));
				expect(
					within(screen.getByTestId(pinSectionDataTestId)).getByText(editedText)
				).toBeVisible();
			});

			it('should edit the pin message', async () => {
				const mockedTextMessage = createMockTextMessage({
					id: 'idSimpleTextMessage',
					roomId: mockedRoom.id,
					from: user1.id,
					date: dateToTimestamp(now())
				});

				const store: RootStore = useStore.getState();
				store.newMessage(mockedTextMessage);
				store.setAttributes(createMockAttributesList({ carbonioWscMessageEditTimeLimit: '5m' }));

				// Mock xmppClient.pinMessage to update the store
				vi.spyOn(xmppClient, 'pinMessage').mockImplementation(() => {
					store.setPinnedMessage(mockedRoom.id, mockedTextMessage);
				});

				// Mock xmppClient.sendChatMessageEdit to update the pinned message text
				vi.spyOn(xmppClient, 'sendChatMessageEdit').mockImplementation((_roomId, newText) => {
					const updatedMessage = { ...mockedTextMessage, text: newText, edited: true };
					store.setPinnedMessage(mockedRoom.id, updatedMessage);
				});

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
				await user.click(screen.getByTestId(sendMessageIcon));
				expect(
					within(screen.getByTestId(pinSectionDataTestId)).getByText(`Hi${updatedText}`)
				).toBeVisible();
			});

			it('should edit the edited pin message', async () => {
				const originalText = 'Hi';
				const firstModification = ' modified';
				const mockedEditedMessage = createMockTextMessage({
					id: 'idEditedMessage',
					roomId: mockedRoom.id,
					from: user1.id,
					date: dateToTimestamp(now()),
					text: `${originalText}${firstModification}`,
					edited: true,
					editedStanzaId: 'editedStanzaId1'
				});

				const store: RootStore = useStore.getState();
				store.newMessage(mockedEditedMessage);
				store.setAttributes(createMockAttributesList({ carbonioWscMessageEditTimeLimit: '5m' }));

				// Mock xmppClient.pinMessage to update the store
				vi.spyOn(xmppClient, 'pinMessage').mockImplementation(() => {
					store.setPinnedMessage(mockedRoom.id, mockedEditedMessage);
				});

				// Mock xmppClient.sendChatMessageEdit to update the pinned message text
				vi.spyOn(xmppClient, 'sendChatMessageEdit').mockImplementation((_roomId, newText) => {
					const updatedMessage = {
						...mockedEditedMessage,
						text: newText,
						edited: true,
						editedStanzaId: 'editedStanzaId2'
					};
					store.setPinnedMessage(mockedRoom.id, updatedMessage);
				});

				const secondModification = ' again';

				const { user } = setup(
					<Chat
						roomId={mockedRoom.id}
						conversationView={ConversationView.CHAT}
						setConversationView={vi.fn()}
					/>
				);

				await user.hover(screen.getByText(mockedEditedMessage.text));
				const dropdown = screen.getByTestId(iconDropdown);
				await user.click(dropdown);
				await user.click(screen.getByText(dropdownPinMessageOption));

				expect(
					within(screen.getByTestId(pinSectionDataTestId)).getByText(
						`${originalText}${firstModification}`
					)
				).toBeVisible();

				await user.click(dropdown);
				const editOptions = screen.getAllByText(/^Edit$/i);
				await user.click(editOptions[editOptions.length - 1]);
				await user.type(screen.getByRole('textbox'), secondModification);
				await user.click(screen.getByTestId(sendMessageIcon));

				expect(
					within(screen.getByTestId(pinSectionDataTestId)).getByText(
						`${originalText}${firstModification}${secondModification}`
					)
				).toBeVisible();
			});

			it('should edit the pin message and maintain the attachment', async () => {
				const mockedTextMsgWithAttachment = createMockTextMessage({
					id: 'idSimpleTextMessage',
					roomId: mockedRoom.id,
					from: user1.id,
					date: dateToTimestamp(now()),
					attachment: {
						id: 'attachmentId',
						name: 'file_name',
						mimeType: 'image/png',
						size: 1661441294393
					}
				});

				const store: RootStore = useStore.getState();
				store.newMessage(mockedTextMsgWithAttachment);
				store.setAttributes(createMockAttributesList({ carbonioWscMessageEditTimeLimit: '5m' }));

				const updatedText = 'updated text';

				// Mock xmppClient.sendChatMessageEdit to update the message via fastening
				vi.spyOn(xmppClient, 'sendChatMessageEdit').mockImplementation((_roomId, newText) => {
					const fastening = createMockMessageFastening({
						roomId: mockedRoom.id,
						originalStanzaId: mockedTextMsgWithAttachment.stanzaId,
						action: FasteningAction.EDIT,
						value: newText
					});
					store.addFastening([fastening]);
				});

				// Mock xmppClient.pinMessage to update the store with the edited message including attachment
				vi.spyOn(xmppClient, 'pinMessage').mockImplementation(() => {
					const editedMessage: TextMessage = {
						...mockedTextMsgWithAttachment,
						text: `Hi${updatedText}`,
						edited: true
					};
					store.setPinnedMessage(mockedRoom.id, editedMessage);
				});

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
				await user.click(screen.getByTestId(sendMessageIcon));
				await user.click(dropdown);
				await user.click(screen.getByText(dropdownPinMessageOption));
				expect(
					within(screen.getByTestId(pinSectionDataTestId)).getByText(`Hi${updatedText}`)
				).toBeVisible();
				expect(
					within(screen.getByTestId(pinSectionDataTestId)).getByTestId('icon: Image')
				).toBeVisible();
			});
		});
	});
});
