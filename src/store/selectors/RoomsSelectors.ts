/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { countBy, filter, find, forEach, map, orderBy, size } from 'lodash';

import { getUserName } from './UsersSelectors';
import { RoomsApi, UsersApi } from '../../network';
import { Member, Room, RoomType } from '../../types/store/RoomTypes';
import { RootStore } from '../../types/store/StoreTypes';

export const getRoomIdsList = (state: RootStore): string[] => {
	const idsList: string[] = [];
	forEach(state.rooms, (room) => {
		idsList.push(room.id);
	});
	return idsList;
};

export const getTemporaryRoomIdsOrderedByCreation = (store: RootStore): string[] => {
	const filteredRooms = filter(store.rooms, (room) => room.type === RoomType.TEMPORARY);
	const orderedRooms = orderBy(filteredRooms, ['createdAt'], ['desc']);
	return map(orderedRooms, (room) => room.id);
};

export const getRoomSelector = (state: RootStore, id: string): Room => state.rooms[id];

export const getRoomNameSelector = (state: RootStore, id: string): string => {
	const room: Room = state.rooms[id];
	if (!room) return '';
	if (room.type === RoomType.ONE_TO_ONE) {
		const otherUser = find(room.members ?? [], (member) => member.userId !== state.session.id);
		if (size(room.members) > 0 && otherUser) {
			return getUserName(state, otherUser.userId);
		}
		return '';
	}
	return room.name ?? '';
};

export const getRoomTypeSelector = (state: RootStore, id: string): RoomType =>
	state.rooms[id]?.type;

export const getRoomDescriptionSelector = (state: RootStore, id: string): string =>
	state.rooms[id]?.description || '';

export const getRoomMutedSelector = (state: RootStore, id: string): boolean | undefined =>
	state.rooms[id]?.userSettings?.muted;

export type RoomMainInfosType = {
	id?: string;
	name?: string;
	description?: string;
	type?: RoomType;
	muted?: boolean;
};

export const getOwnershipOfTheRoom = (
	state: RootStore,
	roomId: string,
	userId = state.session.id
): boolean => {
	if (state.rooms[roomId]?.members != null && userId != null) {
		const sessionMember = find(state.rooms[roomId]?.members, (member) => member.userId === userId);
		if (sessionMember != null) {
			return sessionMember.owner;
		}
		return false;
	}
	return false;
};

export const getOwner = (state: RootStore, roomId: string, userId: string): boolean => {
	if (state.rooms[roomId]?.members != null) {
		const user = find(state.rooms[roomId]?.members, (member) => member.userId === userId);
		if (user != null) {
			return user.owner;
		}
		return false;
	}
	return false;
};

export const getNumberOfOwnersOfTheRoom = (state: RootStore, roomId: string): number => {
	if (state.rooms[roomId]?.members != null) {
		return countBy(state.rooms[roomId]?.members, (member) => member.owner).true;
	}
	return 0;
};

export const getRoomMembers = (state: RootStore, roomId: string): Member[] | undefined =>
	state.rooms[roomId]?.members;

export const getNumbersOfRoomMembers = (state: RootStore, roomId: string): number =>
	size(state.rooms[roomId]?.members);

export const getPictureUpdatedAt = (state: RootStore, roomId: string): string | undefined =>
	state.rooms[roomId]?.pictureUpdatedAt;

export const getRoomURLPicture = (state: RootStore, roomId: string): string | undefined => {
	const room = state.rooms[roomId];
	if (room.type === RoomType.ONE_TO_ONE) {
		const otherMember = find(
			state.rooms[roomId].members,
			(member) => member.userId !== state.session.id
		);
		if (otherMember) {
			const otherUser = state.users[otherMember.userId];
			return otherUser?.pictureUpdatedAt && UsersApi.getURLUserPicture(otherMember.userId);
		}
	}
	return room.pictureUpdatedAt && RoomsApi.getURLRoomPicture(room.id);
};

export const getMeetingIdFromRoom = (state: RootStore, roomId: string): string | undefined =>
	state.rooms[roomId]?.meetingId;

export const getIsPlaceholderRoom = (state: RootStore, roomId: string): boolean =>
	state.rooms[roomId]?.placeholder ?? false;

export const getSingleConversationsUserId = (state: RootStore): string[] => {
	const userIds: string[] = [];
	forEach(state.rooms, (room) => {
		if (room.type === RoomType.ONE_TO_ONE) {
			const otherUser = find(room.members ?? [], (member) => member.userId !== state.session.id);
			if (size(room.members) > 0 && otherUser) {
				userIds.push(otherUser.userId);
			}
		}
	});
	return userIds;
};

export const getIsThereAnyRoom = (state: RootStore): boolean => size(state.rooms) > 0;
