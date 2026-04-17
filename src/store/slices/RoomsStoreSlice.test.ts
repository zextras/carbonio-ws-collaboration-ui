/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { size } from 'lodash';

import {
	createMockConfigurationMessage,
	createMockMember,
	createMockRoom,
	createMockTextMessage,
	createMockUser
} from '../../tests/createMock';
import { MessageType, OperationType } from '../../types/store/ChatsRegistryTypes';
import { RoomType } from '../../types/store/RoomTypes';
import { dateToTimestamp } from '../../utils/dateUtils';
import useStore from '../Store';

const user1 = createMockUser({ id: 'user1' });
const user2 = createMockUser({ id: 'user2' });
const user3 = createMockUser({ id: 'user3' });

const singleRoom1 = createMockRoom({
	id: 'room1-id',
	type: RoomType.ONE_TO_ONE,
	members: [
		createMockMember({ userId: user1.id, owner: true }),
		createMockMember({ userId: user2.id, owner: true })
	]
});

const groupRoom1 = createMockRoom({
	id: 'group-room-1-id',
	type: RoomType.GROUP,
	members: [
		createMockMember({ userId: user1.id, owner: true }),
		createMockMember({ userId: user2.id }),
		createMockMember({ userId: user3.id })
	]
});

const temporaryRoom = createMockRoom({
	id: 'temporary-room-id',
	type: RoomType.TEMPORARY,
	members: [
		createMockMember({ userId: user1.id, owner: true }),
		createMockMember({ userId: user2.id })
	]
});

describe('RoomsStoreSlice tests', () => {
	describe('Add rooms', () => {
		test('Room is added to the store', () => {
			useStore.getState().addRooms([singleRoom1]);
			expect(useStore.getState().rooms[singleRoom1.id]).toEqual(
				expect.objectContaining({
					id: singleRoom1.id,
					name: singleRoom1.name,
					description: singleRoom1.description,
					type: singleRoom1.type,
					createdAt: singleRoom1.createdAt,
					updatedAt: singleRoom1.updatedAt,
					pictureUpdatedAt: singleRoom1.pictureUpdatedAt,
					members: singleRoom1.members
				})
			);
		});

		test('If an already present room is added, meetingId data is maintained ', () => {
			useStore.getState().addRooms([{ ...groupRoom1, meetingId: 'newMeetingId' }]);
			useStore.getState().addRooms([groupRoom1]);
			expect(useStore.getState().rooms[groupRoom1.id]).toEqual(
				expect.objectContaining({
					meetingId: 'newMeetingId'
				})
			);
		});

		test('Adding a room without fullSync does not remove existing rooms', () => {
			useStore.getState().addRooms([singleRoom1]);
			useStore.getState().addRooms([groupRoom1]);
			expect(useStore.getState().rooms[singleRoom1.id]).toBeDefined();
			expect(useStore.getState().rooms[groupRoom1.id]).toBeDefined();
		});

		test('Adding a room with fullSync removes rooms not in the incoming list', () => {
			useStore.getState().addRooms([singleRoom1]);
			useStore.getState().addRooms([groupRoom1]);
			expect(useStore.getState().rooms[singleRoom1.id]).toBeDefined();
			expect(useStore.getState().rooms[groupRoom1.id]).toBeDefined();

			useStore.getState().addRooms([singleRoom1], true);
			expect(useStore.getState().rooms[singleRoom1.id]).toBeDefined();
			expect(useStore.getState().rooms[groupRoom1.id]).toBeUndefined();
		});

		test('If a room is added with clearedAt, messages before that date are removed', () => {
			useStore.setState({
				chatsRegistry: {
					[groupRoom1.id]: {
						messages: [
							createMockTextMessage({
								id: 'message1',
								roomId: groupRoom1.id,
								date: dateToTimestamp('2023-01-20T00:00:00Z')
							}),
							createMockTextMessage({
								id: 'message2',
								roomId: groupRoom1.id,
								date: dateToTimestamp('2023-01-22T00:00:00Z')
							})
						],
						fastenings: {},
						markers: {},
						searchResults: [],
						unread: 0,
						backfillQueue: []
					}
				}
			});
			expect(size(useStore.getState().chatsRegistry[groupRoom1.id].messages)).toEqual(2);
			useStore
				.getState()
				.addRooms([
					{ ...groupRoom1, userSettings: { clearedAt: '2023-01-21T00:00:00Z', muted: false } }
				]);
			expect(size(useStore.getState().chatsRegistry[groupRoom1.id].messages)).toEqual(1);
		});
	});

	test('Room is removed from the store', () => {
		useStore.getState().addRooms([singleRoom1]);
		useStore.getState().removeRoom(singleRoom1.id);
		expect(useStore.getState().rooms[singleRoom1.id]).toBeUndefined();
	});

	describe('Mute status', () => {
		test('Mute status is set only when the room is present in the store', () => {
			useStore.getState().setRoomMuteStatus(groupRoom1.id, true);
			expect(useStore.getState().rooms[groupRoom1.id]).toBeUndefined();
		});

		test('Mute status is set tot true', () => {
			useStore.getState().addRooms([groupRoom1]);
			useStore.getState().setRoomMuteStatus(groupRoom1.id, true);
			expect(useStore.getState().rooms[groupRoom1.id].userSettings?.muted).toBe(true);
		});

		test('Mute status is set to false', () => {
			useStore.getState().addRooms([groupRoom1]);
			useStore.getState().setRoomMuteStatus(groupRoom1.id, false);
			expect(useStore.getState().rooms[groupRoom1.id].userSettings?.muted).toBe(false);
		});
	});

	describe('Members', () => {
		test('Member is added to the room', () => {
			useStore.getState().addRooms([groupRoom1]);
			const newMember = createMockMember({ userId: 'user5', owner: false });
			useStore.getState().addRoomMember(groupRoom1.id, newMember);
			expect(useStore.getState().rooms[groupRoom1.id].members).toContainEqual(newMember);
		});

		test('Member is removed from the room', () => {
			useStore.getState().addRooms([groupRoom1]);
			useStore.getState().removeRoomMember(groupRoom1.id, user2.id);
			expect(useStore.getState().rooms[groupRoom1.id].members).not.toContainEqual(
				expect.objectContaining({ userId: user2.id })
			);
		});

		test('Member is promoted to room moderator', () => {
			useStore.getState().addRooms([groupRoom1]);
			useStore.getState().setMemberModeratorStatus(groupRoom1.id, user2.id, true);
			expect(useStore.getState().rooms[groupRoom1.id].members).toContainEqual(
				expect.objectContaining({ userId: user2.id, owner: true })
			);
		});

		test('Room moderator is demoted', () => {
			useStore.getState().addRooms([groupRoom1]);
			useStore.getState().setMemberModeratorStatus(groupRoom1.id, user1.id, false);
			expect(useStore.getState().rooms[groupRoom1.id].members).toContainEqual(
				expect.objectContaining({ userId: user1.id, owner: false })
			);
		});
	});

	describe('Edit room', () => {
		test('Room is edited', () => {
			useStore.getState().addRooms([groupRoom1]);
			const updatedRoom = {
				name: 'Updated Room Name',
				description: 'Updated Room Description'
			};
			useStore.getState().editRoom(groupRoom1.id, {
				name: updatedRoom.name,
				description: updatedRoom.description
			});
			expect(useStore.getState().rooms[groupRoom1.id]).toEqual(
				expect.objectContaining({
					name: updatedRoom.name,
					description: updatedRoom.description
				})
			);
		});

		test('Room edit is ignored if room is not present in the store', () => {
			useStore.getState().editRoom(groupRoom1.id, {
				name: 'Updated Room Name',
				description: 'Updated Room Description'
			});
			expect(useStore.getState().rooms[groupRoom1.id]).toBeUndefined();
		});
	});

	describe('clearConversation', () => {
		test('clearConversation deletes chatsRegistry for ONE_TO_ONE rooms', () => {
			const now = new Date();
			useStore.getState().addRooms([singleRoom1]);
			useStore.getState().clearConversation(singleRoom1.id, now.toISOString());
			expect(useStore.getState().rooms[singleRoom1.id].userSettings?.clearedAt).toBe(
				now.toISOString()
			);
			expect(useStore.getState().chatsRegistry[singleRoom1.id]).toBeUndefined();
		});

		test('clearConversation deletes chatsRegistry for GROUP rooms', () => {
			const now = new Date();
			useStore.getState().addRooms([groupRoom1]);
			useStore.getState().clearConversation(groupRoom1.id, now.toISOString());
			expect(useStore.getState().rooms[groupRoom1.id].userSettings?.clearedAt).toBe(
				now.toISOString()
			);
			expect(useStore.getState().chatsRegistry[groupRoom1.id]).toBeUndefined();
		});

		test('clearConversation preserves CLEARED_HISTORY config message for TEMPORARY rooms', () => {
			const now = new Date();
			const configDate = new Date(now.getTime() + 1);
			useStore.getState().addRooms([temporaryRoom]);
			useStore.setState({
				chatsRegistry: {
					[temporaryRoom.id]: {
						messages: [
							createMockTextMessage({
								id: 'old-msg',
								roomId: temporaryRoom.id,
								date: dateToTimestamp(new Date(now.getTime() - 10000).toISOString())
							}),
							createMockConfigurationMessage({
								id: 'clear-config-msg',
								roomId: temporaryRoom.id,
								type: MessageType.CONFIGURATION_MSG,
								operation: OperationType.CLEARED_HISTORY,
								date: dateToTimestamp(configDate.toISOString())
							})
						],
						fastenings: {},
						markers: {},
						searchResults: [],
						unread: 0,
						backfillQueue: []
					}
				}
			});
			useStore.getState().clearConversation(temporaryRoom.id, now.toISOString());
			const registry = useStore.getState().chatsRegistry[temporaryRoom.id];
			expect(registry).toBeDefined();
			expect(size(registry.messages)).toBe(1);
			expect(registry.messages[0].id).toBe('clear-config-msg');
			expect(registry.messages[0].type).toBe(MessageType.CONFIGURATION_MSG);
		});

		test('clearConversation keeps only the latest CLEARED_HISTORY config message after successive clears', () => {
			const firstClear = new Date('2025-01-01T10:00:00Z');
			const secondClear = new Date('2025-01-01T11:00:00Z');
			const betweenClears = new Date('2025-01-01T10:30:00Z');
			const afterSecondClear = new Date('2025-01-01T11:30:00Z');
			useStore.getState().addRooms([temporaryRoom]);
			useStore.setState({
				chatsRegistry: {
					[temporaryRoom.id]: {
						messages: [
							createMockConfigurationMessage({
								id: 'first-clear-config',
								roomId: temporaryRoom.id,
								type: MessageType.CONFIGURATION_MSG,
								operation: OperationType.CLEARED_HISTORY,
								date: dateToTimestamp(firstClear.toISOString())
							}),
							createMockTextMessage({
								id: 'msg-between-clears',
								roomId: temporaryRoom.id,
								date: dateToTimestamp(betweenClears.toISOString())
							}),
							createMockConfigurationMessage({
								id: 'second-clear-config',
								roomId: temporaryRoom.id,
								type: MessageType.CONFIGURATION_MSG,
								operation: OperationType.CLEARED_HISTORY,
								date: dateToTimestamp(secondClear.toISOString())
							}),
							createMockTextMessage({
								id: 'msg-after-second-clear',
								roomId: temporaryRoom.id,
								date: dateToTimestamp(afterSecondClear.toISOString())
							})
						],
						fastenings: {},
						markers: {},
						searchResults: [],
						unread: 0,
						backfillQueue: []
					}
				}
			});
			useStore.getState().clearConversation(temporaryRoom.id, secondClear.toISOString());
			const registry = useStore.getState().chatsRegistry[temporaryRoom.id];
			expect(registry).toBeDefined();
			// Should keep: msg-after-second-clear + only the latest clear config message
			expect(size(registry.messages)).toBe(2);
			expect(registry.messages.map((m) => m.id)).toContain('msg-after-second-clear');
			expect(registry.messages.map((m) => m.id)).toContain('second-clear-config');
			expect(registry.messages.map((m) => m.id)).not.toContain('first-clear-config');
			expect(registry.messages.map((m) => m.id)).not.toContain('msg-between-clears');
		});
	});

	describe('Placeholder room', () => {
		test('Placeholder room is been stored correctly with historyFullyLoaded', () => {
			useStore.getState().setPlaceholderRoom(user1.id);

			const placeholderRoomId = `placeholder-${user1.id}`;
			const store = useStore.getState();
			expect(store.rooms[placeholderRoomId]).toEqual(
				expect.objectContaining({
					id: `placeholder-${user1.id}`,
					placeholder: true,
					type: RoomType.ONE_TO_ONE
				})
			);
			expect(store.activeConversations[placeholderRoomId].isHistoryFullyLoaded).toBeTruthy();
		});

		test('Placeholder room and all relative data are been removed', () => {
			useStore.getState().setPlaceholderRoom(user1.id);
			useStore.getState().removePlaceholderRoom(user1.id);

			const placeholderRoomId = `placeholder-${user1.id}`;
			const store = useStore.getState();
			expect(store.rooms[placeholderRoomId]).toBeUndefined();
			expect(store.activeConversations[placeholderRoomId]).toBeUndefined();
			expect(store.chatsRegistry[placeholderRoomId]).toBeUndefined();
		});
	});
});
