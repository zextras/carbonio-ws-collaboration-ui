/* eslint-disable no-param-reassign */
/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { produce } from 'immer';
import { filter, find, forEach, size, some } from 'lodash';
import { StateCreator } from 'zustand';

import { MemberBe, RoomBe } from '../../types/network/models/roomBeTypes';
import { MessageType } from '../../types/store/ChatDataTypes';
import { Room, RoomsStoreSlice, RoomType } from '../../types/store/RoomTypes';
import { RootStore } from '../../types/store/StoreTypes';
import { dateToISODate, isBefore } from '../../utils/dateUtils';

export const useRoomsStoreSlice: StateCreator<
	RootStore,
	[['zustand/devtools', never]],
	[],
	RoomsStoreSlice
> = (set) => ({
	rooms: {},
	addRooms: (roomsBe: RoomBe[]): void => {
		set(
			produce((draft: RootStore) => {
				forEach(roomsBe, (roomBe) => {
					draft.rooms[roomBe.id] = {
						id: roomBe.id,
						name: roomBe.name,
						description: roomBe.description,
						type: roomBe.type,
						createdAt: roomBe.createdAt,
						updatedAt: roomBe.updatedAt,
						pictureUpdatedAt: roomBe.pictureUpdatedAt,
						members: roomBe.members ?? [],
						userSettings: roomBe.userSettings,
						meetingId: roomBe.meetingId ?? draft.rooms[roomBe.id]?.meetingId
					};

					// Remove messages sent before the clearedAt timestamp
					const clearedAt = roomBe.userSettings?.clearedAt;
					const messages = draft.chatData[roomBe.id]?.messages;
					if (clearedAt && size(messages) > 0) {
						draft.chatData[roomBe.id].messages = filter(
							messages,
							(message) => !isBefore(message.date, clearedAt)
						);
					}
				});
			}),
			false,
			'ROOMS/ADD_ROOMS'
		);
	},
	removeRoom: (roomId: string): void => {
		set(
			produce((draft: RootStore) => {
				delete draft.rooms[roomId];
				delete draft.activeConversations[roomId];
				delete draft.meetings[roomId];
				delete draft.chatData[roomId];
			}),
			false,
			'ROOMS/REMOVE_ROOM'
		);
	},
	editRoom: (roomId: string, updates: Partial<Room>): void => {
		set(
			produce((draft: RootStore) => {
				if (draft.rooms[roomId]) {
					draft.rooms[roomId] = {
						...draft.rooms[roomId],
						...updates
					};
				}
			}),
			false,
			'ROOMS/EDIT_ROOM_PROPERTIES'
		);
	},
	setRoomMuteStatus: (roomId: string, muted: boolean): void => {
		set(
			produce((draft: RootStore) => {
				const room = draft.rooms[roomId];
				if (room) {
					room.userSettings = {
						...room.userSettings,
						muted
					};
				}
			}),
			false,
			'ROOMS/SET_ROOM_MUTE_STATUS'
		);
	},
	addRoomMember: (roomId: string, member: MemberBe): void => {
		set(
			produce((draft: RootStore) => {
				const room = draft.rooms[roomId];
				if (room) {
					const alreadyExists = some(room.members, (m) => m.userId === member.userId);
					if (!alreadyExists) {
						room.members.push(member);
					}
				}
			}),
			false,
			'ROOMS/ADD_ROOM_MEMBER'
		);
	},
	removeRoomMember: (roomId: string, memberId: string | undefined): void => {
		set(
			produce((draft: RootStore) => {
				const room = draft.rooms[roomId];
				if (room) {
					room.members = filter(room.members, (member) => member.userId !== memberId);
				}
			}),
			false,
			'ROOMS/REMOVE_ROOM_MEMBER'
		);
	},
	setMemberModeratorStatus: (roomId: string, userId: string, isModerator: boolean): void => {
		set(
			produce((draft: RootStore) => {
				const room = draft.rooms[roomId];
				if (room) {
					const member = find(room.members, (member) => member.userId === userId);
					if (member) {
						member.owner = isModerator;
					}
				}
			}),
			false,
			'ROOMS/SET_MEMBER_MODERATOR_STATUS'
		);
	},
	clearConversation: (roomId: string, clearedAt: string): void => {
		set(
			produce((draft: RootStore) => {
				const room = draft.rooms[roomId];
				if (room) {
					room.userSettings = {
						...room.userSettings,
						clearedAt
					};
					delete draft.chatData[roomId];
				}
			}),
			false,
			'ROOMS/CLEAR_CONVERSATION'
		);
	},
	setPlaceholderRoom: (userId: string): void => {
		set(
			produce((draft: RootStore) => {
				const now = Date.now();
				const roomId = `placeholder-${userId}`;
				draft.rooms[roomId] = {
					id: roomId,
					type: RoomType.ONE_TO_ONE,
					placeholder: true,
					members: [
						{
							userId,
							owner: true
						}
					],
					createdAt: dateToISODate(now),
					updatedAt: dateToISODate(now)
				};
				draft.activeConversations[roomId] = {
					isHistoryFullyLoaded: true
				};
				draft.chatData[roomId] = {
					messages: [
						{
							type: MessageType.DATE_MSG,
							date: now,
							id: `date-${now}`,
							roomId
						}
					],
					fastenings: {},
					markers: {},
					unread: 0
				};
			}),
			false,
			'ROOMS/SET_PLACEHOLDER_ROOM'
		);
	},
	removePlaceholderRoom: (userId: string): void => {
		set(
			produce((draft: RootStore) => {
				const placeholderRoomId = `placeholder-${userId}`;
				delete draft.rooms[placeholderRoomId];
				delete draft.activeConversations[placeholderRoomId];
				delete draft.chatData[placeholderRoomId];
			}),
			false,
			'ROOMS/REMOVE_PLACEHOLDER_ROOM'
		);
	}
});
