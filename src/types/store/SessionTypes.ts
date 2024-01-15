/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export type Session = {
	id?: string;
	email?: string;
	name?: string;
	displayName?: string;
	sessionId?: string;
	capabilities?: CapabilityList;
	connections?: {
		chats_be: boolean | undefined;
		xmpp: boolean | undefined;
		websocket: boolean | undefined;
	};
	selectedRoomOneToOneGroup?: string;
	filterHasFocus: boolean;
	customLogo?: string | false;
};

export type CapabilityList = {
	canSeeMessageReads: boolean;
	canSeeUsersPresence: boolean;
	canVideoCall: boolean;
	canVideoCallRecord: boolean;
	canUseVirtualBackground: boolean;
	editMessageTimeLimitInMinutes: number;
	deleteMessageTimeLimitInMinutes: number;
	maxGroupMembers: number;
	maxRoomImageSizeInKb: number;
	maxUserImageSizeInKb: number;
};

export enum CapabilityType {
	CAN_SEE_MESSAGE_READS = 'canSeeMessageReads',
	CAN_SEE_USERS_PRESENCE = 'canSeeUsersPresence',
	CAN_VIDEO_CALL = 'canVideoCall',
	CAN_VIDEO_CALL_RECORD = 'canVideoCallRecord',
	CAN_USE_VIRTUAL_BACKGROUND = 'canUseVirtualBackground',
	EDIT_MESSAGE_TIME_LIMIT = 'editMessageTimeLimitInMinutes',
	DELETE_MESSAGE_TIME_LIMIT = 'deleteMessageTimeLimitInMinutes',
	MAX_GROUP_MEMBERS = 'maxGroupMembers',
	MAX_ROOM_IMAGE_SIZE = 'maxRoomImageSizeInKb',
	MAX_USER_IMAGE_SIZE = 'maxUserImageSizeInKb'
}
