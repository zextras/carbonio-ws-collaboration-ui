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
	RoomReadMarkers,
	TimelineResponse
} from '../../types/network/models/chatTypes';
import RoomsApi from './RoomsApi';

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
		options?: {
			before?: string;
			after?: string;
			around?: string;
			limit?: number;
		}
	): Promise<TimelineResponse> {
		const params = new URLSearchParams();
		if (options?.before) params.append('before', options.before);
		if (options?.after) params.append('after', options.after);
		if (options?.around) params.append('around', options.around);
		if (options?.limit) params.append('limit', options.limit.toString());
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
		// Check if this is a placeholder room
		const placeholderRoom = roomId.split('placeholder-');
		if (placeholderRoom[1]) {
			// First create the real room, then send the message
			return RoomsApi.replacePlaceholderRoom(placeholderRoom[1]).then((response) =>
				this.sendMessage(response.id, text, messageId, replyToId)
			);
		}

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

	public pinMessage(roomId: string, messageId: string): Promise<void> {
		return fetchAPI(`rooms/${roomId}/messages/${messageId}/pin`, RequestType.PUT);
	}

	public unpinMessage(roomId: string, messageId: string): Promise<void> {
		return fetchAPI(`rooms/${roomId}/messages/${messageId}/pin`, RequestType.DELETE);
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

	public setReadMarker(roomId: string): Promise<void> {
		// Always marks all messages in the room as read (no body needed)
		return fetchAPI(`rooms/${roomId}/read`, RequestType.PUT);
	}

	public getRoomReadMarkers(roomId: string): Promise<RoomReadMarkers> {
		return fetchAPI(`rooms/${roomId}/read`, RequestType.GET);
	}

	// ==================== INBOX ====================

	public getInbox(): Promise<InboxResponse> {
		return fetchAPI('inbox', RequestType.GET);
	}

	// ==================== PRESENCE ====================

	public getPresenceBatch(userIds: string[]): Promise<PresenceBatchResponse> {
		return fetchAPI('presence/batch', RequestType.POST, { userIds });
	}

	// ==================== CONTACTS ====================

	public getContacts(): Promise<ContactsResponse> {
		return fetchAPI('contacts', RequestType.GET);
	}
}

export default ChatApi.getInstance();
