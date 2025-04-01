/* eslint-disable no-param-reassign */
/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { produce } from 'immer';
import { filter, find, findIndex, forEach, remove, size } from 'lodash';
import { StateCreator } from 'zustand';

import { MemberBe, RoomBe } from '../../types/network/models/roomBeTypes';
import { MessageType } from '../../types/store/MessageTypes';
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
	setRooms: (roomsBe: RoomBe[]): void => {
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
						members: roomBe.members,
						userSettings: roomBe.userSettings,
						meetingId: roomBe.meetingId || draft.rooms[roomBe.id]?.meetingId
					};

					// Remove messages sent before the clearedAt timestamp
					const clearedAt = roomBe.userSettings?.clearedAt;
					const messages = draft.messages[roomBe.id];
					if (clearedAt && size(messages) > 0) {
						draft.messages[roomBe.id] = filter(
							messages,
							(message) => !isBefore(message.date, clearedAt)
						);
					}
				});
			}),
			false,
			'ROOMS/SET_ROOMS'
		);
	},
	addRoom: (roomBe: RoomBe): void => {
		set(
			produce((draft: RootStore) => {
				draft.rooms[roomBe.id] = {
					id: roomBe.id,
					name: roomBe.name ?? '',
					description: roomBe.description ?? '',
					type: roomBe.type,
					createdAt: roomBe.createdAt,
					updatedAt: roomBe.createdAt,
					pictureUpdatedAt: roomBe.pictureUpdatedAt,
					members: roomBe.members,
					userSettings: roomBe.userSettings,
					meetingId: draft.rooms[roomBe.id]?.meetingId ?? roomBe.meetingId
				};
			}),
			false,
			'ROOMS/ADD_ROOM'
		);
	},
	deleteRoom: (id: string): void => {
		set(
			produce((draft: RootStore) => {
				delete draft.messages[id];
				delete draft.markers[id];
				delete draft.activeConversations[id];
				delete draft.rooms[id];
			}),
			false,
			'ROOMS/DELETE_ROOM'
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
	setRoomMuted: (id: string): void => {
		set(
			produce((draft: RootStore) => {
				if (draft.rooms[id]) {
					draft.rooms[id].userSettings = {
						...draft.rooms[id].userSettings,
						muted: true
					};
				}
			}),
			false,
			'ROOMS/MUTE_ROOM'
		);
	},
	setRoomUnmuted: (id: string): void => {
		set(
			produce((draft: RootStore) => {
				if (draft.rooms[id]) {
					draft.rooms[id].userSettings = {
						...draft.rooms[id].userSettings,
						muted: false
					};
				}
			}),
			false,
			'ROOMS/UNMUTE_ROOM'
		);
	},
	addRoomMember: (id: string, member: MemberBe): void => {
		set(
			produce((draft: RootStore) => {
				if (draft.rooms[id].members == null) draft.rooms[id].members = [];
				draft.rooms[id].members.push(member);
			}),
			false,
			'ROOMS/ADD_ROOM_MEMBER'
		);
	},
	removeRoomMember: (id: string, userId: string | undefined): void => {
		set(
			produce((draft: RootStore) => {
				if (
					draft.rooms[id].members != null &&
					userId &&
					find(draft.rooms[id].members, { userId })
				) {
					remove(draft.rooms[id].members, { userId });
				}
			}),
			false,
			'ROOMS/REMOVE_ROOM_MEMBER'
		);
	},
	promoteMemberToModerator: (id: string, userId: string): void => {
		set(
			produce((draft: RootStore) => {
				const memberToPromote = find(draft.rooms[id]?.members, { userId });
				if (memberToPromote) {
					memberToPromote.owner = true;
					const index = findIndex(draft.rooms[id].members, { userId });
					draft.rooms[id].members!.splice(index, 1, memberToPromote);
				}
			}),
			false,
			'ROOMS/PROMOTE_ROOM_MEMBER'
		);
	},
	demoteMemberFromModerator: (id: string, userId: string): void => {
		set(
			produce((draft: RootStore) => {
				const memberToDemote = find(draft.rooms[id]?.members, { userId });
				if (memberToDemote) {
					memberToDemote.owner = false;
					const index = findIndex(draft.rooms[id].members, { userId });
					draft.rooms[id].members!.splice(index, 1, memberToDemote);
				}
			}),
			false,
			'ROOMS/DEMOTE_ROOM_MEMBER'
		);
	},
	setClearedAt: (roomId: string, clearedAt: string): void => {
		set(
			produce((draft: RootStore) => {
				if (draft.rooms[roomId]) {
					draft.rooms[roomId].userSettings = {
						...draft.rooms[roomId].userSettings,
						clearedAt
					};
					draft.messages[roomId] = [];
				}
			}),
			false,
			'ROOMS/SET_CLEARED_AT'
		);
	},
	setPlaceholderRoom: (userId: string): void => {
		set(
			produce((draft: RootStore) => {
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
					createdAt: dateToISODate(Date.now()),
					updatedAt: dateToISODate(Date.now())
				};

				draft.activeConversations[roomId] = {
					isHistoryFullyLoaded: true
				};

				draft.messages[roomId] = [
					{
						type: MessageType.DATE_MSG,
						date: Date.now(),
						id: `date-${Date.now()}`,
						roomId
					}
				];
			}),
			false,
			'ROOMS/SET_PLACEHOLDER_ROOM'
		);
	},
	replacePlaceholderRoom: (userId: string, newRoomId: string): void => {
		set(
			produce((draft: RootStore) => {
				const placeholderRoomId = `placeholder-${userId}`;
				draft.rooms[newRoomId] = draft.rooms[placeholderRoomId];
				delete draft.rooms[placeholderRoomId];
				delete draft.messages[placeholderRoomId];
				delete draft.activeConversations[placeholderRoomId];
			}),
			false,
			'ROOMS/CREATE_AND_REPLACE_PLACEHOLDER_ROOM'
		);
	}
});
