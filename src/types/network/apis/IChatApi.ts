/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import {
	ChatMessage,
	MessageHistoryResponse,
	MessageSearchResponse,
	ReadMarker,
	RoomReadMarkers,
	InboxResponse,
	PresenceBatchResponse,
	ContactsResponse,
	PresenceStatus,
	TimelineResponse
} from '../models/chatTypes';

export interface IChatApi {
	// ==================== TIMELINE ====================

	/**
	 * Gets timeline for a room (messages + system events) using cursor-based pagination
	 */
	getTimeline(roomId: string, before?: string, limit?: number): Promise<TimelineResponse>;

	// ==================== MESSAGES ====================

	/**
	 * Gets message history for a room using cursor-based pagination
	 */
	getMessageHistory(
		roomId: string,
		before?: string,
		limit?: number
	): Promise<MessageHistoryResponse>;

	/**
	 * Sends a new message to a room
	 */
	sendMessage(
		roomId: string,
		text: string,
		messageId?: string,
		replyToId?: string
	): Promise<ChatMessage>;

	/**
	 * Gets a specific message by ID
	 */
	getMessage(roomId: string, messageId: string): Promise<ChatMessage>;

	/**
	 * Edits an existing message
	 */
	editMessage(roomId: string, messageId: string, text: string): Promise<ChatMessage>;

	/**
	 * Deletes (retracts) a message
	 */
	deleteMessage(roomId: string, messageId: string): Promise<void>;

	/**
	 * Gets specific messages by their IDs
	 */
	getMessagesByIds(roomId: string, messageIds: string[]): Promise<ChatMessage[]>;

	/**
	 * Full-text search in room messages
	 */
	searchMessages(
		roomId: string,
		query: string,
		before?: string,
		limit?: number
	): Promise<MessageSearchResponse>;

	// ==================== REACTIONS ====================

	/**
	 * Adds a reaction to a message
	 */
	addReaction(roomId: string, messageId: string, reaction: string): Promise<void>;

	/**
	 * Removes a reaction from a message
	 */
	removeReaction(roomId: string, messageId: string, reaction: string): Promise<void>;

	// ==================== READ MARKERS ====================

	/**
	 * Sets read marker for the current user in a room
	 */
	setReadMarker(roomId: string, messageId: string): Promise<ReadMarker>;

	/**
	 * Gets all read markers for a room
	 */
	getRoomReadMarkers(roomId: string): Promise<RoomReadMarkers>;

	// ==================== TYPING ====================

	/**
	 * Sends typing indicator for a room
	 */
	sendTypingIndicator(roomId: string, isTyping: boolean): Promise<void>;

	// ==================== INBOX ====================

	/**
	 * Gets user inbox with conversations and unread counts
	 */
	getInbox(): Promise<InboxResponse>;

	// ==================== PRESENCE ====================

	/**
	 * Sets current user presence status
	 */
	setPresence(online: boolean): Promise<void>;

	/**
	 * Gets presence status for multiple users
	 */
	getPresenceBatch(userIds: string[]): Promise<PresenceBatchResponse>;

	// ==================== CONTACTS ====================

	/**
	 * Gets user contacts with presence status
	 */
	getContacts(): Promise<ContactsResponse>;
}
