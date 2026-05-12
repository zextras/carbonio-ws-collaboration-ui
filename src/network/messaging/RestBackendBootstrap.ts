/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import useStore from '../../store/Store';
import { InboxResponse, SystemEventType } from '../../types/network/models/chatTypes';
import {
	MessageType,
	MarkerStatus,
	TextMessage,
	ConfigurationMessage,
	OperationType,
	Marker
} from '../../types/store/ChatsRegistryTypes';
import { dateToTimestamp, isBefore } from '../../utils/dateUtils';

const mapEventTypeToOperation = (eventType: SystemEventType): OperationType => {
	switch (eventType) {
		case 'ROOM_CREATED':
			return OperationType.ROOM_CREATION;
		case 'MEMBER_ADDED':
			return OperationType.MEMBER_ADDED;
		case 'MEMBER_REMOVED':
			return OperationType.MEMBER_REMOVED;
		case 'MEETING_STARTED':
			return OperationType.MEETING_STARTED;
		case 'MEETING_ENDED':
			return OperationType.MEETING_ENDED;
		case 'MEETING_DECLINED':
			return OperationType.MEETING_DECLINED;
		default:
			return OperationType.ROOM_CREATION;
	}
};

const extractEventActorAndMember = (
	eventType: SystemEventType,
	content: Record<string, unknown> | undefined
): { actorId: string; memberId: string } => {
	if (!content) return { actorId: '', memberId: '' };
	switch (eventType) {
		case 'ROOM_CREATED':
			return {
				actorId: (content.creatorId as string) || '',
				memberId: ''
			};
		case 'MEMBER_ADDED': {
			const addedUserIds = content.addedUserIds as string[] | undefined;
			return {
				actorId: (content.addedByUserId as string) || '',
				memberId: addedUserIds?.[0] || ''
			};
		}
		case 'MEMBER_REMOVED':
			return {
				actorId: (content.removedByUserId as string) || '',
				memberId: (content.removedUserId as string) || ''
			};
		case 'MEETING_STARTED':
			return {
				actorId: (content.startedBy as string) || '',
				memberId: ''
			};
		case 'MEETING_ENDED':
			return {
				actorId: (content.endedBy as string) || '',
				memberId: String(content.durationSec ?? '')
			};
		case 'MEETING_DECLINED':
			return {
				actorId: (content.declinedBy as string) || '',
				memberId: ''
			};
		default:
			return { actorId: '', memberId: '' };
	}
};

const calcReadStatusFromMarkers = (
	messageId: string,
	messageDate: number,
	senderId: string,
	apiMarkers:
		| Array<{
				userId: string;
				messageId: string;
				readAt: string;
		  }>
		| undefined,
	members: Array<{ userId: string }> | undefined,
	sessionId: string | undefined
): MarkerStatus => {
	if (senderId !== sessionId) return MarkerStatus.UNREAD;
	if (!apiMarkers || apiMarkers.length === 0 || !members) return MarkerStatus.UNREAD;

	const readByCount = apiMarkers.filter((marker) => {
		if (marker.userId === sessionId) return false;
		const markerDate = dateToTimestamp(marker.readAt);
		return isBefore(messageDate, markerDate) || marker.messageId === messageId;
	}).length;

	const otherMembersCount = members.filter((m) => m.userId !== sessionId).length;

	if (readByCount >= otherMembersCount && otherMembersCount > 0) return MarkerStatus.READ;
	if (readByCount > 0) return MarkerStatus.READ_BY_SOMEONE;
	return MarkerStatus.UNREAD;
};

export function hydrateStoreFromInbox(
	inboxResponse: InboxResponse,
	sessionId: string | undefined
): void {
	const { addRooms, newInboxMessage, setUnreadCount, setUserPresence } = useStore.getState();

	const conversations = inboxResponse?.conversations ?? [];
	const rooms = conversations.map((conv) => conv.room);
	addRooms(rooms);

	rooms.forEach((room) => {
		room.members?.forEach((m) => {
			if (m.online !== undefined) {
				setUserPresence(m.userId, m.online, m.lastActivity);
			}
		});
	});

	conversations.forEach((conv) => {
		setUnreadCount(conv.roomId, conv.unreadCount);

		if (conv.markers && conv.markers.length > 0) {
			const { updateReadStatus } = useStore.getState();
			const storeMarkers: Marker[] = conv.markers.map((m) => ({
				from: m.userId,
				messageId: m.messageId,
				markerDate: dateToTimestamp(m.readAt),
				type: 'displayed' as const
			}));
			updateReadStatus(conv.roomId, storeMarkers);
		}

		const msgDate = conv.lastMessage ? dateToTimestamp(conv.lastMessage.createdAt) : 0;
		const eventDate = conv.lastEvent ? dateToTimestamp(conv.lastEvent.createdAt) : 0;

		if (msgDate >= eventDate && conv.lastMessage) {
			const msg = conv.lastMessage;
			const readStatus = calcReadStatusFromMarkers(
				msg.id,
				dateToTimestamp(msg.createdAt),
				msg.senderId,
				conv.markers,
				conv.room.members,
				sessionId
			);
			const textMessage: TextMessage = {
				id: msg.id,
				stanzaId: msg.id,
				roomId: msg.roomId,
				date: dateToTimestamp(msg.createdAt),
				type: MessageType.TEXT_MSG,
				from: msg.senderId,
				text: msg.text || msg.attachment?.name || '',
				read: readStatus,
				forwardedInfo: msg.forwardedInfo,
				editedInfo: msg.editedInfo,
				deletedInfo: msg.deletedInfo,
				attachment: msg.attachment
					? {
							id: msg.attachment.id,
							name: msg.attachment.name,
							mimeType: msg.attachment.mimeType,
							size: msg.attachment.size
						}
					: undefined
			};
			newInboxMessage(textMessage);
		} else if (conv.lastEvent) {
			const evt = conv.lastEvent;
			const { actorId, memberId } = extractEventActorAndMember(
				evt.type,
				evt.content as Record<string, unknown> | undefined
			);
			const configMessage: ConfigurationMessage = {
				id: evt.id,
				roomId: conv.roomId,
				date: dateToTimestamp(evt.createdAt),
				type: MessageType.CONFIGURATION_MSG,
				operation: mapEventTypeToOperation(evt.type),
				value: memberId,
				from: actorId,
				read: MarkerStatus.UNREAD
			};
			newInboxMessage(configMessage);
		}
	});
}
