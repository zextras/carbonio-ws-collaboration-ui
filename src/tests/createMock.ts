/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { MemberBe, RoomBe } from '../types/network/models/roomBeTypes';
import { UserBe } from '../types/network/models/userBeTypes';
import { Marker, MarkerStatus, MarkerType } from '../types/store/MarkersTypes';
import {
	AffiliationMessage,
	ConfigurationMessage,
	DateMessage,
	DeletedMessage,
	MessageType,
	TextMessage
} from '../types/store/MessageTypes';
import { RoomType } from '../types/store/RoomTypes';
import { CapabilityList } from '../types/store/SessionTypes';

export const createMockRoom = (fields?: Record<string, any>): RoomBe => ({
	id: 'id',
	name: 'name',
	description: 'description',
	type: RoomType.GROUP,
	hash: 'hash',
	createdAt: '2022-08-25T17:24:28.961+02:00',
	updatedAt: '2022-08-25T17:24:28.961+02:00',
	members: [],
	userSettings: {
		muted: false
	},
	...fields
});

export const createMockTextMessage = (fields?: Record<string, any>): TextMessage => ({
	id: 'id',
	roomId: 'roomId',
	date: 1661441294393,
	type: MessageType.TEXT_MSG,
	stanzaId: 'stanzaId',
	from: 'userId',
	text: 'Hi',
	read: MarkerStatus.UNREAD,
	edited: false,
	replyTo: undefined,
	repliedMessage: undefined,
	forwarded: undefined,
	attachment: undefined,
	...fields
});

export const createMockDeletedMessage = (fields?: Record<string, any>): DeletedMessage => ({
	id: 'deleted-id',
	roomId: 'roomId',
	date: 1661441294393,
	type: MessageType.DELETED_MSG,
	from: 'userId',
	...fields
});

export const createMockAffiliationMessage = (fields?: Record<string, any>): AffiliationMessage => ({
	id: 'id',
	roomId: 'roomId',
	date: 1661441294393,
	type: MessageType.AFFILIATION_MSG,
	userId: 'userId',
	as: 'member',
	...fields
});

export const createMockConfigurationMessage = (
	fields?: Record<string, any>
): ConfigurationMessage => ({
	id: 'id',
	roomId: 'roomId',
	date: 1661441294393,
	type: MessageType.CONFIGURATION_MSG,
	operation: 'roomNameChanged',
	value: 'Right',
	from: 'Wrong',
	...fields
});
export const createMockDateMessage = (fields?: Record<string, any>): DateMessage => ({
	id: 'id',
	roomId: 'roomId',
	date: 1661441294393,
	type: MessageType.DATE_MSG,
	...fields
});

export const createMockMember = (fields?: Record<string, any>): MemberBe => ({
	userId: 'userId',
	owner: false,
	...fields
});

export const createMockMarker = (fields?: Record<string, any>): Marker => ({
	from: 'from',
	messageId: 'messageId',
	markerDate: 1662541394393,
	type: MarkerType.DISPLAYED,
	...fields
});

export const createMockCapabilityList = (fields?: Record<string, any>): CapabilityList => ({
	canSeeMessageReads: true,
	canSeeUsersPresence: true,
	canVideoCall: true,
	canVideoCallRecord: true,
	canUseVirtualBackground: true,
	editMessageTimeLimitInMinutes: 10,
	deleteMessageTimeLimitInMinutes: 10,
	maxGroupMembers: 128,
	maxRoomImageSizeInKb: 512,
	maxUserImageSizeInKb: 512,
	...fields
});

export const createMockUser = (fields?: Record<string, any>): UserBe => ({
	id: 'id',
	email: 'user@usrer.com',
	name: 'Name',
	...fields
});
