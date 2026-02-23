/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { useMemo } from 'react';

import {
	countBy,
	differenceWith,
	filter,
	find,
	forEach,
	isEqual,
	map,
	orderBy,
	size
} from 'lodash';

import { getUserName } from './UsersSelectors';
import { RoomsApi } from '../../network';
import { MemberBe } from '../../types/network/models/roomBeTypes';
import { Member, Room, RoomType } from '../../types/store/RoomTypes';
import { RootStore } from '../../types/store/StoreTypes';
import useStore from '../Store';

export const useRoomIdsList = (): string[] => {
	const rooms = useStore((store) => store.rooms);
	return useMemo(() => {
		const idsList: string[] = [];
		forEach(rooms, (room) => {
			idsList.push(room.id);
		});
		return idsList;
	}, [rooms]);
};

export const getAreConversationsToShowSelector = (state: RootStore): boolean => {
	const nonTemporaryRooms = filter(
		state.rooms,
		(room) => room.type === RoomType.ONE_TO_ONE || room.type === RoomType.GROUP
	);
	return size(nonTemporaryRooms) > 0;
};

export const useTemporaryRoomIdsOrderedByCreation = (): string[] => {
	const rooms = useStore((store) => store.rooms);
	return useMemo(() => {
		const filteredRooms = filter(rooms, (room) => room.type === RoomType.TEMPORARY);
		return [...map(orderBy(filteredRooms, ['createdAt'], ['desc']), (room) => room.id)];
	}, [rooms]);
};

export const useVirtualRoomsList = (): Room[] => {
	const rooms = useStore((store) => store.rooms);
	return useMemo(() => {
		const filteredRooms = filter(rooms, (room) => room.type === RoomType.TEMPORARY);
		return [...orderBy(filteredRooms, ['createdAt'], ['desc'])];
	}, [rooms]);
};

export const useOwners = (roomId: string): string[] => {
	const members = useStore((store) => store.rooms[roomId]?.members);
	return useMemo(() => {
		const ownersList: string[] = [];
		if (members != null) {
			map(members, (member) => {
				if (member.owner) {
					ownersList.push(member.userId);
				}
			});
		}
		return ownersList;
	}, [members]);
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
	state.rooms[id]?.description ?? '';

export const getRoomMutedSelector = (state: RootStore, id: string): boolean | undefined =>
	state.rooms[id]?.userSettings?.muted;

export const getOwnershipOfTheRoom = (
	state: RootStore,
	roomId: string,
	userId = state.session.id
): boolean => {
	if (state.rooms[roomId]?.members != null && userId != null) {
		const member = find(state.rooms[roomId]?.members, (member) => member.userId === userId);
		if (member != null) {
			return member.owner;
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

const FALLBACK_ARRAY: Member[] = [];

export const getRoomMembers = (state: RootStore, roomId: string): Member[] =>
	state.rooms[roomId]?.members ?? FALLBACK_ARRAY;

export const getNumbersOfRoomMembers = (state: RootStore, roomId: string): number =>
	size(state.rooms[roomId]?.members);

export const getPictureUpdatedAt = (state: RootStore, roomId: string): string | undefined =>
	state.rooms[roomId]?.pictureUpdatedAt;

export const getRoomURLPicture = (state: RootStore, roomId: string): string | undefined => {
	const room = state.rooms[roomId];
	if (room.type === RoomType.ONE_TO_ONE) {
		return undefined;
	}
	return room.pictureUpdatedAt && RoomsApi.getURLRoomPicture(room.id);
};

export const getMeetingIdFromRoom = (state: RootStore, roomId: string): string | undefined =>
	state.rooms[roomId]?.meetingId;

export const getIsPlaceholderRoom = (state: RootStore, roomId: string): boolean =>
	state.rooms[roomId]?.placeholder ?? false;

const userIds: string[] = [];

export const getSingleConversationsUserId = (state: RootStore): string[] => {
	userIds.length = 0;
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

export const getDuplicatedRoom = (
	state: RootStore,
	name: string,
	members: MemberBe[]
): Room | undefined =>
	find(state.rooms, (room) => {
		if (room.type === RoomType.GROUP) {
			if (room.name === name && size(members) === size(room.members)) {
				const roomMembers = map(room.members, (member) => ({
					userId: member.userId,
					owner: member.owner
				}));
				return (
					size(differenceWith(members, roomMembers, isEqual)) === 0 &&
					size(differenceWith(roomMembers, members, isEqual)) === 0
				);
			}
			return false;
		}
		return false;
	});
