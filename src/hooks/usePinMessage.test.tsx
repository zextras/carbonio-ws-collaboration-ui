/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { act, renderHook } from '@testing-library/react';

import { usePinMessage } from './usePinMessage';
import { wscSdk } from '../network/sdk/wscSdk';
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

	describe('on a WSC-pure backend', () => {
		beforeEach(() => {
			useStore.getState().setApiVersion('2.0.0');
		});

		afterEach(() => {
			// The zustand store survives across tests: leave the version un-negotiated
			useStore.setState({ session: { ...useStore.getState().session, apiVersion: undefined } });
		});

		it('pins an edited message by its stable id, never by the synthetic e_… fastening id', () => {
			const room = createMockRoom({
				id: 'roomV2',
				type: RoomType.ONE_TO_ONE,
				members: [createMockMember({ userId: user1.id })]
			});
			// On v2 the edit projection exposes the synthetic fastening id as
			// editedStanzaId: it is no wire id and must never reach the PUT
			const editedMessage = createMockTextMessage({
				id: 'msg-e1',
				stanzaId: 'msg-e1',
				editedStanzaId: 'e_msg-e1_1754560000000',
				edited: true,
				roomId: room.id
			});

			const store = useStore.getState();
			store.addRooms([room]);
			store.newMessage(editedMessage);

			const pinSpy = vi.spyOn(wscSdk, 'pinMessage').mockResolvedValue(undefined);

			const { result } = renderHook(() => usePinMessage(editedMessage), {
				wrapper: ProvidersWrapper
			});

			act(() => {
				result.current.pinAction();
			});

			expect(pinSpy).toHaveBeenCalledWith(room.id, 'msg-e1');
		});

		it('matches the banner stub against the edited bubble (plain-id comparison)', () => {
			const room = createMockRoom({
				id: 'roomV2Stub',
				type: RoomType.ONE_TO_ONE,
				members: [createMockMember({ userId: user1.id })]
			});
			const editedMessage = createMockTextMessage({
				id: 'msg-s1',
				stanzaId: 'msg-s1',
				editedStanzaId: 'e_msg-s1_1754560000000',
				edited: true,
				roomId: room.id
			});

			const store = useStore.getState();
			store.addRooms([room]);
			store.newMessage(editedMessage);
			// A GET /pin stub carries no editedStanzaId: the v1 comparison would miss
			store.setPinnedMessage(
				room.id,
				createMockTextMessage({ id: 'msg-s1', stanzaId: 'msg-s1', roomId: room.id })
			);

			const { result } = renderHook(() => usePinMessage(editedMessage), {
				wrapper: ProvidersWrapper
			});

			expect(result.current.isMessagePinned).toBe(true);
		});

		it('unpins by the stable id and removes the banner optimistically', () => {
			const room = createMockRoom({
				id: 'roomV2Un',
				type: RoomType.ONE_TO_ONE,
				members: [createMockMember({ userId: user1.id })]
			});
			const message = createMockTextMessage({
				id: 'msg-u1',
				stanzaId: 'msg-u1',
				roomId: room.id
			});

			const store = useStore.getState();
			store.addRooms([room]);
			store.newMessage(message);
			store.setPinnedMessage(room.id, message);

			const unpinSpy = vi.spyOn(wscSdk, 'unpinMessage').mockResolvedValue(undefined);

			const { result } = renderHook(() => usePinMessage(message), {
				wrapper: ProvidersWrapper
			});

			act(() => {
				result.current.pinAction();
			});

			expect(unpinSpy).toHaveBeenCalledWith(room.id, 'msg-u1');
			expect(useStore.getState().activeConversations[room.id]?.messagePinned).toBeUndefined();
		});

		it('exposes the pin action without any XMPP feature negotiation', () => {
			const room = createMockRoom({
				id: 'roomV2Feat',
				type: RoomType.ONE_TO_ONE,
				members: [createMockMember({ userId: user1.id })]
			});
			const message = createMockTextMessage({ id: 'msg-f1', roomId: room.id });

			const store = useStore.getState();
			store.addRooms([room]);
			store.newMessage(message);
			// No disco features on v2: the REST contract is the gate
			xmppClient.features = [];

			const { result } = renderHook(() => usePinMessage(message), {
				wrapper: ProvidersWrapper
			});

			expect(result.current.canMessageBePinned).toBe(true);

			xmppClient.features = ['zextras:iq:pin'];
		});
	});
});
