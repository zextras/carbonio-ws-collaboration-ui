/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { StoreTextMessage } from '@zextras/carbonio-ws-collaboration-sdk';

import { isMyId } from './eventHandlersUtilities';
import { EventName, sendCustomEvent } from '../../hooks/useEventListener';
import useStore from '../../store/Store';
import { WsEventType } from '../../types/network/websocket/wsEvents';
import type { WsEvent } from '../../types/network/websocket/wsEvents';
import type { Message, MessageFastening, TextMessage } from '../../types/store/ChatsRegistryTypes';
import { wsDebug } from '../../utils/debug';
import { findFastenedLastMessage } from '../chatClient/findFastenedLastMessage';
import { findRepliedMessage } from '../chatClient/findRepliedMessage';
import { wscSdk } from '../sdk/wscSdk';
import displayMessageBrowserNotification from '../xmpp/utility/displayMessageBrowserNotification';
import displayReactionBrowserNotification from '../xmpp/utility/displayReactionBrowserNotification';

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
					...(event.tempId ? { tempId: event.tempId } : {})
				},
				findRepliedMessage(event.roomId, event.replyToId) as StoreTextMessage | undefined
			);
			// Me/others split like the v1 handler: unread counter, sound/badge
			// custom event and browser notification only for other senders
			if (!isMyId(event.senderId)) {
				useStore.getState().incrementUnreadCount(event.roomId, 1);
				sendCustomEvent({ name: EventName.NEW_MESSAGE, data: message as Message });
				displayMessageBrowserNotification(message as TextMessage);
			}
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
		default:
			wsDebug('Chat event (SDK not wired yet):', event);
	}
}
