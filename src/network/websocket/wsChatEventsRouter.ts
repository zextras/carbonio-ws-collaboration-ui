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
	WsMessageForwardedEvent,
	WsMessagePinnedEvent,
	WsMessageReceivedEvent,
	WsMessageUnpinnedEvent
} from '../../types/network/websocket/wsChatEvents';
import { WsEventType } from '../../types/network/websocket/wsEvents';
import type { WsEvent } from '../../types/network/websocket/wsEvents';
import type { Message, MessageFastening, TextMessage } from '../../types/store/ChatsRegistryTypes';
import { messageToGalleryAttachment } from '../../utils/attachmentUtils';
import { wsDebug } from '../../utils/debug';
import { findFastenedLastMessage } from '../chatClient/findFastenedLastMessage';
import { findPinnedMessageContent } from '../chatClient/findPinnedMessageContent';
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
 * v1 prepended every text message carrying an attachment to the media
 * gallery buckets — own echo included, the effect sat before the me/others
 * split. Forwards went through the same v1 handler: a forwarded attachment
 * is a server-side clone and this is how it reaches the gallery.
 */
function prependGalleryAttachment(message: StoreMessage): void {
	if (message.type !== 'text') {
		return;
	}
	const galleryAttachment = messageToGalleryAttachment(message as TextMessage);
	if (galleryAttachment) {
		useStore.getState().prependMediaGalleryAttachment(message.roomId, galleryAttachment);
	}
}

/**
 * The SDK performs the store writes shared by every sender (own echo
 * included: it promotes the placeholder through the tempId). The event
 * carries the full `TimelineMessage`, so quote and attachment come from the
 * wire (v1 hydrated the quote from the store, with an archive query as
 * fallback): an upload's echo prepends the real file to the gallery.
 */
function routeMessageReceived(event: WsMessageReceivedEvent): void {
	const message = wscSdk.handleMessageReceived(event);
	prependGalleryAttachment(message);
	// Me/others split like the v1 handler
	notifyOthersMessage(message, event.message.senderId, event.message.roomId);
}

/**
 * To the receiving room a forward IS a new message (v1 landed it through the
 * plain message handler): same me/others effects and gallery prepend as
 * MESSAGE_RECEIVED. The forwarder's own echo is the only store write —
 * nothing was optimistic.
 */
function routeMessageForwarded(event: WsMessageForwardedEvent): void {
	const message = wscSdk.handleMessageForwarded(event);
	prependGalleryAttachment(message);
	notifyOthersMessage(message, event.message.senderId, event.message.roomId);
}

/**
 * The v1 effects of a pin/unpin configuration row, minus the unread bump: the
 * WSC backend leaves the system events out of its unread counter (plan
 * §5.15b), so the badge stays aligned with it. Custom event for every sender;
 * no browser notification (the v1 config handler never fired one).
 */
function notifyPinConfigRow(row: StoreMessage): void {
	sendCustomEvent({ name: EventName.NEW_MESSAGE, data: row as Message });
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
	const row = wscSdk.handleMessagePinned(event, resolved);
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
	notifyPinConfigRow(row);
}

/**
 * Same contract as MessagePinned: the SDK lands the row and clears the banner
 * (an idempotent no-op over the unpinner's optimistic remove); the
 * scroll-to-pin selection is cleared like the v1 handler did.
 */
function routeMessageUnpinned(event: WsMessageUnpinnedEvent): void {
	const row = wscSdk.handleMessageUnpinned(event);
	useStore.getState().setSelectedPinnedMessage(event.roomId, undefined);
	notifyPinConfigRow(row);
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
			// presence handler only re-announced presence there, a no-op on v2).
			// The backend never sends it; the guard stays defensive
			if (isMyId(event.userId)) {
				return;
			}
			wscSdk.handlePresenceChanged(event).catch((err) => {
				console.error('wsChatEventsRouter: presence hydration failed', err);
			});
			return;
		}
		case WsEventType.READ_UPDATED: {
			// Own echo included, unlike presence: updateReadStatus recomputes the
			// unread counter from the own marker and the read statuses from the
			// others' — the v1 single-path displayed-stanza behavior
			wscSdk.handleReadUpdated(event);
			return;
		}
		case WsEventType.MESSAGE_RECEIVED: {
			routeMessageReceived(event);
			return;
		}
		case WsEventType.MESSAGE_FORWARDED: {
			routeMessageForwarded(event);
			return;
		}
		case WsEventType.MESSAGE_EDITED: {
			// No me/others split (v1 parity: corrections came back through the MUC
			// to everyone, no unread bump, no notifications). The sidebar last
			// message is resolved here — fresh, so the merge never lands on a
			// message that stopped being the last one — and only when the edit
			// actually targets it.
			wscSdk.handleMessageEdited(
				event,
				findFastenedLastMessage(event.roomId, event.messageId) as StoreTextMessage | undefined
			);
			refreshPinnedBannerOnEdit(event.roomId, event.messageId, event.text);
			return;
		}
		case WsEventType.MESSAGE_DELETED: {
			// Same contract as MESSAGE_EDITED — and the only confirmation path
			// for the deleter (the 204 writes nothing).
			wscSdk.handleMessageDeleted(
				event,
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
			// v1 parity, reactions never counted (plan §5.14). The SDK dates the
			// fastening with the event's sentDate.
			const fastening = wscSdk.handleReactionChanged(event);
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
		case WsEventType.TYPING: {
			// v1 parity: the own chat states never reached the store (the handler
			// ignored them). The backend excludes the typist; the guard stays
			// defensive. The SDK owns the per-pair 7s auto-expire.
			if (isMyId(event.userId)) {
				return;
			}
			wscSdk.handleTyping(event);
			return;
		}
		case WsEventType.WS_ERROR: {
			// The backend refused an action this client sent on the socket
			// (typing outside a room, malformed or unknown action): a client bug,
			// with no store state to roll back
			console.error('wsChatEventsRouter: socket action refused by the backend', event);
			return;
		}
		default:
			wsDebug('Chat event (SDK not wired yet):', event);
	}
}
