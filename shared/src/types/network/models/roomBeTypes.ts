/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { RoomType, RoomUserSettings } from '../../store/RoomTypes';

export type RoomBe = {
	id: string;
	name?: string;
	description?: string;
	type: RoomType;
	createdAt: string;
	updatedAt: string;
	pictureUpdatedAt?: string;
	members?: MemberBe[];
	userSettings?: RoomUserSettings;
	meetingId?: string;
};

export type RoomCreationFields =
	| {
			type: RoomType.ONE_TO_ONE;
			members: MemberBe[]; // only 1 item (other's user id, not mine)
	  }
	| {
			type: RoomType.GROUP;
			name: string; // min: 1, max: 128
			description: string; // min: 0, max: 256
			members: MemberBe[]; // minItems: 1 (not include creator)
	  }
	| {
			type: RoomType.TEMPORARY;
			name: string;
			members?: MemberBe[];
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
