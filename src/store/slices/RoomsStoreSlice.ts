/* eslint-disable no-param-reassign */
/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { produce } from 'immer';
import { find, findIndex, forEach, remove } from 'lodash';
import { StateCreator } from 'zustand';

import { UsersApi } from '../../network';
import { MemberBe, RoomBe } from '../../types/network/models/roomBeTypes';
import { MessageType } from '../../types/store/MessageTypes';
import { RoomType } from '../../types/store/RoomTypes';
import { RoomsStoreSlice, RootStore } from '../../types/store/StoreTypes';
import { dateToISODate, isBefore } from '../../utils/dateUtils';

export const useRoomsStoreSlice: StateCreator<RoomsStoreSlice> = (set: (...any: any) => void) => ({
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
						updatedAt: roomBe.createdAt,
						pictureUpdatedAt: roomBe.pictureUpdatedAt,
						members: roomBe.members,
						userSettings: roomBe.userSettings,
						meetingId: roomBe.meetingId
					};

					// Retrieve members information if they are unknown
					forEach(roomBe.members, (member) => {
						if (!find(draft.users, (user) => user.id === member.userId)) {
							UsersApi.getDebouncedUser(member.userId);
						}
					});

					// Delete stored messages that have a date previous clearedAt date
					if (roomBe.userSettings?.clearedAt != null) {
						forEach(draft.messages[roomBe.id], (message) => {
							if (
								roomBe.userSettings &&
								roomBe.userSettings.clearedAt &&
								isBefore(message.date, roomBe.userSettings.clearedAt)
							) {
								remove(draft.messages[roomBe.id], (mes) => mes.id === message.id);
							}
						});
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
					name: roomBe.name || '',
					description: roomBe.description || '',
					type: roomBe.type,
					createdAt: roomBe.createdAt,
					updatedAt: roomBe.createdAt,
					pictureUpdatedAt: roomBe.pictureUpdatedAt,
					members: roomBe.members,
					userSettings: roomBe.userSettings,
					meetingId: roomBe.meetingId
				};

				// Retrieve members information if they are unknown
				forEach(roomBe.members, (member) => {
					if (!find(draft.users, (user) => user.id === member.userId)) {
						UsersApi.getDebouncedUser(member.userId);
					}
				});
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
	setRoomName: (id: string, newName: string): void => {
		set(
			produce((draft: RootStore) => {
				draft.rooms[id] = {
					...draft.rooms[id],
					name: newName
				};
			}),
			false,
			'ROOMS/CHANGE_NAME'
		);
	},
	setRoomDescription: (id: string, newDescription: string): void => {
		set(
			produce((draft: RootStore) => {
				draft.rooms[id] = {
					...draft.rooms[id],
					description: newDescription
				};
			}),
			false,
			'ROOMS/CHANGE_DESCRIPTION'
		);
	},
	setRoomNameAndDescription: (
		id: string,
		newName: string | undefined,
		newDescription: string | undefined
	): void => {
		set(
			produce((draft: RootStore) => {
				draft.rooms[id] = {
					...draft.rooms[id],
					name: newName || '',
					description: newDescription || ''
				};
			}),
			false,
			'ROOMS/CHANGE_NAME_DESCRIPTION'
		);
	},
	setRoomMuted: (id: string): void => {
		set(
			produce((draft: RootStore) => {
				draft.rooms[id].userSettings = {
					...draft.rooms[id].userSettings,
					muted: true
				};
			}),
			false,
			'ROOMS/MUTE_ROOM'
		);
	},
	setRoomUnmuted: (id: string): void => {
		set(
			produce((draft: RootStore) => {
				draft.rooms[id].userSettings = {
					...draft.rooms[id].userSettings,
					muted: false
				};
			}),
			false,
			'ROOMS/UNMUTE_ROOM'
		);
	},
	addRoomMember: (id: string, member: MemberBe): void => {
		set(
			produce((draft: RootStore) => {
				if (draft.rooms[id].members == null) draft.rooms[id].members = [];
				draft.rooms[id].members!.push(member);

				// Retrieve member information if he is unknown
				if (!find(draft.users, (user) => user.id === member.userId)) {
					UsersApi.getDebouncedUser(member.userId);
				}
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
					remove(draft.rooms[id].members!, { userId });
				}
			}),
			false,
			'ROOMS/REMOVE_ROOM_MEMBER'
		);
	},
	promoteMemberToModerator: (id: string, userId: string): void => {
		set(
			produce((draft: RootStore) => {
				const memberToPromote = find(draft.rooms[id].members, { userId });
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
				const memberToDemote = find(draft.rooms[id].members, { userId });
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
				draft.rooms[roomId].userSettings = {
					...draft.rooms[roomId].userSettings,
					clearedAt
				};

				draft.messages[roomId] = [];
			}),
			false,
			'ROOMS/SET_CLEARED_AT'
		);
	},
	setRoomPictureUpdated: (id: string, date: string): void => {
		set(
			produce((draft: RootStore) => {
				draft.rooms[id] = {
					...draft.rooms[id],
					pictureUpdatedAt: date
				};
			}),
			false,
			'ROOMS/ROOM_PICTURE_CHANGED'
		);
	},
	setRoomPictureDeleted: (id: string): void => {
		set(
			produce((draft: RootStore) => {
				draft.rooms[id] = {
					...draft.rooms[id],
					pictureUpdatedAt: undefined
				};
			}),
			false,
			'ROOMS/ROOM_PICTURE_DELETED'
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

				// Retrieve members information if user is unknown
				if (!find(draft.users, (user) => user.id === userId)) {
					UsersApi.getDebouncedUser(userId);
				}
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
