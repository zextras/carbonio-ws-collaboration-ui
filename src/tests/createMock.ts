/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { AccountSettings } from '@zextras/carbonio-shell-ui';

import {
	MeetingBe,
	MeetingParticipantBe,
	MeetingType
} from '../types/network/models/meetingBeTypes';
import { MemberBe, RoomBe } from '../types/network/models/roomBeTypes';
import { UserBe } from '../types/network/models/userBeTypes';
import { FileToUpload } from '../types/store/ActiveConversationTypes';
import {
	ConfigurationMessage,
	DateMessage,
	FasteningAction,
	Marker,
	MarkerStatus,
	MessageFastening,
	MessageType,
	OperationType,
	TextMessage
} from '../types/store/ChatsRegistryTypes';
import { RoomType } from '../types/store/RoomTypes';
import { User, UserType } from '../types/store/UserTypes';

const timeStampString = '2022-08-25T17:24:28.961+02:00';

export const createMockRoom = (fields?: Partial<RoomBe>): RoomBe => ({
	id: 'id',
	name: 'name',
	description: 'description',
	type: RoomType.GROUP,
	createdAt: timeStampString,
	updatedAt: timeStampString,
	members: [],
	userSettings: {
		muted: false
	},
	...fields
});

export const createMockTextMessage = (fields?: Partial<TextMessage>): TextMessage => ({
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

export const createMockConfigurationMessage = (
	fields?: Partial<ConfigurationMessage>
): ConfigurationMessage => ({
	id: 'id',
	roomId: 'roomId',
	date: 1661441294393,
	type: MessageType.CONFIGURATION_MSG,
	operation: OperationType.ROOM_NAME_CHANGED,
	value: 'Right',
	from: 'Wrong',
	read: MarkerStatus.UNREAD,
	...fields
});

export const createMockDateMessage = (fields?: Partial<DateMessage>): DateMessage => ({
	id: 'id',
	roomId: 'roomId',
	date: 1661441294393,
	type: MessageType.DATE_MSG,
	...fields
});

export const createMockMessageFastening = (
	fields?: Partial<MessageFastening>
): MessageFastening => ({
	id: 'id',
	roomId: 'roomId',
	date: 1661441294393,
	type: MessageType.FASTENING,
	action: FasteningAction.DELETE,
	originalStanzaId: 'originalStanzaId',
	from: 'from',
	stanzaId: 'stanzaId',
	...fields
});

export const createMockMember = (fields?: Partial<MemberBe>): MemberBe => ({
	userId: 'userId',
	owner: false,
	...fields
});

export const createMockMarker = (fields?: Partial<Marker>): Marker => ({
	from: 'from',
	messageId: 'messageId',
	markerDate: 1662541394393,
	type: 'displayed',
	...fields
});

export const createMockAttributesList = (
	fields?: Partial<AccountSettings['attrs']>
): AccountSettings['attrs'] => ({
	carbonioWscAttachmentUpload: 'TRUE',
	carbonioWscGroupChatCreation: 'TRUE',
	carbonioWscMaxAttachmentSize: '2',
	carbonioWscMaxGroupMembers: '32',
	carbonioWscMaxRoomPictureSize: '2',
	carbonioWscMessageDeleteTimeLimit: '5m',
	carbonioWscMessageEditTimeLimit: '5m',
	carbonioWscPrivateChatCreation: 'TRUE',
	carbonioWscRecordingEnabled: 'TRUE',
	carbonioWscShowMessageReads: 'TRUE',
	carbonioWscShowUsersPresence: 'TRUE',
	carbonioWscVideoCallEnabled: 'TRUE',
	carbonioWscVirtualBackgroundEnabled: 'TRUE',
	...fields
});

export const createMockUser = (fields?: Partial<User>): UserBe => ({
	id: 'id',
	email: 'user@user.com',
	name: 'Name',
	type: UserType.INTERNAL,
	...fields
});

export const imageFile = new File(['sunrise'], 'sunrise.png', {
	type: 'image/png'
});

export const pdfFile = new File(['doc'], 'doc.pdf', {
	type: 'application/pdf'
});

export const createMockFile = (fields?: {
	name?: string;
	options?: Partial<FilePropertyBag>;
}): File =>
	new File(['lotsOfBite'], fields?.name ?? 'file.png', { type: 'image/png', ...fields?.options });

export const createMockFileToUpload = (fields?: Partial<FileToUpload>): FileToUpload => ({
	fileId: 'genericImageId',
	file: imageFile,
	localUrl: 'localhost/generic/url',
	description: '',
	hasFocus: false,
	...fields
});

export const createMockMeeting = (fields?: Partial<MeetingBe>): MeetingBe => ({
	id: 'meetingId',
	name: '',
	roomId: 'roomId',
	active: true,
	participants: [],
	createdAt: timeStampString,
	meetingType: MeetingType.PERMANENT,
	...fields
});

export const createMockParticipants = (
	fields?: Partial<MeetingParticipantBe>
): MeetingParticipantBe => ({
	userId: 'userId',
	audioStreamEnabled: false,
	videoStreamEnabled: false,
	joinedAt: timeStampString,
	...fields
});
