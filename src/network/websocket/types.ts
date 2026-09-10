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
			status?: 'started' | 'stopped';
	  };

export interface WsAttachment {
	id: string;
	name: string;
	mimeType: string;
	size: number;
	area?: string;
}

export interface WsTimelineMessage {
	id: string;
	roomId: string;
	senderId: string;
	text: string;
	createdAt: string;
	replyToId?: string;
	repliedMessage?: WsTimelineMessage;
	attachment?: WsAttachment;
	reactions?: Array<{ reaction: string; userIds: string[] }>;
	forwardedInfo?: { originalSenderId: string; originalSentAt: string };
	editedInfo?: { editedAt: string };
	deletedInfo?: { deletedBy: string; deletedAt: string };
}

// Outbound events (server -> client)
export type WsChatEvent =
	| {
			type: 'MessageReceived';
			sentDate: string;
			message: WsTimelineMessage;
			tempId?: string;
	  }
	| {
			type: 'MessageEdited';
			messageId: string;
			roomId: string;
			text: string;
			editedAt: string;
	  }
	| {
			type: 'MessageDeleted';
			messageId: string;
			roomId: string;
			deletedBy: string;
			deletedAt: string;
	  }
	| {
			type: 'MessageForwarded';
			sentDate: string;
			message: WsTimelineMessage;
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
			status?: 'started' | 'stopped';
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
