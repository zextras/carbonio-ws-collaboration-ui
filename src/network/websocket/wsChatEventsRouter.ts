/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { StoreMessage, StoreTextMessage } from '@zextras/carbonio-ws-collaboration-sdk';

import { isMyId } from './eventHandlersUtilities';
import { EventName, sendCustomEvent } from '../../hooks/useEventListener';
import useStore from '../../store/Store';
import type {
	WsMessagePinnedEvent,
	WsMessageUnpinnedEvent
} from '../../types/network/websocket/wsChatEvents';
import { WsEventType } from '../../types/network/websocket/wsEvents';
import type { WsEvent } from '../../types/network/websocket/wsEvents';
import type { Message, MessageFastening, TextMessage } from '../../types/store/ChatsRegistryTypes';
import { wsDebug } from '../../utils/debug';
import { findFastenedLastMessage } from '../chatClient/findFastenedLastMessage';
import { findPinnedMessageContent } from '../chatClient/findPinnedMessageContent';
import { findRepliedMessage } from '../chatClient/findRepliedMessage';
import { wscSdk } from '../sdk/wscSdk';
import displayMessageBrowserNotification from '../xmpp/utility/displayMessageBrowserNotification';
import displayReactionBrowserNotification from '../xmpp/utility/displayReactionBrowserNotification';

/**
 * The v1 receiving effects for another sender's message: unread counter,
 * sound/badge custom event, browser notification. Shared by MESSAGE_RECEIVED
 * and MESSAGE_FORWARDED — v1 landed forwards through the same plain message
 * handler, effects included.
 */
function notifyOthersMessage(message: StoreMessage, senderId: string, roomId: string): void {
	if (isMyId(senderId)) {
		return;
	}
	useStore.getState().incrementUnreadCount(roomId, 1);
	sendCustomEvent({ name: EventName.NEW_MESSAGE, data: message as Message });
	displayMessageBrowserNotification(message as TextMessage);
}

/**
 * The v1 effects of a pin/unpin configuration row: custom event for every
 * sender, unread bump only for the others'. No browser notification (the v1
 * config handler never fired one). The v1 auto-read of the own config row has
 * no v2 equivalent — the row id is synthesized, the backend's persisted
 * system-event id is not on the event (plan §5.15).
 */
function notifyPinConfigRow(row: StoreMessage, actorId: string, roomId: string): void {
	sendCustomEvent({ name: EventName.NEW_MESSAGE, data: row as Message });
	if (!isMyId(actorId)) {
		useStore.getState().incrementUnreadCount(roomId, 1);
	}
}

/**
 * v1 landed pin changes as real MUC configuration rows; the SDK synthesizes
 * the row and sets the banner from the store copy when the target is loaded
 * (same lookup the reply hydration uses — the event is content-free).
 * Off-window targets fall back to GET /pin, which at least carries text and
 * sender.
 */
function routeMessagePinned(event: WsMessagePinnedEvent): void {
	const resolved = findPinnedMessageContent(event.roomId, event.messageId) as
		| StoreTextMessage
		| undefined;
	const row = wscSdk.handleMessagePinned(
		{
			roomId: event.roomId,
			messageId: event.messageId,
			pinnedBy: event.pinnedBy,
			timestamp: event.timestamp
		},
		resolved
	);
	if (!resolved) {
		wscSdk
			.fetchPinnedMessage(
				event.roomId,
				(messageId) =>
					findPinnedMessageContent(event.roomId, messageId) as StoreTextMessage | undefined
			)
			.catch((err) => {
				console.error('wsChatEventsRouter: pinned message hydration failed', err);
			});
	}
	notifyPinConfigRow(row, event.pinnedBy, event.roomId);
}

/**
 * Same contract as MessagePinned: the SDK lands the row and clears the banner
 * (an idempotent no-op over the unpinner's optimistic remove); the
 * scroll-to-pin selection is cleared like the v1 handler did.
 */
function routeMessageUnpinned(event: WsMessageUnpinnedEvent): void {
	const row = wscSdk.handleMessageUnpinned({
		roomId: event.roomId,
		messageId: event.messageId,
		unpinnedBy: event.unpinnedBy,
		timestamp: event.timestamp
	});
	useStore.getState().setSelectedPinnedMessage(event.roomId, undefined);
	notifyPinConfigRow(row, event.unpinnedBy, event.roomId);
}

/**
 * The banner keeps a COPY of the pinned message: v1 refreshed it with a
 * dedicated messagePinUpdated config (text only), which has no v2 event — the
 * copy refreshes here when an edit targets the pin.
 */
function refreshPinnedBannerOnEdit(roomId: string, messageId: string, text: string): void {
	const pinned = useStore.getState().activeConversations[roomId]?.messagePinned;
	if (pinned && pinned.stanzaId === messageId) {
		useStore.getState().setPinnedMessage(roomId, { ...pinned, text });
	}
}

/**
 * Defensive: a deleted message must not survive in the pin banner. v1 had no
 * client-side handling here; if the backend unpins on delete with its own
 * MessageUnpinned, this is an idempotent no-op (plan §5.15).
 */
function dropPinnedBannerOnDelete(roomId: string, messageId: string): void {
	const pinned = useStore.getState().activeConversations[roomId]?.messagePinned;
	if (pinned && pinned.stanzaId === messageId) {
		useStore.getState().removePinnedMessage(roomId);
		useStore.getState().setSelectedPinnedMessage(roomId, undefined);
	}
}

/**
 * Entry point for the WSC-pure chat events (backend >= 2.0.0). The migration
 * steps wire each event into the SDK decoder; until then the events are only
 * observable in debug, so a 2.0.0 environment stays quiet but inspectable.
 */
export function wsChatEventsRouter(event: WsEvent): void {
	switch (event.type) {
		case WsEventType.PRESENCE_CHANGED: {
			// v1 parity: the logged user's own echo never writes the store (the v1
			// presence handler only re-announced presence there, a no-op on v2)
			if (isMyId(event.userId)) {
				return;
			}
			wscSdk.handlePresenceChanged({ userId: event.userId, online: event.online }).catch((err) => {
				console.error('wsChatEventsRouter: presence hydration failed', err);
			});
			return;
		}
		case WsEventType.READ_UPDATED: {
			// Own echo included, unlike presence: updateReadStatus recomputes the
			// unread counter from the own marker and the read statuses from the
			// others' — the v1 single-path displayed-stanza behavior
			wscSdk.handleReadUpdated({
				roomId: event.roomId,
				userId: event.userId,
				messageId: event.messageId
			});
			return;
		}
		case WsEventType.MESSAGE_RECEIVED: {
			// The SDK performs the store writes shared by every sender (own echo
			// included: it promotes the placeholder through the tempId). On a
			// reply, the quoted message is resolved here — the event carries no
			// preview and the SDK never reads the store (v1 hydrated from the
			// store too; its not-loaded fallback, an archive query by id, has no
			// v2 endpoint: the bubble just renders without the reply section)
			const message = wscSdk.handleMessageReceived(
				{
					messageId: event.messageId,
					roomId: event.roomId,
					senderId: event.senderId,
					text: event.text,
					timestamp: event.timestamp,
					...(event.replyToId ? { replyToId: event.replyToId } : {}),
					...(event.tempId ? { tempId: event.tempId } : {}),
					...(event.forwardedFrom ? { forwardedFrom: event.forwardedFrom } : {}),
					...(event.forwardedAt ? { forwardedAt: event.forwardedAt } : {})
				},
				findRepliedMessage(event.roomId, event.replyToId) as StoreTextMessage | undefined
			);
			// Me/others split like the v1 handler
			notifyOthersMessage(message, event.senderId, event.roomId);
			return;
		}
		case WsEventType.MESSAGE_FORWARDED: {
			// To the receiving room a forward IS a new message (v1 landed it
			// through the plain message handler): same me/others effects as
			// MESSAGE_RECEIVED. The forwarder's own echo is the only
			// confirmation — the 201 carries no text and nothing was optimistic.
			const message = wscSdk.handleMessageForwarded({
				messageId: event.messageId,
				roomId: event.roomId,
				originalRoomId: event.originalRoomId,
				senderId: event.senderId,
				text: event.text,
				...(event.timestamp ? { timestamp: event.timestamp } : {}),
				...(event.forwardedFrom ? { forwardedFrom: event.forwardedFrom } : {}),
				...(event.forwardedAt ? { forwardedAt: event.forwardedAt } : {})
			});
			notifyOthersMessage(message, event.senderId, event.roomId);
			return;
		}
		case WsEventType.MESSAGE_EDITED: {
			// No me/others split (v1 parity: corrections came back through the MUC
			// to everyone, no unread bump, no notifications). The sidebar last
			// message is resolved here — fresh, so the merge never lands on a
			// message that stopped being the last one — and only when the edit
			// actually targets it.
			wscSdk.handleMessageEdited(
				{
					messageId: event.messageId,
					roomId: event.roomId,
					senderId: event.senderId,
					text: event.text,
					editedAt: event.editedAt
				},
				findFastenedLastMessage(event.roomId, event.messageId) as StoreTextMessage | undefined
			);
			refreshPinnedBannerOnEdit(event.roomId, event.messageId, event.text);
			return;
		}
		case WsEventType.MESSAGE_DELETED: {
			// Same contract as MESSAGE_EDITED — and the only confirmation path
			// for the deleter (the 204 writes nothing).
			wscSdk.handleMessageDeleted(
				{
					messageId: event.messageId,
					roomId: event.roomId,
					senderId: event.senderId,
					deletedAt: event.deletedAt
				},
				findFastenedLastMessage(event.roomId, event.messageId) as StoreTextMessage | undefined
			);
			dropPinnedBannerOnDelete(event.roomId, event.messageId);
			return;
		}
		case WsEventType.REACTION_CHANGED: {
			// Every reactor's echo synthesizes the fastening (the only
			// confirmation path — both endpoints answer 204). The me/others
			// effects mirror the v1 fastening handler: animation state (the slice
			// self-guards on my own messages and reads the just-added fastening
			// for removals — hence the write order), browser notification
			// (self-guarded against empty values), focus reset. No unread bump:
			// v1 parity, reactions never counted (plan §5.14).
			const fastening = wscSdk.handleReactionChanged({
				messageId: event.messageId,
				roomId: event.roomId,
				userId: event.userId,
				reaction: event.reaction,
				operation: event.operation
			});
			if (!isMyId(event.userId)) {
				displayReactionBrowserNotification(fastening as MessageFastening);
				useStore
					.getState()
					.setNewReaction(event.roomId, event.messageId, fastening.value ?? '', event.userId);
				if (useStore.getState().activeConversations[event.roomId]?.inputHasFocus) {
					setTimeout(() => {
						useStore.getState().unsetNewReactions(event.roomId);
					}, 0);
				}
			}
			return;
		}
		case WsEventType.MESSAGE_PINNED: {
			routeMessagePinned(event);
			return;
		}
		case WsEventType.MESSAGE_UNPINNED: {
			routeMessageUnpinned(event);
			return;
		}
		default:
			wsDebug('Chat event (SDK not wired yet):', event);
	}
}
