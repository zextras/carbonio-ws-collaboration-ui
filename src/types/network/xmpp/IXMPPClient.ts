/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { TextMessage } from '../../store/MessageTypes';

interface IXMMPClient {
	connect(token: string): void;
	// Presence
	getContactList(): void;
	setOnline(): void;
	// Last activity
	getLastActivity(jid: string): void;
	// Inbox
	getInbox(): void;
	setInbox(): void;
	// Message
	sendChatMessage(roomId: string, message: string, replyTo?: string): void;
	forwardMessage(message: TextMessage, roomIds: string[]): void;
	requestHistory(roomId: string, endHistory: number, quantity?: number): void;
	requestHistoryBetweenTwoMessage(
		roomId: string,
		olderMessageId: string,
		newerMessageId: string
	): void;
	requestRepliedMessage(roomId: string, originalMessageId: string, repliedMessageId: string): void;
	// Chat state
	sendIsWriting(roomId: string): void;
	sendPaused(roomId: string): void;
	// Chat marker
	readMessage(roomId: string, messageId: string): void;
	lastMarkers(roomId: string): void;
}

export default IXMMPClient;
