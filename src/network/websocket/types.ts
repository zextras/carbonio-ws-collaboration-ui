/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// Inbound actions (client -> server)
// Message writes (send, edit, delete, forward) are now REST calls — not WS actions.
export type WsAction =
	| { action: 'ping' }
	| {
			action: 'Typing';
			roomId: string;
	  };

export interface WsAttachment {
	id: string;
	name: string;
	mimeType: string;
	size: number;
}

// Outbound events (server -> client)
export type WsChatEvent =
	| {
			type: 'MessageReceived';
			messageId: string;
			roomId: string;
			senderId: string;
			text: string;
			timestamp: string;
			replyToId?: string;
			attachments?: WsAttachment[];
			// Flat attachment fields (alternative to the attachments array)
			attachmentId?: string;
			attachmentName?: string;
			attachmentMime?: string;
			attachmentSize?: number;
			// Present when this message-received is actually a forwarded message echoed back
			forwardedFrom?: string; // original sender's userId
			forwardedAt?: string; // ISO timestamp of original send
	  }
	| {
			type: 'MessageEdited';
			messageId: string;
			roomId: string;
			senderId: string;
			text: string;
			editedAt: string;
	  }
	| {
			type: 'MessageDeleted';
			messageId: string;
			roomId: string;
			senderId: string;
			deletedAt: string;
	  }
	| {
			type: 'MessageForwarded';
			messageId: string;
			roomId: string;
			originalRoomId: string;
			senderId: string;
			text: string;
			timestamp?: string;
			forwardedFrom?: string; // original sender's userId
			forwardedAt?: string; // ISO timestamp of original send
			attachmentId?: string;
			attachmentName?: string;
			attachmentMime?: string;
			attachmentSize?: number;
	  }
	| {
			type: 'ReactionChanged';
			messageId: string;
			roomId: string;
			userId: string;
			reaction: string;
			operation: 'added' | 'removed';
	  }
	| {
			type: 'ReadUpdated';
			roomId: string;
			userId: string;
			messageId: string;
	  }
	| {
			type: 'PresenceChanged';
			userId: string;
			online: boolean;
	  }
	| { type: 'Pong' }
	| {
			type: 'Typing';
			roomId: string;
			userId: string;
			timestamp: string;
	  }
	| {
			type: 'MessagePinned';
			roomId: string;
			messageId: string;
			pinnedBy: string;
			timestamp: string;
	  }
	| {
			type: 'MessageUnpinned';
			roomId: string;
			messageId: string;
			unpinnedBy: string;
			timestamp: string;
	  }
	| {
			type: 'Error';
			requestId?: string;
			code: string;
			message: string;
	  };

/** All chat event type strings for type narrowing */
export type WsChatEventType = WsChatEvent['type'];

/** Check if a raw WS event is a chat-related event type */
export function isChatEvent(eventType: string): boolean {
	const chatEventTypes: string[] = [
		'MessageReceived',
		'MessageEdited',
		'MessageDeleted',
		'MessageForwarded',
		'MessagePinned',
		'MessageUnpinned',
		'ReactionChanged',
		'ReadUpdated',
		'PresenceChanged',
		'Typing',
		'Pong',
		'Error'
	];
	return chatEventTypes.includes(eventType);
}
