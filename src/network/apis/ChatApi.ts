/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { fetchAPI } from '../../utils/FetchUtils';
import { RequestType } from '../../types/network/apis/IBaseAPI';
import { IChatApi } from '../../types/network/apis/IChatApi';
import {
	ChatMessage,
	ContactsResponse,
	InboxResponse,
	MessageHistoryResponse,
	MessageSearchResponse,
	PresenceBatchResponse,
	ReadMarker,
	RoomReadMarkers,
	TimelineResponse
} from '../../types/network/models/chatTypes';

class ChatApi implements IChatApi {
	private static instance: ChatApi;

	public static getInstance(): ChatApi {
		if (!ChatApi.instance) {
			ChatApi.instance = new ChatApi();
		}
		return ChatApi.instance;
	}

	// ==================== TIMELINE ====================

	public getTimeline(
		roomId: string,
		before?: string,
		limit?: number
	): Promise<TimelineResponse> {
		const params = new URLSearchParams();
		if (before) params.append('before', before);
		if (limit) params.append('limit', limit.toString());
		const queryString = params.toString() ? `?${params.toString()}` : '';

		return fetchAPI(`rooms/${roomId}/timeline${queryString}`, RequestType.GET);
	}

	// ==================== MESSAGES ====================

	public getMessageHistory(
		roomId: string,
		before?: string,
		limit?: number
	): Promise<MessageHistoryResponse> {
		const params = new URLSearchParams();
		if (before) params.append('before', before);
		if (limit) params.append('limit', limit.toString());
		const queryString = params.toString() ? `?${params.toString()}` : '';

		return fetchAPI(`rooms/${roomId}/message${queryString}`, RequestType.GET);
	}

	public sendMessage(
		roomId: string,
		text: string,
		messageId?: string,
		replyToId?: string
	): Promise<ChatMessage> {
		const body: Record<string, unknown> = { text };
		if (messageId) body.messageId = messageId;
		if (replyToId) body.replyToId = replyToId;

		return fetchAPI(`rooms/${roomId}/message`, RequestType.POST, body);
	}

	public getMessage(roomId: string, messageId: string): Promise<ChatMessage> {
		return fetchAPI(`rooms/${roomId}/message/${messageId}`, RequestType.GET);
	}

	public editMessage(roomId: string, messageId: string, text: string): Promise<ChatMessage> {
		return fetchAPI(`rooms/${roomId}/message/${messageId}`, RequestType.PUT, { text });
	}

	public deleteMessage(roomId: string, messageId: string): Promise<void> {
		return fetchAPI(`rooms/${roomId}/message/${messageId}`, RequestType.DELETE);
	}

	public getMessagesByIds(roomId: string, messageIds: string[]): Promise<ChatMessage[]> {
		return fetchAPI(`rooms/${roomId}/message/batch`, RequestType.POST, { messageIds });
	}

	public searchMessages(
		roomId: string,
		query: string,
		before?: string,
		limit?: number
	): Promise<MessageSearchResponse> {
		const params = new URLSearchParams();
		params.append('q', query);
		if (before) params.append('before', before);
		if (limit) params.append('limit', limit.toString());

		return fetchAPI(`rooms/${roomId}/message/search?${params.toString()}`, RequestType.GET);
	}

	// ==================== REACTIONS ====================

	public addReaction(roomId: string, messageId: string, reaction: string): Promise<void> {
		return fetchAPI(`rooms/${roomId}/message/${messageId}/reaction`, RequestType.POST, {
			reaction
		});
	}

	public removeReaction(roomId: string, messageId: string, reaction: string): Promise<void> {
		const encodedReaction = encodeURIComponent(reaction);
		return fetchAPI(
			`rooms/${roomId}/message/${messageId}/reaction/${encodedReaction}`,
			RequestType.DELETE
		);
	}

	// ==================== READ MARKERS ====================

	public setReadMarker(roomId: string, messageId: string): Promise<ReadMarker> {
		return fetchAPI(`rooms/${roomId}/read`, RequestType.PUT, { messageId });
	}

	public getRoomReadMarkers(roomId: string): Promise<RoomReadMarkers> {
		return fetchAPI(`rooms/${roomId}/read`, RequestType.GET);
	}

	// ==================== TYPING ====================

	public sendTypingIndicator(roomId: string, isTyping: boolean): Promise<void> {
		return fetchAPI(`rooms/${roomId}/typing`, RequestType.POST, { isTyping });
	}

	// ==================== INBOX ====================

	public getInbox(): Promise<InboxResponse> {
		return fetchAPI('inbox', RequestType.GET);
	}

	// ==================== PRESENCE ====================

	public setPresence(online: boolean): Promise<void> {
		return fetchAPI('presence', RequestType.PUT, { online });
	}

	public getPresenceBatch(userIds: string[]): Promise<PresenceBatchResponse> {
		return fetchAPI('presence/batch', RequestType.POST, { userIds });
	}

	// ==================== CONTACTS ====================

	public getContacts(): Promise<ContactsResponse> {
		return fetchAPI('contacts', RequestType.GET);
	}
}

export default ChatApi.getInstance();
