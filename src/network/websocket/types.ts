/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// Inbound actions (client -> server)
export type WsAction =
	| {
			action: 'send-message';
			requestId: string;
			roomId: string;
			text: string;
			replyToId?: string;
			attachmentId?: string;
	  }
	| {
			action: 'edit-message';
			requestId: string;
			roomId: string;
			messageId: string;
			text: string;
	  }
	| {
			action: 'delete-message';
			requestId: string;
			roomId: string;
			messageId: string;
	  }
	| {
			action: 'forward-message';
			requestId: string;
			roomId: string;
			messageId: string;
			toRoomId: string;
	  }
	| { action: 'ping' }
	| {
			action: 'typing';
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
			type: 'message-received';
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
			type: 'message-sent';
			requestId: string;
			messageId: string;
			roomId: string;
			timestamp: string;
	  }
	| {
			type: 'message-edited';
			messageId: string;
			roomId: string;
			senderId: string;
			text: string;
			editedAt: string;
	  }
	| {
			type: 'message-deleted';
			messageId: string;
			roomId: string;
			senderId: string;
			deletedAt: string;
	  }
	| {
			type: 'message-forwarded';
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
			type: 'reaction-changed';
			messageId: string;
			roomId: string;
			userId: string;
			reaction: string;
			operation: 'added' | 'removed';
	  }
	| {
			type: 'read-updated';
			roomId: string;
			userId: string;
			messageId: string;
	  }
	| {
			type: 'presence-changed';
			userId: string;
			online: boolean;
	  }
	| { type: 'pong' }
	| {
			type: 'typing';
			roomId: string;
			userId: string;
			timestamp: string;
	  }
	| {
			type: 'message-pinned';
			roomId: string;
			messageId: string;
			pinnedBy: string;
			timestamp: string;
	  }
	| {
			type: 'message-unpinned';
			roomId: string;
			messageId: string;
			unpinnedBy: string;
			timestamp: string;
	  }
	| {
			type: 'error';
			requestId?: string;
			code: string;
			message: string;
	  };

/** All chat event type strings for type narrowing */
export type WsChatEventType = WsChatEvent['type'];

/** Check if a raw WS event is a chat-related event type */
export function isChatEvent(eventType: string): boolean {
	const chatEventTypes: string[] = [
		'message-received',
		'message-sent',
		'message-edited',
		'message-deleted',
		'message-forwarded',
		'message-pinned',
		'message-unpinned',
		'reaction-changed',
		'read-updated',
		'presence-changed',
		'typing',
		'pong',
		'error'
	];
	return chatEventTypes.includes(eventType);
}
