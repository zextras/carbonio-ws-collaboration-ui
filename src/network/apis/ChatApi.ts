/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { produce } from 'immer';
import { v4 as uuidv4 } from 'uuid';

import RoomsApi from './RoomsApi';
import { RequestType } from '../../types/network/apis/IBaseAPI';
import { IChatApi } from '../../types/network/apis/IChatApi';
import {
	ChatMessage,
	ContactsResponse,
	InboxResponse,
	MessageHistoryResponse,
	MessageSearchResponse,
	PinnedMessageResponse,
	PresenceBatchResponse,
	RoomReadMarkers,
	TimelineResponse
} from '../../types/network/models/chatTypes';
import useStore from '../../store/Store';
import { MarkerStatus, MessageType, TextMessage } from '../../types/store/ChatsRegistryTypes';
import { fetchAPI } from '../../utils/FetchUtils';

class ChatApi implements IChatApi {
	private static instance: ChatApi;

	/**
	 * Per-room FIFO send queue.
	 * Ensures messages in the same room are dispatched sequentially so the server
	 * receives them in the order the user typed them, even under high concurrency.
	 */
	private sendQueues = new Map<string, Promise<unknown>>();

	/**
	 * Enqueue a task for a specific room.
	 * The task only starts after the previous task for the same room has resolved or rejected.
	 * Different rooms run their queues independently (no cross-room blocking).
	 */
	private enqueue<T>(roomId: string, fn: () => Promise<T>): Promise<T> {
		const prev = this.sendQueues.get(roomId) ?? Promise.resolve();
		const next = prev.then(fn, fn); // run fn even if the previous task failed
		// Store a non-rejecting tail so the chain never gets "stuck" on a rejection
		this.sendQueues.set(roomId, next.catch(() => undefined));
		return next;
	}

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
			/** Message ID that anchors composite cursor pagination together with `before` (BUG-12) */
			beforeId?: string;
			after?: string;
			around?: string;
			limit?: number;
		}
	): Promise<TimelineResponse> {
		const params = new URLSearchParams();
		if (options?.before) params.append('before', options.before);
		if (options?.beforeId) params.append('beforeId', options.beforeId);
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

		return fetchAPI(`rooms/${roomId}/messages${queryString}`, RequestType.GET);
	}

	public sendMessage(
		roomId: string,
		text: string,
		replyToId?: string
	): Promise<ChatMessage> {
		const placeholderRoom = roomId.split('placeholder-');
		if (placeholderRoom[1]) {
			return RoomsApi.replacePlaceholderRoom(placeholderRoom[1]).then((response) =>
				this.sendMessage(response.id, text, replyToId)
			);
		}

		const stableId = uuidv4();

		useStore.getState().setPlaceholderMessage({
			id: stableId,
			roomId,
			text,
			replyTo: replyToId
		});

		const body: Record<string, unknown> = { text };
		if (replyToId) body.replyToId = replyToId;

		return this.enqueue(roomId, () =>
			fetchAPI<ChatMessage>(`rooms/${roomId}/messages`, RequestType.POST, body).then((response) => {
				// Promote the placeholder: replace provisional id/timestamp with server-assigned values.
				const confirmedDate = new Date(response.createdAt ?? Date.now()).getTime();
				useStore.setState(
					produce((draft) => {
						const registry = draft.chatsRegistry[roomId];
						if (!registry) return;
						const msg = registry.messages.find(
							(m: TextMessage) => m.id === stableId
						) as TextMessage | undefined;
						if (msg && msg.type === MessageType.TEXT_MSG) {
							msg.id = response.id;
							msg.stanzaId = response.id;
							msg.date = confirmedDate;
							msg.read = MarkerStatus.UNREAD;
						}
						if (
							registry.lastMessage &&
							registry.lastMessage.type === MessageType.TEXT_MSG &&
							(registry.lastMessage.id === stableId ||
								registry.lastMessage.stanzaId === `placeholder_${stableId}`)
						) {
							registry.lastMessage = {
								...registry.lastMessage,
								id: response.id,
								stanzaId: response.id,
								date: confirmedDate,
								read: MarkerStatus.UNREAD
							};
						}
					}),
					false
				);
				return response;
			})
		);
	}

	public getMessage(roomId: string, messageId: string): Promise<ChatMessage> {
		return fetchAPI(`rooms/${roomId}/messages/${messageId}`, RequestType.GET);
	}

	public editMessage(roomId: string, messageId: string, text: string): Promise<ChatMessage> {
		return this.enqueue(roomId, () =>
			fetchAPI(`rooms/${roomId}/messages/${messageId}/edit`, RequestType.PUT, { text })
		);
	}

	public deleteMessage(roomId: string, messageId: string): Promise<void> {
		return this.enqueue(roomId, () =>
			fetchAPI(`rooms/${roomId}/messages/${messageId}`, RequestType.DELETE)
		);
	}

	public forwardMessage(
		sourceRoomId: string,
		messageId: string,
		toRoomId: string
	): Promise<ChatMessage> {
		return this.enqueue(sourceRoomId, () =>
			fetchAPI(
				`rooms/${sourceRoomId}/messages/${messageId}/forward`,
				RequestType.POST,
				{ toRoomId }
			)
		);
	}

	public pinMessage(roomId: string, messageId: string): Promise<void> {
		return fetchAPI(`rooms/${roomId}/messages/${messageId}/pin`, RequestType.PUT);
	}

	public unpinMessage(roomId: string, messageId: string): Promise<void> {
		return fetchAPI(`rooms/${roomId}/messages/${messageId}/pin`, RequestType.DELETE);
	}

	public getPinnedMessage(roomId: string): Promise<PinnedMessageResponse[]> {
		return fetchAPI(`rooms/${roomId}/pin`, RequestType.GET);
	}

	// TODO: backend does not expose POST /rooms/{roomId}/messages/batch — endpoint not in OpenAPI spec
	public getMessagesByIds(roomId: string, messageIds: string[]): Promise<ChatMessage[]> {
		return fetchAPI(`rooms/${roomId}/messages/batch`, RequestType.POST, { messageIds });
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

		return fetchAPI(`rooms/${roomId}/messages/search?${params.toString()}`, RequestType.GET);
	}

	// ==================== REACTIONS ====================

	public addReaction(roomId: string, messageId: string, reaction: string): Promise<void> {
		return fetchAPI(
			`rooms/${roomId}/messages/${messageId}/reactions/${encodeURIComponent(reaction)}`,
			RequestType.POST
		);
	}

	public removeReaction(roomId: string, messageId: string, reaction: string): Promise<void> {
		return fetchAPI(
			`rooms/${roomId}/messages/${messageId}/reactions/${encodeURIComponent(reaction)}`,
			RequestType.DELETE
		);
	}

	// ==================== READ MARKERS ====================

	public setReadMarker(roomId: string, messageId: string): Promise<void> {
		return fetchAPI(`rooms/${roomId}/read`, RequestType.PUT, { messageId });
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

	// TODO: backend does not expose GET /contacts — endpoint not in OpenAPI spec
	public getContacts(): Promise<ContactsResponse> {
		return fetchAPI('contacts', RequestType.GET);
	}
}

export default ChatApi.getInstance();
