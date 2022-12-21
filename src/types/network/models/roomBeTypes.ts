/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export type RoomBe = {
	id: string;
	name: string;
	description: string;
	type: RoomType;
	hash: string;
	createdAt: string;
	updatedAt: string;
	pictureUpdatedAt?: string;
	members?: MemberBe[];
	userSettings?: RoomUserSettings;
};

export enum RoomType {
	ONE_TO_ONE = 'one_to_one',
	GROUP = 'group'
}

export type RoomCreationFields = {
	name: string; // min: 1, max: 128
	description: string; // min: 0, max: 256
	type: RoomType;
	membersIds: string[]; // minItems: 1 (not include creator id)
};

export type RoomEditableFields = {
	name?: string; // min: 1, max: 128
	description?: string; // min: 0, max: 256
};

export type MemberBe = {
	userId: string;
	owner: boolean;
	temporary?: boolean;
	external?: boolean;
};

export type AddMemberFields = {
	userId: string;
	owner: boolean;
	historyCleared: boolean;
};

export type RoomUserSettings = {
	muted: boolean;
	clearedAt?: string;
};
