/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { act, renderHook } from '@testing-library/react';

import { usePinMessage } from './usePinMessage';
import { xmppClient } from '../network/xmpp/XMPPClient';
import useStore from '../store/Store';
import {
	createMockMember,
	createMockRoom,
	createMockTextMessage,
	createMockUser
} from '../tests/createMock';
import { ProvidersWrapper } from '../tests/test-utils';
import { RoomType } from '../types/store/RoomTypes';

const user1 = createMockUser({ id: 'user1', name: 'user1' });
const user2 = createMockUser({ id: 'user2', name: 'user2' });

beforeEach(() => {
	const store = useStore.getState();
	store.setLoginInfo({ id: user1.id, name: 'user1' });
	store.setUserInfo([user1, user2]);
});

describe('usePinMessage', () => {
	describe('canMessageBePinned', () => {
		it('should return true for ONE_TO_ONE room', () => {
			const room = createMockRoom({
				id: 'oneToOneRoom',
				type: RoomType.ONE_TO_ONE,
				members: [
					createMockMember({ userId: user1.id, owner: false }),
					createMockMember({ userId: user2.id, owner: false })
				]
			});
			const message = createMockTextMessage({
				id: 'messageId',
				roomId: room.id
			});

			const store = useStore.getState();
			store.addRooms([room]);
			store.newMessage(message);

			const { result } = renderHook(() => usePinMessage(message), {
				wrapper: ProvidersWrapper
			});

			expect(result.current.canMessageBePinned).toBe(true);
		});

		it('should return true for GROUP room if user is owner/moderator', () => {
			const room = createMockRoom({
				id: 'groupRoom',
				type: RoomType.GROUP,
				members: [
					createMockMember({ userId: user1.id, owner: true }),
					createMockMember({ userId: user2.id, owner: false })
				]
			});
			const message = createMockTextMessage({
				id: 'messageId',
				roomId: room.id
			});

			const store = useStore.getState();
			store.addRooms([room]);
			store.newMessage(message);

			const { result } = renderHook(() => usePinMessage(message), {
				wrapper: ProvidersWrapper
			});

			expect(result.current.canMessageBePinned).toBe(true);
		});

		it('should return false for GROUP room if user is not owner/moderator', () => {
			const room = createMockRoom({
				id: 'groupRoom',
				type: RoomType.GROUP,
				members: [
					createMockMember({ userId: user1.id, owner: false }),
					createMockMember({ userId: user2.id, owner: true })
				]
			});
			const message = createMockTextMessage({
				id: 'messageId',
				roomId: room.id
			});

			const store = useStore.getState();
			store.addRooms([room]);
			store.newMessage(message);

			const { result } = renderHook(() => usePinMessage(message), {
				wrapper: ProvidersWrapper
			});

			expect(result.current.canMessageBePinned).toBe(false);
		});
	});

	describe('isMessagePinned', () => {
		it('should return false when no message is pinned', () => {
			const room = createMockRoom({
				id: 'roomId',
				type: RoomType.ONE_TO_ONE,
				members: [createMockMember({ userId: user1.id })]
			});
			const message = createMockTextMessage({
				id: 'messageId',
				stanzaId: 'stanzaId1',
				roomId: room.id
			});

			const store = useStore.getState();
			store.addRooms([room]);
			store.newMessage(message);

			const { result } = renderHook(() => usePinMessage(message), {
				wrapper: ProvidersWrapper
			});

			expect(result.current.isMessagePinned).toBe(false);
		});

		it('should return true when the message is pinned', () => {
			const room = createMockRoom({
				id: 'roomId',
				type: RoomType.ONE_TO_ONE,
				members: [createMockMember({ userId: user1.id })]
			});
			const message = createMockTextMessage({
				id: 'messageId',
				stanzaId: 'stanzaId1',
				roomId: room.id
			});

			const store = useStore.getState();
			store.addRooms([room]);
			store.newMessage(message);
			store.setPinnedMessage(room.id, message);

			const { result } = renderHook(() => usePinMessage(message), {
				wrapper: ProvidersWrapper
			});

			expect(result.current.isMessagePinned).toBe(true);
		});

		it('should return true when an edited message is pinned using editedStanzaId', () => {
			const room = createMockRoom({
				id: 'roomId',
				type: RoomType.ONE_TO_ONE,
				members: [createMockMember({ userId: user1.id })]
			});
			const editedMessage = createMockTextMessage({
				id: 'messageId',
				stanzaId: 'originalStanzaId',
				editedStanzaId: 'editedStanzaId',
				edited: true,
				roomId: room.id
			});

			const store = useStore.getState();
			store.addRooms([room]);
			store.newMessage(editedMessage);
			store.setPinnedMessage(room.id, editedMessage);

			const { result } = renderHook(() => usePinMessage(editedMessage), {
				wrapper: ProvidersWrapper
			});

			expect(result.current.isMessagePinned).toBe(true);
		});

		it('should return false when a different message is pinned', () => {
			const room = createMockRoom({
				id: 'roomId',
				type: RoomType.ONE_TO_ONE,
				members: [createMockMember({ userId: user1.id })]
			});
			const message1 = createMockTextMessage({
				id: 'messageId1',
				stanzaId: 'stanzaId1',
				roomId: room.id
			});
			const message2 = createMockTextMessage({
				id: 'messageId2',
				stanzaId: 'stanzaId2',
				roomId: room.id
			});

			const store = useStore.getState();
			store.addRooms([room]);
			store.newMessage(message1);
			store.newMessage(message2);
			store.setPinnedMessage(room.id, message1);

			const { result } = renderHook(() => usePinMessage(message2), {
				wrapper: ProvidersWrapper
			});

			expect(result.current.isMessagePinned).toBe(false);
		});
	});

	describe('pinActionLabel', () => {
		it('should return "Pin message" when message is not pinned', () => {
			const room = createMockRoom({
				id: 'roomId',
				type: RoomType.ONE_TO_ONE,
				members: [createMockMember({ userId: user1.id })]
			});
			const message = createMockTextMessage({
				id: 'messageId',
				roomId: room.id
			});

			const store = useStore.getState();
			store.addRooms([room]);
			store.newMessage(message);

			const { result } = renderHook(() => usePinMessage(message), {
				wrapper: ProvidersWrapper
			});

			expect(result.current.pinActionLabel).toBe('Pin message');
		});

		it('should return "Unpin message" when message is pinned', () => {
			const room = createMockRoom({
				id: 'roomId',
				type: RoomType.ONE_TO_ONE,
				members: [createMockMember({ userId: user1.id })]
			});
			const message = createMockTextMessage({
				id: 'messageId',
				roomId: room.id
			});

			const store = useStore.getState();
			store.addRooms([room]);
			store.newMessage(message);
			store.setPinnedMessage(room.id, message);

			const { result } = renderHook(() => usePinMessage(message), {
				wrapper: ProvidersWrapper
			});

			expect(result.current.pinActionLabel).toBe('Unpin message');
		});
	});

	describe('pinAction', () => {
		it('should call pinMessage when message is not pinned and no other message is pinned', () => {
			const room = createMockRoom({
				id: 'roomId',
				type: RoomType.ONE_TO_ONE,
				members: [createMockMember({ userId: user1.id })]
			});
			const message = createMockTextMessage({
				id: 'messageId',
				stanzaId: 'stanzaId1',
				roomId: room.id
			});

			const store = useStore.getState();
			store.addRooms([room]);
			store.newMessage(message);

			const pinMessageSpy = vi.spyOn(xmppClient, 'pinMessage');

			const { result } = renderHook(() => usePinMessage(message), {
				wrapper: ProvidersWrapper
			});

			act(() => {
				result.current.pinAction();
			});

			expect(pinMessageSpy).toHaveBeenCalledWith(room.id, message.stanzaId);
		});

		it('should call unpinMessage when message is already pinned', () => {
			const room = createMockRoom({
				id: 'roomId',
				type: RoomType.ONE_TO_ONE,
				members: [createMockMember({ userId: user1.id })]
			});
			const message = createMockTextMessage({
				id: 'messageId',
				stanzaId: 'stanzaId1',
				roomId: room.id
			});

			const store = useStore.getState();
			store.addRooms([room]);
			store.newMessage(message);
			store.setPinnedMessage(room.id, message);

			const unpinMessageSpy = vi.spyOn(xmppClient, 'unpinMessage');

			const { result } = renderHook(() => usePinMessage(message), {
				wrapper: ProvidersWrapper
			});

			act(() => {
				result.current.pinAction();
			});

			expect(unpinMessageSpy).toHaveBeenCalledWith(room.id, message.stanzaId);
		});

		it('should use editedStanzaId for pinning when message is edited', () => {
			const room = createMockRoom({
				id: 'roomId',
				type: RoomType.ONE_TO_ONE,
				members: [createMockMember({ userId: user1.id })]
			});
			const editedMessage = createMockTextMessage({
				id: 'messageId',
				stanzaId: 'originalStanzaId',
				editedStanzaId: 'editedStanzaId',
				edited: true,
				roomId: room.id
			});

			const store = useStore.getState();
			store.addRooms([room]);
			store.newMessage(editedMessage);

			const pinMessageSpy = vi.spyOn(xmppClient, 'pinMessage');

			const { result } = renderHook(() => usePinMessage(editedMessage), {
				wrapper: ProvidersWrapper
			});

			act(() => {
				result.current.pinAction();
			});

			expect(pinMessageSpy).toHaveBeenCalledWith(room.id, editedMessage.editedStanzaId);
		});

		it('should use original stanzaId for edited message when editedStanzaId is not present', () => {
			const room = createMockRoom({
				id: 'roomId',
				type: RoomType.ONE_TO_ONE,
				members: [createMockMember({ userId: user1.id })]
			});
			const editedMessage = createMockTextMessage({
				id: 'messageId',
				stanzaId: 'originalStanzaId',
				edited: true,
				roomId: room.id
			});

			const store = useStore.getState();
			store.addRooms([room]);
			store.newMessage(editedMessage);

			const pinMessageSpy = vi.spyOn(xmppClient, 'pinMessage');

			const { result } = renderHook(() => usePinMessage(editedMessage), {
				wrapper: ProvidersWrapper
			});

			act(() => {
				result.current.pinAction();
			});

			expect(pinMessageSpy).toHaveBeenCalledWith(room.id, editedMessage.stanzaId);
		});

		it('should not call pinMessage directly when trying to pin a message when another message is already pinned', () => {
			const room = createMockRoom({
				id: 'roomId',
				type: RoomType.ONE_TO_ONE,
				members: [createMockMember({ userId: user1.id })]
			});
			const pinnedMessage = createMockTextMessage({
				id: 'pinnedMessageId',
				stanzaId: 'pinnedStanzaId',
				roomId: room.id
			});
			const newMessage = createMockTextMessage({
				id: 'newMessageId',
				stanzaId: 'newStanzaId',
				roomId: room.id
			});

			const store = useStore.getState();
			store.addRooms([room]);
			store.newMessage(pinnedMessage);
			store.newMessage(newMessage);
			store.setPinnedMessage(room.id, pinnedMessage);

			const { result } = renderHook(() => usePinMessage(newMessage), {
				wrapper: ProvidersWrapper
			});

			const pinMessageSpy = vi.spyOn(xmppClient, 'pinMessage');

			act(() => {
				result.current.pinAction();
			});

			expect(pinMessageSpy).not.toHaveBeenCalled();
		});
	});
});
