/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { StoreTextMessage } from '@zextras/carbonio-ws-collaboration-sdk';
import { gte } from 'semver';
import { v4 as uuidGenerator } from 'uuid';

import { downloadChatExport } from './chatExportDownload';
import { findPinnedMessageContent } from './findPinnedMessageContent';
import { findRepliedMessage } from './findRepliedMessage';
import { getMyLastReaction } from '../../store/selectors/ChatsRegistrySelectors';
import { getRoomNameSelector } from '../../store/selectors/RoomsSelectors';
import useStore from '../../store/Store';
import { dateToTimestamp } from '../../utils/dateUtils';
import { wsDebug } from '../../utils/debug';
import { replacePlaceholderRoom } from '../apis/RoomsApi';
import { wscSdk } from '../sdk/wscSdk';
import { wsClient } from '../websocket/WebSocketClient';
import { getLastUnreadMessage } from '../xmpp/utility/getLastUnreadMessage';
import { sanitizeXmppMessage } from '../xmpp/utility/sanitizeXmppMessage';
import { xmppClient } from '../xmpp/XMPPClient';

export const WSC_PURE_MIN_VERSION = '2.0.0';

/**
 * Public chat surface consumed outside the XMPP stack (UI components, WS
 * routers, boot). Mirrors the xmppClient members used at those call sites so
 * they can migrate to the SDK one API at a time without further churn.
 */
export type ChatClient = Pick<
	typeof xmppClient,
	| 'connect'
	| 'setOnline'
	| 'features'
	| 'sendChatMessage'
	| 'sendChatMessageReply'
	| 'sendChatMessageEdit'
	| 'sendChatMessageDeletion'
	| 'sendChatMessageReaction'
	| 'requestHistory'
	| 'requestFullHistory'
	| 'fullTextSearch'
	| 'requestMessageResultHistoryToId'
	| 'requestMessageToForward'
	| 'readMessage'
	| 'sendIsWriting'
	| 'sendPaused'
	| 'pinMessage'
	| 'unpinMessage'
	| 'getMessagePin'
>;

/**
 * True when the negotiated backend speaks the WSC-pure protocol (>= 2.0.0):
 * REST writes + single push WebSocket, no MongooseIM. The version gate is the
 * feature flag — against a 1.6.x backend every v2 branch is dormant.
 */
export function isWscPure(): boolean {
	const { apiVersion } = useStore.getState().session;
	return !!apiVersion && gte(apiVersion, WSC_PURE_MIN_VERSION);
}

function sdkNotWiredYet(method: string): void {
	wsDebug(`chatClient.${method}: WSC-pure backend, but the SDK path for this API is not wired yet`);
}

/**
 * v2 read-marker path, shared by `readMessage` and the read-before-send of
 * the outgoing-text flows. v1 parity: the XMPP sender also bails out when the
 * message is not in store. Nothing is written locally: the store update comes
 * back through the own ReadUpdated echo, like the v1 MUC displayed echo.
 */
function readMessageViaSdk(roomId: string, messageId: string): void {
	const message = useStore
		.getState()
		.chatsRegistry[roomId]?.messages.find((msg) => msg.id === messageId);
	if (!message) {
		return;
	}
	wscSdk.markAsRead(roomId, messageId).catch((err) => {
		console.error('chatClient.readMessage: read marker update failed', err);
	});
}

/**
 * Shared v2 outgoing-text path (plain sends and replies). Optimistic flow:
 * the placeholder id doubles as the self-echo tempId; the SDK promotes it
 * from whichever confirmation lands first. Like v1, the placeholder keeps the
 * raw text and only the wire text is stripped of control characters (the
 * util is XMPP-named but XML-agnostic). On a reply the quoted message
 * resolved from the store travels with the params, so the REST confirmation
 * keeps the reply section the hydrated placeholder was already rendering.
 */
function sendTextViaSdk(
	caller: 'sendChatMessage' | 'sendChatMessageReply',
	roomId: string,
	message: string,
	replyToId?: string
): void {
	const senderId = useStore.getState().session.id;
	if (!senderId) {
		return;
	}
	// Read messages before sending a new one (v1 parity)
	const lastMessageId = getLastUnreadMessage(roomId);
	if (lastMessageId) {
		readMessageViaSdk(roomId, lastMessageId);
	}
	const tempId = uuidGenerator();
	useStore
		.getState()
		.setPlaceholderMessage({ roomId, id: tempId, text: message, replyTo: replyToId });
	wscSdk
		.sendMessage({
			roomId,
			text: sanitizeXmppMessage(message),
			tempId,
			senderId,
			...(replyToId
				? {
						replyToId,
						repliedMessage: findRepliedMessage(roomId, replyToId) as StoreTextMessage | undefined
					}
				: {})
		})
		.catch((err) => {
			console.error(`chatClient.${caller}: message send failed`, err);
		});
}

/**
 * v2 replacement of the MAM `to-id` form behind the search-result jump:
 * backward timeline pages from the oldest loaded message until the target
 * enters the store. Like the v1 backfill the history stays CONTIGUOUS —
 * the timeline `around` cursor would open a gap the backward pagination
 * could never heal (plan §5.17). Bounded: fully-loaded ends the walk (target
 * missing or behind the cleared bound), and a defensive stall guard breaks
 * it if a page moves nothing.
 */
async function loadHistoryToMessageViaSdk(roomId: string, stanzaId: string): Promise<void> {
	// v2 invariant id === stanzaId: the same by-id lookup the reply hydration
	// uses matches the panel's "already stored" selector on confirmed messages
	const isTargetLoaded = (): boolean => !!findRepliedMessage(roomId, stanzaId);
	const room = useStore.getState().rooms[roomId];
	if (!room) {
		return;
	}
	const lowerBound = room.userSettings?.clearedAt ?? room.createdAt;
	const notBefore = lowerBound ? dateToTimestamp(lowerBound) : undefined;
	let previousOldestId: string | undefined;
	while (!isTargetLoaded()) {
		if (useStore.getState().activeConversations[roomId]?.isHistoryFullyLoaded) {
			return;
		}
		const oldest = useStore.getState().chatsRegistry[roomId]?.messages[0];
		if (oldest && oldest.id === previousOldestId) {
			console.warn('chatClient.requestMessageResultHistoryToId: pagination stalled', roomId);
			return;
		}
		previousOldestId = oldest?.id;
		// eslint-disable-next-line no-await-in-loop
		await wscSdk.fetchTimeline(roomId, {
			...(oldest ? { before: oldest.date, beforeId: oldest.id } : {}),
			...(notBefore ? { notBefore } : {})
		});
	}
}

export const chatClient: ChatClient = {
	get features(): Array<string> {
		if (isWscPure()) {
			// The pin endpoints are part of the v2 REST contract, so the disco
			// feature that gated the v1 pin UI is always on (the only consumer,
			// usePinMessage, checks this namespace)
			return ['zextras:iq:pin'];
		}
		return xmppClient.features;
	},
	connect: (token) => {
		if (isWscPure()) {
			wsDebug('chatClient.connect: WSC-pure backend, chat boots through the SDK');
			// REST has no persistent chat connection: the legacy xmpp status flag
			// feeds the connection-health banners, so mark it healthy.
			useStore.getState().setXmppStatus(true);
			wscSdk.fetchInbox().catch((err) => {
				console.error('chatClient.connect: inbox hydration failed', err);
			});
			return;
		}
		xmppClient.connect(token);
	},
	setOnline: () => {
		if (isWscPure()) {
			// No outbound presence action exists on 2.0.0: the events-socket
			// lifecycle announces presence. Nothing to send by design.
			return;
		}
		xmppClient.setOnline();
	},
	sendChatMessage: (roomId, message) => {
		if (isWscPure()) {
			// v1 parity: a placeholder room becomes a real 1:1 on the first message
			const placeholderRoom = roomId.split('placeholder-');
			if (placeholderRoom[1]) {
				replacePlaceholderRoom(placeholderRoom[1], message).then((response) => {
					chatClient.sendChatMessage(response.id, message);
				});
				return;
			}
			sendTextViaSdk('sendChatMessage', roomId, message);
			return;
		}
		xmppClient.sendChatMessage(roomId, message);
	},
	sendChatMessageReply: (roomId, message, replyTo, replyMessageId) => {
		if (isWscPure()) {
			// The 3rd v1 arg (the quoted author, only needed for the XMPP `to`
			// address) has no v2 counterpart: the server resolves the quoted
			// message from replyToId.
			sendTextViaSdk('sendChatMessageReply', roomId, message, replyMessageId);
			return;
		}
		xmppClient.sendChatMessageReply(roomId, message, replyTo, replyMessageId);
	},
	sendChatMessageEdit: (roomId, message, messageStanzaId, parentStanzaId) => {
		if (isWscPure()) {
			// The 4th v1 arg (the previous correction's stanza id, the XEP-0422
			// parent-id) has no v2 counterpart: the edit is keyed on the stable
			// message id, unchanged across corrections. No optimistic write, like
			// v1: the bubble updates on whichever confirmation lands first (REST
			// response or MessageEdited echo).
			const senderId = useStore.getState().session.id;
			if (!senderId) {
				return;
			}
			wscSdk
				.editMessage({
					roomId,
					messageId: messageStanzaId,
					text: sanitizeXmppMessage(message),
					senderId
				})
				.catch((err) => {
					console.error('chatClient.sendChatMessageEdit: message edit failed', err);
				});
			return;
		}
		xmppClient.sendChatMessageEdit(roomId, message, messageStanzaId, parentStanzaId);
	},
	sendChatMessageDeletion: (roomId, messageStanzaId) => {
		if (isWscPure()) {
			// No optimistic write, v1 parity: the bubble updates on the
			// MessageDeleted echo — the only confirmation path, since the 204
			// carries no server timestamp to synthesize the fastening from.
			wscSdk.deleteMessage(roomId, messageStanzaId).catch((err) => {
				console.error('chatClient.sendChatMessageDeletion: message deletion failed', err);
			});
			return;
		}
		xmppClient.sendChatMessageDeletion(roomId, messageStanzaId);
	},
	sendChatMessageReaction: (roomId, messageStanzaId, reaction) => {
		if (isWscPure()) {
			// No optimistic write, v1 parity: the bubble updates on the
			// ReactionChanged echo (both endpoints answer a bodyless 204).
			if (reaction === '') {
				// The v1 removal was an empty-valued stanza; v2 DELETEs the specific
				// emoji, so resolve my current one from the store — the same
				// selector the reaction pickers read. Nothing active, nothing to
				// remove: the empty v1 stanza was a no-op there too.
				const myReaction = getMyLastReaction(useStore.getState(), roomId, messageStanzaId);
				if (!myReaction) {
					return;
				}
				wscSdk.removeReaction(roomId, messageStanzaId, myReaction).catch((err) => {
					console.error('chatClient.sendChatMessageReaction: reaction removal failed', err);
				});
				return;
			}
			wscSdk.sendReaction(roomId, messageStanzaId, reaction).catch((err) => {
				console.error('chatClient.sendChatMessageReaction: reaction send failed', err);
			});
			return;
		}
		xmppClient.sendChatMessageReaction(roomId, messageStanzaId, reaction);
	},
	// Rest args on the methods with optional/default parameters: the façade must
	// forward the exact call arity so spies and default values behave unchanged.
	requestHistory: (...args) => {
		if (isWscPure()) {
			// The 4th v1 arg (unread) is deliberately unused: only the XMPP inbox
			// handler ever passes it, and the v2 boot reads unread counts from
			// GET /inbox without preloading history pages.
			const [roomId, endHistory, quantity] = args;
			const store = useStore.getState();
			const room = store.rooms[roomId];
			// v1 parity: the XMPP request bails out on unknown rooms too
			if (!room) {
				return;
			}
			const oldest = store.chatsRegistry[roomId]?.messages[0];
			const lowerBound = room.userSettings?.clearedAt ?? room.createdAt;
			wscSdk
				.fetchTimeline(roomId, {
					before: endHistory,
					// Composite cursor only when the anchor is a message already in store
					...(oldest && oldest.date === endHistory ? { beforeId: oldest.id } : {}),
					...(quantity !== undefined ? { limit: quantity } : {}),
					...(lowerBound ? { notBefore: dateToTimestamp(lowerBound) } : {})
				})
				.then(() => useStore.getState().setHistoryLoadDisabled(roomId, false))
				.catch((err) => {
					console.error('chatClient.requestHistory: timeline hydration failed', err);
				});
			return;
		}
		xmppClient.requestHistory(...args);
	},
	requestFullHistory: (...args) => {
		if (isWscPure()) {
			// The export is a server-streamed download (GET …/messages/export,
			// clearedAt honored server-side): the browser owns progress and
			// completion, so the ChatExporter MAM loop dies and the `from`
			// pagination cursor has no v2 meaning.
			const [roomId] = args;
			downloadChatExport(roomId, getRoomNameSelector(useStore.getState(), roomId));
			return;
		}
		xmppClient.requestFullHistory(...args);
	},
	fullTextSearch: (roomId, text) => {
		if (isWscPure()) {
			// One shot like v1 (the panel has no load-more: hasMore is dropped,
			// results beyond the page stay unreachable — plan §5.17). The v1 MAM
			// `start` bound (clearedAt ?? createdAt) travels as notBefore: the
			// spec has no server-side lower bound, the SDK filters client-side.
			// Optional chaining is an improvement: v1 threw on unknown rooms.
			const room = useStore.getState().rooms[roomId];
			const lowerBound = room?.userSettings?.clearedAt ?? room?.createdAt;
			return wscSdk
				.searchMessages(roomId, text, {
					...(lowerBound ? { notBefore: dateToTimestamp(lowerBound) } : {})
				})
				.then(() => undefined);
		}
		return xmppClient.fullTextSearch(roomId, text);
	},
	requestMessageResultHistoryToId: (roomId, stanzaId) => {
		if (isWscPure()) {
			return loadHistoryToMessageViaSdk(roomId, stanzaId);
		}
		return xmppClient.requestMessageResultHistoryToId(roomId, stanzaId);
	},
	requestMessageToForward: (roomId, messageToForwardStanzaId, queryId) => {
		if (isWscPure()) {
			sdkNotWiredYet('requestMessageToForward');
			return Promise.resolve();
		}
		return xmppClient.requestMessageToForward(roomId, messageToForwardStanzaId, queryId);
	},
	readMessage: (roomId, messageId) => {
		if (isWscPure()) {
			readMessageViaSdk(roomId, messageId);
			return;
		}
		xmppClient.readMessage(roomId, messageId);
	},
	sendIsWriting: (roomId) => {
		if (isWscPure()) {
			// The only chat traffic sent on the /events socket. Placeholder rooms
			// are skipped like the v1 stanza path did; the 3s throttle stays in
			// the composer, unchanged.
			if (useStore.getState().rooms[roomId]?.placeholder) {
				return;
			}
			wsClient.send({ action: 'Typing', roomId, status: 'started' });
			return;
		}
		xmppClient.sendIsWriting(roomId);
	},
	sendPaused: (roomId) => {
		if (isWscPure()) {
			if (useStore.getState().rooms[roomId]?.placeholder) {
				return;
			}
			wsClient.send({ action: 'Typing', roomId, status: 'stopped' });
			return;
		}
		xmppClient.sendPaused(roomId);
	},
	pinMessage: (roomId, stanzaId) => {
		if (isWscPure()) {
			// No optimistic write (v1 parity): the banner and the config row land
			// with the MessagePinned echo — the only confirmation, the PUT is a 204
			wscSdk.pinMessage(roomId, stanzaId).catch((err) => {
				console.error('chatClient.pinMessage: pin failed', err);
			});
			return;
		}
		xmppClient.pinMessage(roomId, stanzaId);
	},
	unpinMessage: (roomId, stanzaId) => {
		if (isWscPure()) {
			// The optimistic banner removal stays in usePinMessage, like in v1
			wscSdk.unpinMessage(roomId, stanzaId).catch((err) => {
				console.error('chatClient.unpinMessage: unpin failed', err);
			});
			return;
		}
		xmppClient.unpinMessage(roomId, stanzaId);
	},
	getMessagePin: (roomId) => {
		if (isWscPure()) {
			// Store-first with the latest live edit applied (the banner renders
			// the copy as-is): the full message beats the poor GET /pin stub
			wscSdk
				.fetchPinnedMessage(
					roomId,
					(messageId) => findPinnedMessageContent(roomId, messageId) as StoreTextMessage | undefined
				)
				.catch((err) => {
					console.error('chatClient.getMessagePin: pinned message hydration failed', err);
				});
			return;
		}
		xmppClient.getMessagePin(roomId);
	}
};
