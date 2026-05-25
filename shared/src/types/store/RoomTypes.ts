/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { MemberBe, RoomBe } from '../network/models/roomBeTypes';

export type RoomsStoreSlice = {
	rooms: RoomsMap;
	addRooms: (rooms: RoomBe[], fullSync?: boolean) => void;
	removeRoom: (roomId: string) => void;
	editRoom: (roomId: string, room: Partial<Room>) => void;
	setRoomMuteStatus: (roomId: string, muted: boolean) => void;
	addRoomMember: (roomId: string, member: MemberBe) => void;
	removeRoomMember: (roomId: string, memberId: string | undefined) => void;
	setMemberModeratorStatus: (roomId: string, memberId: string, isModerator: boolean) => void;
	clearConversation: (roomId: string, clearedAt: string) => void;
	setPlaceholderRoom: (userId: string) => void;
	removePlaceholderRoom: (userId: string) => void;
};

export type Room = {
	id: string;
	name?: string;
	description?: string;
	type: RoomType;
	createdAt: string;
	updatedAt: string;
	pictureUpdatedAt?: string;
	members: Member[];
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
	[roomId: string]: Room;
};

export type ConversationProps = {
	roomId: string;
};
