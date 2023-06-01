/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { countBy, find, forEach, size } from 'lodash';

import { RoomsApi, UsersApi } from '../../network';
import { Member, Room, RoomsMap, RoomType } from '../../types/store/RoomTypes';
import { RootStore } from '../../types/store/StoreTypes';

export const getRoomsSelector = (state: RootStore): RoomsMap => ({ ...state.rooms });

export const getRoomIdsList = (state: RootStore): string[] => {
	const idsList: string[] = [];
	forEach(state.rooms, (room) => {
		idsList.push(room.id);
	});
	return idsList;
};

export const getRoomSelector = (state: RootStore, id: string): Room => state.rooms[id];

export const getRoomNameSelector = (state: RootStore, id: string): string => {
	const room: Room = state.rooms[id];
	if (!room) return '';
	if (room.type === RoomType.ONE_TO_ONE) {
		const otherUserId = room.members
			? room.members.length > 1
				? state.session.id === room.members[0].userId
					? room.members[1].userId
					: room.members[0].userId
				: null
			: null;
		return otherUserId && state.users[otherUserId]
			? state.users[otherUserId].name ||
					state.users[otherUserId].email ||
					state.users[otherUserId].id
			: room.name;
	}
	return state.rooms[id].name || state.rooms[id].id;
};

export const getRoomTypeSelector = (state: RootStore, id: string): RoomType =>
	state.rooms[id]?.type;

export const getRoomDescriptionSelector = (state: RootStore, id: string): string =>
	state.rooms[id]?.description;

export const getRoomMutedSelector = (state: RootStore, id: string): boolean | undefined =>
	state.rooms[id]?.userSettings?.muted;

export type RoomMainInfosType = {
	id?: string;
	name?: string;
	description?: string;
	type?: RoomType;
	muted?: boolean;
};

export const getRoomMainInfoSelector = (state: RootStore, id: string): RoomMainInfosType => ({
	id: state.rooms[id]?.id,
	name: state.rooms[id]?.name,
	description: state.rooms[id]?.description,
	type: state.rooms[id]?.type,
	muted: state.rooms[id]?.userSettings?.muted
});

export const getMyOwnershipOfTheRoom = (
	state: RootStore,
	sessionId: string | undefined,
	roomId: string
): boolean => {
	if (state.rooms[roomId]?.members != null && sessionId != null) {
		const sessionMember = find(
			state.rooms[roomId].members,
			(member) => member.userId === sessionId
		);
		if (sessionMember != null) {
			return sessionMember.owner;
		}
		return false;
	}
	return false;
};

export const getOwner = (state: RootStore, roomId: string, userId: string): boolean => {
	if (state.rooms[roomId]?.members != null) {
		const user = find(state.rooms[roomId].members, (member) => member.userId === userId);
		if (user != null) {
			return user.owner;
		}
		return false;
	}
	return false;
};

export const getNumberOfOwnersOfTheRoom = (state: RootStore, roomId: string): number => {
	if (state.rooms[roomId]?.members != null) {
		return countBy(state.rooms[roomId].members, (member) => member.owner).true;
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
