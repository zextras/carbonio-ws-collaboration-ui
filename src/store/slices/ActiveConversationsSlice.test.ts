/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import {
	createMockMember,
	createMockMessageFastening,
	createMockRoom,
	createMockTextMessage,
	createMockUser
} from '../../tests/createMock';
import { messageActionType } from '../../types/store/ActiveConversationTypes';
import { FasteningAction } from '../../types/store/ChatsRegistryTypes';
import useStore from '../Store';

const sessionUser = createMockUser({ id: 'sessionUserId', name: 'sessionUserName' });

const mockedUser0 = createMockMember({ userId: 'user0' });
const mockedUser1 = createMockMember({ userId: 'user1' });

const mockedRoom = createMockRoom({
	members: [createMockMember({ userId: sessionUser.id }), mockedUser0, mockedUser1]
});

beforeEach(() => {
	const store = useStore.getState();
	store.setLoginInfo({ id: sessionUser.id, name: sessionUser.name });
	store.addRooms([mockedRoom]);
});

describe('Active conversations slice', () => {
	test('setScrollPosition', () => {
		useStore.getState().setScrollPosition(mockedRoom.id, 'messageId');
		expect(useStore.getState().activeConversations[mockedRoom.id].scrollPositionMessageId).toBe(
			'messageId'
		);
	});

	describe('inputHasFocus', () => {
		test('setInputHasFocus', () => {
			useStore.getState().setInputHasFocus(mockedRoom.id, true);
			expect(useStore.getState().activeConversations[mockedRoom.id].inputHasFocus).toBe(true);
		});

		test('setInputHasFocus to false', () => {
			useStore.getState().setInputHasFocus(mockedRoom.id, false);
			expect(useStore.getState().activeConversations[mockedRoom.id].inputHasFocus).toBe(false);
		});

		test('remove new reaction when input has focus', () => {
			const message = createMockTextMessage({
				roomId: mockedRoom.id,
				from: sessionUser.id
			});
			const store = useStore.getState();
			store.newMessage(message);
			useStore.getState().setNewReaction(mockedRoom.id, message.stanzaId, '👍', mockedUser0.userId);
			expect(useStore.getState().activeConversations[mockedRoom.id].newReactions).toHaveLength(1);
			useStore.getState().setInputHasFocus(mockedRoom.id, true);
			expect(useStore.getState().activeConversations[mockedRoom.id].newReactions).toBeUndefined();
		});
	});

	describe('isWritingList', () => {
		test('User starts to write', () => {
			useStore.getState().setIsWriting(mockedRoom.id, mockedUser0.userId, true);
			const writingList = useStore.getState().activeConversations[mockedRoom.id].isWritingList;
			expect(writingList?.length).toBe(1);
			expect(writingList?.[0]).toBe(mockedUser0.userId);

			// User stops and start to write again
			useStore.getState().setIsWriting(mockedRoom.id, mockedUser1.userId, false);
			useStore.getState().setIsWriting(mockedRoom.id, mockedUser0.userId, true);
			const writingList2 = useStore.getState().activeConversations[mockedRoom.id].isWritingList;
			expect(writingList2?.length).toBe(1);
			expect(writingList2?.[0]).toBe(mockedUser0.userId);
		});

		test('More that one user start to write', () => {
			// Two users start to write
			useStore.getState().setIsWriting(mockedRoom.id, mockedUser0.userId, true);
			useStore.getState().setIsWriting(mockedRoom.id, mockedUser1.userId, true);
			const writingList = useStore.getState().activeConversations[mockedRoom.id].isWritingList;
			expect(writingList?.length).toBe(2);

			// User0 stops and start to write again
			useStore.getState().setIsWriting(mockedRoom.id, mockedUser0.userId, false);
			const writingList2 = useStore.getState().activeConversations[mockedRoom.id].isWritingList;
			expect(writingList2?.length).toBe(1);

			// User0 starts to write again
			useStore.getState().setIsWriting(mockedRoom.id, mockedUser0.userId, true);
			const writingList3 = useStore.getState().activeConversations[mockedRoom.id].isWritingList;
			expect(writingList3?.length).toBe(2);
		});

		test('User continue to write', () => {
			useStore.getState().setIsWriting(mockedRoom.id, mockedUser0.userId, true);
			setTimeout(() => {
				useStore.getState().setIsWriting(mockedRoom.id, mockedUser0.userId, true);
				expect(useStore.getState().activeConversations[mockedRoom.id].isWritingList?.length).toBe(
					1
				);
			}, 1000);
		});

		test('Receive a stop after user stopped to write', () => {
			useStore.getState().setIsWriting(mockedRoom.id, mockedUser0.userId, true);
			useStore.getState().setIsWriting(mockedRoom.id, mockedUser0.userId, false);
			useStore.getState().setIsWriting(mockedRoom.id, mockedUser0.userId, false);
			expect(useStore.getState().activeConversations[mockedRoom.id].isWritingList?.length).toBe(0);
		});
	});

	describe('referenceMessages', () => {
		test('Set reference message', () => {
			const message = createMockTextMessage({
				roomId: mockedRoom.id,
				from: sessionUser.id
			});
			const reference = {
				messageId: message.id,
				senderId: sessionUser.id,
				stanzaId: message.stanzaId,
				actionType: messageActionType.REPLY
			};
			useStore.getState().setReferenceMessage(mockedRoom.id, reference);
			expect(useStore.getState().activeConversations[mockedRoom.id].referenceMessage).toStrictEqual(
				{
					roomId: mockedRoom.id,
					...reference
				}
			);
		});

		test('Unset reference message', () => {
			const message = createMockTextMessage({
				roomId: mockedRoom.id,
				from: sessionUser.id
			});
			const reference = {
				messageId: message.id,
				senderId: sessionUser.id,
				stanzaId: message.stanzaId,
				actionType: messageActionType.REPLY
			};
			useStore.getState().setReferenceMessage(mockedRoom.id, reference);
			useStore.getState().unsetReferenceMessage(mockedRoom.id);
			expect(
				useStore.getState().activeConversations[mockedRoom.id].referenceMessage
			).toBeUndefined();
		});
	});

	describe('draftMessage', () => {
		test('Set draft message', () => {
			const message = 'Draft message';
			useStore.getState().setDraftMessage(mockedRoom.id, message);
			expect(useStore.getState().activeConversations[mockedRoom.id].draftMessage?.text).toBe(
				message
			);
		});

		test('Unset draft message', () => {
			const message = 'Draft message';
			useStore.getState().setDraftMessage(mockedRoom.id, message);
			useStore.getState().setDraftMessage(mockedRoom.id);
			expect(useStore.getState().activeConversations[mockedRoom.id].draftMessage).toBeUndefined();
		});
	});

	describe('infoPanelStatus', () => {
		test('Set actions accordion status to true', () => {
			useStore.getState().setActionsAccordionStatus(mockedRoom.id, true);
			expect(
				useStore.getState().activeConversations[mockedRoom.id].infoPanelStatus
					.actionsAccordionIsOpened
			).toBe(true);
		});

		test('Set actions accordion status to false', () => {
			useStore.getState().setActionsAccordionStatus(mockedRoom.id, true);
			useStore.getState().setActionsAccordionStatus(mockedRoom.id, false);
			expect(
				useStore.getState().activeConversations[mockedRoom.id].infoPanelStatus
					.actionsAccordionIsOpened
			).toBe(false);
		});

		test('Set participants accordion status to true', () => {
			useStore.getState().setParticipantsAccordionStatus(mockedRoom.id, true);
			expect(
				useStore.getState().activeConversations[mockedRoom.id].infoPanelStatus
					.participantsAccordionIsOpened
			).toBe(true);
		});

		test('Set participants accordion status to false', () => {
			useStore.getState().setParticipantsAccordionStatus(mockedRoom.id, true);
			useStore.getState().setParticipantsAccordionStatus(mockedRoom.id, false);
			expect(
				useStore.getState().activeConversations[mockedRoom.id].infoPanelStatus
					.participantsAccordionIsOpened
			).toBe(false);
		});
	});

	describe('filesToAttach', () => {
		test('Add files to attach', () => {
			const file = new File([''], 'file.txt');
			const files = [{ file, fileId: 'fileId', localUrl: URL.createObjectURL(file) }];
			useStore.getState().addFilesToAttach(mockedRoom.id, files);
			expect(useStore.getState().activeConversations[mockedRoom.id].filesToAttach).toEqual(files);
		});

		test('Remove files to attach', () => {
			const file = new File([''], 'file.txt');
			const files = [{ file, fileId: 'fileId', localUrl: URL.createObjectURL(file) }];
			useStore.getState().addFilesToAttach(mockedRoom.id, files);
			useStore.getState().removeFilesToAttach(mockedRoom.id, 'fileId');
			expect(useStore.getState().activeConversations[mockedRoom.id].filesToAttach).toEqual([]);
		});
	});

	describe('New reactions', () => {
		test('Set new reaction from another user to session user message', () => {
			const message = createMockTextMessage({
				id: 'originalMessage-id',
				stanzaId: 'originalMessage-stanzaId',
				roomId: mockedRoom.id,
				from: sessionUser.id
			});
			const store = useStore.getState();
			store.newMessage(message);
			store.setNewReaction(mockedRoom.id, message.stanzaId, '👍', mockedUser0.userId);

			const { newReactions } = useStore.getState().activeConversations[mockedRoom.id];
			expect(newReactions).toHaveLength(1);
			expect(newReactions?.[0].reaction).toBe('👍');
		});

		test('Set and remove reaction from another user to session user message', () => {
			const message = createMockTextMessage({
				id: 'id',
				stanzaId: 'stanzaId',
				roomId: mockedRoom.id,
				from: sessionUser.id
			});
			const fastening = createMockMessageFastening({
				roomId: mockedRoom.id,
				action: FasteningAction.REACTION,
				originalStanzaId: message.stanzaId,
				from: mockedUser0.userId,
				value: '👍'
			});
			const store = useStore.getState();
			store.newMessage(message);
			store.addFastening([fastening]);
			store.setNewReaction(
				fastening.roomId,
				fastening.originalStanzaId,
				fastening.value || '',
				fastening.from
			);
			store.setNewReaction(fastening.roomId, fastening.originalStanzaId, '', fastening.from);

			const { newReactions } = useStore.getState().activeConversations[mockedRoom.id];
			expect(newReactions).toHaveLength(0);
		});

		test('Set new reaction from another user to other user message', () => {
			const message = createMockTextMessage({
				id: 'originalMessage-id',
				stanzaId: 'originalMessage-stanzaId',
				roomId: mockedRoom.id,
				from: mockedUser1.userId
			});
			const store = useStore.getState();
			store.newMessage(message);
			store.setNewReaction(mockedRoom.id, message.stanzaId, '👍', mockedUser0.userId);

			expect(
				useStore.getState().activeConversations?.[mockedRoom.id]?.newReactions
			).toBeUndefined();
		});

		test('unsetNewReactions clears all reactions', () => {
			const message = createMockTextMessage({
				roomId: mockedRoom.id,
				from: sessionUser.id
			});
			const store = useStore.getState();
			store.newMessage(message);
			store.setNewReaction(mockedRoom.id, message.stanzaId, '👍', mockedUser0.userId);
			expect(useStore.getState().activeConversations[mockedRoom.id].newReactions).toHaveLength(1);
			useStore.getState().unsetNewReactions(mockedRoom.id);
			expect(useStore.getState().activeConversations[mockedRoom.id].newReactions).toBeUndefined();
		});
	});
});
