/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import useStore from '../../store/Store';
import { ChatEvent } from '../../types/network/models/chatTypes';
import { chatSseEventsHandler } from './chatSseEventsHandler';

const SSE_ENDPOINT = '/services/chats/events/chat';
const INITIAL_RECONNECT_DELAY = 1000;
const MAX_RECONNECT_DELAY = 30000;
const RECONNECT_MULTIPLIER = 2;

export interface IChatSseClient {
	connect(): void;
	disconnect(): void;
	isConnected(): boolean;
}

class ChatSseClient implements IChatSseClient {
	private static instance: ChatSseClient;
	private eventSource: EventSource | null = null;
	private reconnectDelay = INITIAL_RECONNECT_DELAY;
	private reconnectTimeout: NodeJS.Timeout | null = null;
	private connectionId: string | null = null;
	private intentionalDisconnect = false;

	public static getInstance(): ChatSseClient {
		if (!ChatSseClient.instance) {
			ChatSseClient.instance = new ChatSseClient();
		}
		return ChatSseClient.instance;
	}

	public connect(): void {
		if (this.eventSource) {
			console.log('[ChatSseClient] Already connected');
			return;
		}

		this.intentionalDisconnect = false;
		this.createConnection();
	}

	public disconnect(): void {
		this.intentionalDisconnect = true;

		if (this.reconnectTimeout) {
			clearTimeout(this.reconnectTimeout);
			this.reconnectTimeout = null;
		}

		if (this.eventSource) {
			this.eventSource.close();
			this.eventSource = null;
		}

		this.connectionId = null;
		this.reconnectDelay = INITIAL_RECONNECT_DELAY;

		const { setChatSseStatus } = useStore.getState();
		setChatSseStatus(false);

		console.log('[ChatSseClient] Disconnected');
	}

	public isConnected(): boolean {
		return this.eventSource !== null && this.eventSource.readyState === EventSource.OPEN;
	}

	public getConnectionId(): string | null {
		return this.connectionId;
	}

	private createConnection(): void {
		try {
			// Build URL with credentials (cookies)
			const url = `${window.location.protocol}//${window.location.host}${SSE_ENDPOINT}`;
			this.eventSource = new EventSource(url, { withCredentials: true });

			this.eventSource.onopen = this.handleOpen.bind(this);
			this.eventSource.onerror = this.handleError.bind(this);

			// Register event handlers for each event type
			this.registerEventHandlers();

			console.log('[ChatSseClient] Connecting to', url);
		} catch (error) {
			console.error('[ChatSseClient] Error creating EventSource:', error);
			this.scheduleReconnect();
		}
	}

	private registerEventHandlers(): void {
		if (!this.eventSource) return;

		const eventTypes = [
			'connection_established',
			'message_new',
			'message_edited',
			'message_deleted',
			'reaction_added',
			'reaction_removed',
			'typing',
			'presence_changed',
			'read_marker_updated',
			'heartbeat'
		];

		eventTypes.forEach((eventType) => {
			this.eventSource!.addEventListener(eventType, (event: MessageEvent) => {
				this.handleMessage(eventType, event);
			});
		});
	}

	private handleOpen(): void {
		console.log('[ChatSseClient] Connection opened');
		this.reconnectDelay = INITIAL_RECONNECT_DELAY;

		const { setChatSseStatus } = useStore.getState();
		setChatSseStatus(true);
	}

	private handleError(event: Event): void {
		console.error('[ChatSseClient] Connection error:', event);

		const { setChatSseStatus } = useStore.getState();
		setChatSseStatus(false);

		if (this.eventSource) {
			this.eventSource.close();
			this.eventSource = null;
		}

		if (!this.intentionalDisconnect) {
			this.scheduleReconnect();
		}
	}

	private handleMessage(eventType: string, event: MessageEvent): void {
		try {
			const data = JSON.parse(event.data) as ChatEvent;

			// Handle connection_established specially to store connectionId
			if (eventType === 'connection_established' && 'connectionId' in data) {
				this.connectionId = data.connectionId;
				const { setChatConnectionId } = useStore.getState();
				setChatConnectionId(data.connectionId);
			}

			// Delegate to event handler
			chatSseEventsHandler(data);
		} catch (error) {
			console.error('[ChatSseClient] Error parsing event:', error, event.data);
		}
	}

	private scheduleReconnect(): void {
		if (this.intentionalDisconnect) return;

		console.log(`[ChatSseClient] Scheduling reconnect in ${this.reconnectDelay}ms`);

		this.reconnectTimeout = setTimeout(() => {
			this.reconnectTimeout = null;
			this.createConnection();
		}, this.reconnectDelay);

		// Exponential backoff
		this.reconnectDelay = Math.min(this.reconnectDelay * RECONNECT_MULTIPLIER, MAX_RECONNECT_DELAY);
	}
}

export default ChatSseClient.getInstance();
