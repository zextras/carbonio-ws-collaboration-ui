/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import {
	ChatMessage,
	ReadMarker,
	ReactionGroup,
	TimelineItem,
	SystemEvent,
	SystemEventType
} from '../../types/network/models/chatTypes';
import {
	TextMessage,
	ConfigurationMessage,
	Message,
	MessageType,
	MarkerStatus,
	MessageFastening,
	OperationType,
	FasteningAction,
	Marker
} from '../../types/store/ChatsRegistryTypes';

/**
 * Maps a ChatMessage from the REST API to a TextMessage for the store.
 */
export function mapChatMessageToTextMessage(
	chatMessage: ChatMessage,
	currentUserId: string
): TextMessage {
	// All messages start as UNREAD - updateReadStatus will calculate the correct status
	// based on markers. Own messages will show grey checkmarks initially, then blue
	// when all other members have read them.
	const readStatus = MarkerStatus.UNREAD;

	return {
		id: chatMessage.id,
		stanzaId: chatMessage.id,
		roomId: chatMessage.roomId,
		type: MessageType.TEXT_MSG,
		date: new Date(chatMessage.createdAt).getTime(),
		from: chatMessage.senderId,
		text: chatMessage.deletedInfo ? '' : chatMessage.text,
		read: readStatus,
		deleted: chatMessage.deletedInfo ? true : undefined,
		edited: chatMessage.editedInfo ? true : undefined,
		forwarded: chatMessage.forwardedInfo
			? {
					from: chatMessage.forwardedInfo.originalSenderId,
					date: new Date(chatMessage.forwardedInfo.originalSentAt).getTime(),
					id: chatMessage.id,
					count: 1
				}
			: undefined,
		replyTo: chatMessage.replyToId,
		repliedMessage: chatMessage.replyTo
			? ({
					id: chatMessage.replyTo.id,
					stanzaId: chatMessage.replyTo.id,
					roomId: chatMessage.roomId,
					type: MessageType.TEXT_MSG,
					date: 0, // We don't have the original date
					from: chatMessage.replyTo.senderId ?? '',
					text: chatMessage.replyTo.deleted ? '' : (chatMessage.replyTo.text ?? ''),
					read: MarkerStatus.READ,
					...(chatMessage.replyTo.deleted ? { deleted: true } : {})
				} as TextMessage)
			: chatMessage.replyToId
				? ({
						id: chatMessage.replyToId,
						stanzaId: chatMessage.replyToId,
						roomId: chatMessage.roomId,
						type: MessageType.TEXT_MSG,
						date: 0,
						from: '',
						text: '',
						read: MarkerStatus.READ
					} as TextMessage)
				: undefined,
		attachment: chatMessage.attachment
			? {
					id: chatMessage.attachment.id,
					name: chatMessage.attachment.name,
					mimeType: chatMessage.attachment.mimeType,
					size: chatMessage.attachment.size
				}
			: undefined
	};
}

/**
 * Maps reaction groups from the REST API to fastening messages for the store.
 */
export function mapReactionsToFastenings(
	messageId: string,
	roomId: string,
	reactions: ReactionGroup[]
): MessageFastening[] {
	const fastenings: MessageFastening[] = [];

	reactions.forEach((group) => {
		group.userIds.forEach((userId) => {
			fastenings.push({
				id: `${messageId}-${userId}-${group.reaction}`,
				stanzaId: `${messageId}-${userId}-${group.reaction}`,
				roomId,
				type: MessageType.FASTENING,
				date: Date.now(),
				originalStanzaId: messageId,
				action: FasteningAction.REACTION,
				value: group.reaction,
				from: userId
			});
		});
	});

	return fastenings;
}

/**
 * Maps SystemEventType from the REST API to OperationType for the store.
 */
function mapSystemEventTypeToOperation(eventType: SystemEventType): OperationType {
	switch (eventType) {
		case 'ROOM_CREATED':
			return OperationType.ROOM_CREATION;
		case 'MEMBER_ADDED':
			return OperationType.MEMBER_ADDED;
		case 'MEMBER_REMOVED':
			return OperationType.MEMBER_REMOVED;
		case 'MESSAGE_PINNED':
			return OperationType.MESSAGE_PINNED;
		case 'MESSAGE_UNPINNED':
			return OperationType.MESSAGE_UNPINNED;
		case 'MEETING_STARTED':
			return OperationType.MEETING_STARTED;
		case 'MEETING_ENDED':
			return OperationType.MEETING_ENDED;
		case 'MEETING_DECLINED':
			return OperationType.MEETING_DECLINED;
		default:
			return OperationType.ROOM_CREATION;
	}
}

/**
 * Extracts actorId and memberId from event content based on event type.
 * Backend uses different field names for each event type.
 */
function extractEventActorAndMember(
	eventType: SystemEventType,
	content: Record<string, unknown> | undefined
): { actorId: string; memberId: string } {
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
		case 'MESSAGE_PINNED':
			return {
				actorId: (content?.pinnedBy as string) ?? '',
				memberId: (content?.messageId as string) ?? ''
			};
		case 'MESSAGE_UNPINNED':
			return {
				actorId: (content?.unpinnedBy as string) ?? '',
				memberId: (content?.messageId as string) ?? ''
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
}

/**
 * Maps a SystemEvent from the REST API to a ConfigurationMessage for the store.
 */
export function mapSystemEventToConfigurationMessage(
	systemEvent: SystemEvent,
	roomId: string
): ConfigurationMessage {
	const { actorId, memberId } = extractEventActorAndMember(
		systemEvent.type,
		systemEvent.content as Record<string, unknown> | undefined
	);

	return {
		id: systemEvent.id,
		roomId,
		type: MessageType.CONFIGURATION_MSG,
		date: new Date(systemEvent.createdAt).getTime(),
		operation: mapSystemEventTypeToOperation(systemEvent.type),
		value: memberId,
		from: actorId,
		read: MarkerStatus.READ // System events don't have read status
	};
}

/**
 * Maps a TimelineItem from the REST API to a Message for the store.
 */
export function mapTimelineItemToMessage(
	item: TimelineItem,
	roomId: string,
	currentUserId: string
): Message {
	if (item.itemType === 'message') {
		return mapChatMessageToTextMessage(item.message, currentUserId);
	}
	return mapSystemEventToConfigurationMessage(item.systemEvent, roomId);
}

/**
 * Maps an array of TimelineItems to Messages for the store.
 */
export function mapTimelineItemsToMessages(
	items: TimelineItem[],
	roomId: string,
	currentUserId: string
): Message[] {
	return items.map((item) => mapTimelineItemToMessage(item, roomId, currentUserId));
}

/**
 * Maps ReadMarker from the REST API to Marker for the store.
 */
export function mapReadMarkerToMarker(readMarker: ReadMarker): Marker {
	return {
		from: readMarker.userId,
		messageId: readMarker.messageId,
		markerDate: new Date(readMarker.readAt).getTime(),
		type: 'displayed'
	};
}

/**
 * Maps an array of ReadMarkers from the REST API to Markers for the store.
 */
export function mapReadMarkersToMarkers(readMarkers: ReadMarker[]): Marker[] {
	return readMarkers.map(mapReadMarkerToMarker);
}
