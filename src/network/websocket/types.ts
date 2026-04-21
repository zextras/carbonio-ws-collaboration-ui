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
			attachments?: WsAttachment[];
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
	| {
			action: 'mark-read';
			requestId: string;
			roomId: string;
			messageId: string;
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
	  }
	| {
			type: 'reaction-changed';
			messageId: string;
			roomId: string;
			userId: string;
			reaction: string;
			added: boolean;
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
		'reaction-changed',
		'read-updated',
		'presence-changed',
		'typing',
		'pong',
		'error'
	];
	return chatEventTypes.includes(eventType);
}
