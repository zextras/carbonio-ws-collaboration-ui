/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

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
