/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { MemberBe, RoomBe } from '../network/models/roomBeTypes';

export type RoomsStoreSlice = {
	rooms: RoomsMap;
	setRooms: (rooms: RoomBe[]) => void;
	addRoom: (room: RoomBe) => void;
	deleteRoom: (id: string) => void;
	setRoomName: (id: string, newName: string) => void;
	setRoomDescription: (id: string, newDescription: string) => void;
	setRoomNameAndDescription: (
		id: string,
		newName: string | undefined,
		newDescription: string | undefined
	) => void;
	setRoomMuted: (id: string) => void;
	setRoomUnmuted: (id: string) => void;
	addRoomMember: (id: string, member: MemberBe) => void;
	removeRoomMember: (id: string, userId: string | undefined) => void;
	promoteMemberToModerator: (id: string, userId: string) => void;
	demoteMemberFromModerator: (id: string, userId: string) => void;
	setClearedAt: (roomId: string, clearedAt: string) => void;
	setRoomPictureUpdated: (id: string, date: string) => void;
	setRoomPictureDeleted: (id: string) => void;
	setPlaceholderRoom: (userId: string) => void;
	replacePlaceholderRoom: (userId: string, newRoomId: string) => void;
};

export type Room = {
	id: string;
	name?: string;
	description?: string;
	type: RoomType;
	createdAt: string;
	updatedAt: string;
	pictureUpdatedAt?: string;
	members?: Member[];
	userSettings?: RoomUserSettings;
	meetingId?: string;
	placeholder?: boolean;
};

export enum RoomType {
	ONE_TO_ONE = 'one_to_one',
	GROUP = 'group',
	TEMPORARY = 'temporary'
}

export type Member = {
	userId: string;
	owner: boolean;
	temporary?: boolean;
	external?: boolean;
};

export type RoomUserSettings = {
	muted?: boolean;
	clearedAt?: string;
};

export type RoomsMap = {
	[id: string]: Room;
};

export type ConversationProps = {
	roomId: string;
};
