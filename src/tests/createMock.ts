/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { MeetingBe } from '../types/network/models/meetingBeTypes';
import { MemberBe, RoomBe } from '../types/network/models/roomBeTypes';
import { UserBe } from '../types/network/models/userBeTypes';
import { FileToUpload } from '../types/store/ActiveConversationTypes';
import { Marker, MarkerStatus, MarkerType } from '../types/store/MarkersTypes';
import {
	AffiliationMessage,
	ConfigurationMessage,
	DateMessage,
	MessageFastening,
	MessageType,
	TextMessage
} from '../types/store/MessageTypes';
import { RoomType } from '../types/store/RoomTypes';
import { CapabilityList } from '../types/store/SessionTypes';

type GenericFieldsType = Record<string, string | boolean | number | object | object[]>;

export const createMockRoom = (fields?: GenericFieldsType): RoomBe => ({
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

export const createMockTextMessage = (fields?: GenericFieldsType): TextMessage => ({
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

export const createMockAffiliationMessage = (fields?: GenericFieldsType): AffiliationMessage => ({
	id: 'id',
	roomId: 'roomId',
	date: 1661441294393,
	type: MessageType.AFFILIATION_MSG,
	userId: 'userId',
	as: 'member',
	...fields
});

export const createMockConfigurationMessage = (
	fields?: GenericFieldsType
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
export const createMockDateMessage = (fields?: GenericFieldsType): DateMessage => ({
	id: 'id',
	roomId: 'roomId',
	date: 1661441294393,
	type: MessageType.DATE_MSG,
	...fields
});

export const createMockMessageFastening = (fields?: GenericFieldsType): MessageFastening => ({
	id: 'id',
	roomId: 'roomId',
	date: 1661441294393,
	type: MessageType.FASTENING,
	action: 'delete',
	originalStanzaId: 'originalStanzaId',
	...fields
});

export const createMockMember = (fields?: GenericFieldsType): MemberBe => ({
	userId: 'userId',
	owner: false,
	...fields
});

export const createMockMarker = (fields?: GenericFieldsType): Marker => ({
	from: 'from',
	messageId: 'messageId',
	markerDate: 1662541394393,
	type: MarkerType.DISPLAYED,
	...fields
});

export const createMockCapabilityList = (fields?: GenericFieldsType): CapabilityList => ({
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

export const createMockUser = (fields?: GenericFieldsType): UserBe => ({
	id: 'id',
	email: 'user@user.com',
	name: 'Name',
	...fields
});

export const imageFile = new File(['sunrise'], 'sunrise.png', {
	type: 'image/png'
});

export const pdfFile = new File(['doc'], 'doc.pdf', {
	type: 'application/pdf'
});

export const createMockFile = (fields?: { name: string; options?: GenericFieldsType }): File => {
	const newFile = fields
		? new File(['lotsOfBite'], fields.name, { ...fields.options })
		: new File(['sunrise'], 'sunrise.png', {
				type: 'image/png'
		  });
	return newFile;
};

export const createMockFileToUpload = (fields?: GenericFieldsType): FileToUpload => ({
	fileId: 'genericImageId',
	file: imageFile,
	localUrl: 'localhost/generic/url',
	description: '',
	hasFocus: false,
	...fields
});

export const createMockMeeting = (fields?: Record<string, any>): MeetingBe => ({
	id: 'meetingId',
	roomId: 'roomId',
	participants: [],
	createdAt: '2022-08-25T17:24:28.961+02:00',
	...fields
});
