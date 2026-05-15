/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export interface IMessagingService {
	// Lifecycle
	connect(token: string): void;
	setOnline(): void;
	getLastActivity(jid: string): void;
	sendPong(ping: Element): void;

	// Messages
	sendMessage(roomId: string, text: string): void;
	sendReply(roomId: string, text: string, replyTo: string, replyMessageId: string): void;
	editMessage(roomId: string, text: string, stanzaId: string, parentStanzaId: string): void;
	deleteMessage(roomId: string, stanzaId: string): void;
	sendReaction(roomId: string, stanzaId: string, reaction: string): void;

	// History & Search
	requestHistory(roomId: string, endHistory: number, quantity?: number, unread?: number): void;
	requestFullHistory(roomId: string, from?: number): void;
	requestHistoryBetweenDates(roomId: string, afterDate: number, beforeDate: number): void;
	requestMessageSubjectOfReply(
		roomId: string,
		messageSubjectOfReplyId: string,
		replyMessageId: string
	): void;
	requestMessageToForward(
		roomId: string,
		messageToForwardStanzaId: string,
		queryId: string
	): Promise<void>;
	requestMessageResultHistoryToId(roomId: string, stanzaId: string): Promise<void>;
	searchMessages(roomId: string, text: string): Promise<void>;

	// Typing indicators
	sendTyping(roomId: string): void;
	sendTypingPaused(roomId: string): void;

	// Read markers
	markAsRead(roomId: string, messageId: string): void;
	requestReadMarkers(roomId: string): void;

	// Pins
	pinMessage(roomId: string, stanzaId: string): void;
	unpinMessage(roomId: string, stanzaId: string): void;
	getPinnedMessage(roomId: string): void;

	readonly features: string[];
}
