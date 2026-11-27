/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { StoreTextMessage } from '@zextras/carbonio-ws-collaboration-ui-sdk';
import { v4 as uuidGenerator, validate as isServerId } from 'uuid';

import { downloadChatExport } from './chatExportDownload';
import { markChatStack } from './chatStack';
import { findPinnedMessageContent } from './findPinnedMessageContent';
import { findRepliedMessage } from './findRepliedMessage';
import { refreshStaleUnread, scheduleBootInbox } from './inboxRefresh';
import {
	isAbortError,
	resetLoaderRetry,
	scheduleLoaderRetry,
	setReplaceScrollTarget,
	WINDOW_LOAD_TIMEOUT_MS,
	windowLoadSignal
} from './windowGuard';
import { getMyLastReaction } from '../../store/selectors/ChatsRegistrySelectors';
import { getIsWscPure } from '../../store/selectors/SessionSelectors';
import useStore from '../../store/Store';
import { MessageType } from '../../types/store/ChatsRegistryTypes';
import type { TextMessage } from '../../types/store/ChatsRegistryTypes';
import { dateToTimestamp } from '../../utils/dateUtils';
import { wsDebug } from '../../utils/debug';
import { getOldestConfirmedMessage, isPendingMessage } from '../../utils/historyAnchorUtils';
import { replacePlaceholderRoom } from '../apis/RoomsApi';
import { wscSdk } from '../sdk/wscSdk';
import { wsClient } from '../websocket/WebSocketClient';
import { getLastUnreadMessage } from '../xmpp/utility/getLastUnreadMessage';
import { sanitizeXmppMessage } from '../xmpp/utility/sanitizeXmppMessage';
import { xmppClient } from '../xmpp/XMPPClient';

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
	| 'sendChatMessageEdit'
	| 'sendChatMessageDeletion'
	| 'sendChatMessageReaction'
	| 'requestHistory'
	| 'requestFullHistory'
	| 'fullTextSearch'
	| 'requestMessageToForward'
	| 'readMessage'
	| 'sendIsWriting'
	| 'sendPaused'
	| 'pinMessage'
	| 'unpinMessage'
	| 'getMessagePin'
> & {
	/**
	 * Resolves false when the message could not be sent, so the composer can
	 * give the text back; v1 resolves true, the XMPP connection queues it.
	 */
	sendChatMessage: (...args: Parameters<typeof xmppClient.sendChatMessage>) => Promise<boolean>;
	/**
	 * Brings a message that is not in store into view. v2 replaces the room window with the
	 * timeline page around it (`date` is the message date; found in the search results or the
	 * pinned message when omitted); v1 walks the history back to it.
	 */
	requestMessageResultHistoryToId: (
		roomId: string,
		stanzaId: string,
		date?: number
	) => Promise<boolean>;
	/** v2: the next page of the room search results, after the last one in store. */
	fullTextSearchNextPage: (roomId: string, text: string) => Promise<void>;
	/** v2: the next page after the newest row of a window cut before the newest message. */
	requestMessagesAfter: (roomId: string) => Promise<void>;
	/** v2: replaces a window cut before the newest message with the latest page again. */
	returnToLatestMessages: (roomId: string) => Promise<void>;
	sendChatMessageReply: (
		...args: Parameters<typeof xmppClient.sendChatMessageReply>
	) => Promise<boolean>;
};

/** {@link getIsWscPure} on the current session, for the call sites outside the store. */
export function isWscPure(): boolean {
	return getIsWscPure(useStore.getState());
}

function sdkNotWiredYet(method: string): void {
	wsDebug(`chatClient.${method}: WSC-pure backend, but the SDK path for this API is not wired yet`);
}

/**
 * v2 read-marker path, shared by `readMessage` and the read-before-send of
 * the outgoing-text flows. v1 parity: the XMPP sender also bails out when the
 * message is not in store. Nothing is written locally: the store update comes
 * back through the own ReadUpdated echo, like the v1 MUC displayed echo.
 *
 * F3 guard: the marker only lands on rows the backend knows. Text messages
 * always qualify. Config rows (`MessageType.CONFIGURATION_MSG`) qualify when
 * they map a timeline system event, whose server UUID `PUT /read` accepts
 * since common-socket 20656f0a (up to 514b238 it 404ed, §9). The live
 * pin/unpin rows carry the system event id when the event brings it; only the
 * ones synthesized client-side (`pin_…`, `unpin_…`) and the room-creation row
 * (`creationMessage-…`) have no server id, a 404. Skipping one leaves the
 * marker on the previous row until the next message.
 */
function readMessageViaSdk(roomId: string, messageId: string): void {
	const message = useStore
		.getState()
		.chatsRegistry[roomId]?.messages.find((msg) => msg.id === messageId);
	const isServerRow =
		message?.type === MessageType.TEXT_MSG ||
		(message?.type === MessageType.CONFIGURATION_MSG && isServerId(message.id));
	if (!isServerRow) {
		return;
	}
	wscSdk.markAsRead(roomId, messageId).catch((err) => {
		console.error('chatClient.readMessage: read marker update failed', err);
	});
}

const MAX_CATCH_UP_PAGES = 10;
export const REATTACH_CALLER_DEADLINE_MS = 20000;

type TimelineCursor = { date: number; id?: string };

const windowOperations = new Map<string, Promise<void>>();
const latestReloads = new Map<string, Promise<void>>();
// Where the forward pages of a detached window go on, whatever live rows the window holds
const forwardCursors = new Map<string, TimelineCursor>();

/** Every timeline load of a window: it fails after a timeout and stops on a reset or a clear of the room. */
const windowLoadOptions = (roomId: string): { timeoutMs: number; signal: AbortSignal } => ({
	timeoutMs: WINDOW_LOAD_TIMEOUT_MS,
	signal: windowLoadSignal(roomId)
});

/**
 * Operations that grow or replace a room window run one at a time: a page that lands in a window
 * replaced meanwhile would join rows of two unrelated spans and leave a hidden gap. A load that
 * fails, times out or is aborted rejects and the queue moves on; an abort (reset or clear of the
 * room) is deliberate, so it ends the operation without an error.
 */
function runWindowOperation<T>(roomId: string, operation: () => Promise<T>): Promise<T> {
	const result = (windowOperations.get(roomId) ?? Promise.resolve())
		.then(operation)
		.catch((err) => {
			if (isAbortError(err)) {
				return undefined as T;
			}
			throw err;
		});
	windowOperations.set(
		roomId,
		result.then(
			() => undefined,
			() => undefined
		)
	);
	return result;
}

function getNotBefore(roomId: string): number | undefined {
	const room = useStore.getState().rooms[roomId];
	const lowerBound = room?.userSettings?.clearedAt ?? room?.createdAt;
	return lowerBound ? dateToTimestamp(lowerBound) : undefined;
}

function isDetached(roomId: string): boolean {
	return !!useStore.getState().chatsRegistry[roomId]?.hasMoreAfter;
}

/** Only server rows anchor a cursor: no placeholder, no synthesized line. */
function newestServerRow(roomId: string): TimelineCursor | undefined {
	return useStore
		.getState()
		.chatsRegistry[roomId]?.messages.findLast(
			(message) =>
				!isPendingMessage(message) &&
				(message.type === MessageType.TEXT_MSG || isServerId(message.id))
		);
}

/** True while no new query started and the search results were not cleared since this call. */
function searchTracker(roomId: string): () => boolean {
	const generation = useStore.getState().chatsRegistry[roomId]?.searchGeneration;
	return (): boolean => {
		const registry = useStore.getState().chatsRegistry[roomId];
		// No registry: a reconnection reset wiped it and nothing replaced the query since
		return registry === undefined || registry.searchGeneration === generation;
	};
}

function isTextMessageStored(roomId: string, stanzaId: string): boolean {
	return !!useStore
		.getState()
		.chatsRegistry[roomId]?.messages.some(
			(message) => message.type === MessageType.TEXT_MSG && message.stanzaId === stanzaId
		);
}

/**
 * The window now reaches the newest message, so live rows land in it again. Rows the live events
 * brought while it was detached were dropped: read what was committed after the page again, from
 * the newest row the page brought (a live row appended meanwhile would hide older ones). The
 * pages are bounded; if more is left the window is detached again and the forward loader goes on.
 */
async function attachWindow(roomId: string, pageNewest?: TimelineCursor): Promise<void> {
	useStore.getState().setHasMoreAfter(roomId, false);
	let cursor = pageNewest ?? newestServerRow(roomId);
	let hasMore = false;
	try {
		for (let page = 0; cursor && page < MAX_CATCH_UP_PAGES; page += 1) {
			forwardCursors.set(roomId, cursor);
			// eslint-disable-next-line no-await-in-loop
			const result = await wscSdk.fetchTimeline(roomId, {
				after: cursor.date,
				afterId: cursor.id,
				...windowLoadOptions(roomId)
			});
			hasMore = result.hasMoreAfter;
			cursor = hasMore ? (result.newest ?? cursor) : undefined;
		}
	} catch (err) {
		// A page that was not read leaves a gap after the cursor: the window is detached again, from
		// there. An abort means the room was wiped: there is no window left to detach
		if (isAbortError(err)) {
			forwardCursors.delete(roomId);
		} else {
			useStore.getState().setHasMoreAfter(roomId, true);
		}
		throw err;
	}
	if (hasMore && cursor) {
		forwardCursors.set(roomId, cursor);
		useStore.getState().setHasMoreAfter(roomId, true);
	} else {
		forwardCursors.delete(roomId);
	}
	refreshStaleUnread();
}

/**
 * The latest page replaces the window when the response is processed: a load that fails leaves
 * the window as it was.
 */
async function loadLatestWindowViaSdk(roomId: string): Promise<void> {
	const store = useStore.getState();
	if (!store.rooms[roomId]) {
		return;
	}
	const notBefore = getNotBefore(roomId);
	store.setHistoryLoadDisabled(roomId, true);
	try {
		const { hasMoreAfter, newest } = await wscSdk.fetchTimeline(roomId, {
			replaceWindow: true,
			...(notBefore ? { notBefore } : {}),
			...windowLoadOptions(roomId)
		});
		forwardCursors.delete(roomId);
		if (!hasMoreAfter) {
			await attachWindow(roomId, newest);
		}
		const newestRow = useStore
			.getState()
			.chatsRegistry[roomId]?.messages.findLast((message) => !isPendingMessage(message));
		if (newestRow) {
			useStore.getState().setScrollPosition(roomId, newestRow.id);
		}
	} finally {
		useStore.getState().setHistoryLoadDisabled(roomId, false);
	}
}

/** One reload of the latest page at a time per room: the callers that come meanwhile share it. */
function returnToLatestMessagesViaSdk(roomId: string): Promise<void> {
	const inFlight = latestReloads.get(roomId);
	if (inFlight) {
		return inFlight;
	}
	const reload = runWindowOperation(roomId, async () => {
		if (isDetached(roomId)) {
			await loadLatestWindowViaSdk(roomId);
		}
	}).finally(() => {
		if (latestReloads.get(roomId) === reload) {
			latestReloads.delete(roomId);
		}
	});
	latestReloads.set(roomId, reload);
	return reload;
}

/**
 * What a send, an attachment or the scroll-to-bottom button waits for: the reload goes on in the
 * background (nothing is cancelled), but the caller gives up after a while and the text goes back
 * to the composer. The queue can hold the latest page and up to MAX_CATCH_UP_PAGES more, each as
 * slow as WINDOW_LOAD_TIMEOUT_MS.
 */
function awaitReattach(roomId: string): Promise<void> {
	return new Promise<void>((resolve, reject) => {
		const timer = setTimeout(
			() => reject(new Error('return to the latest messages is taking too long')),
			REATTACH_CALLER_DEADLINE_MS
		);
		returnToLatestMessagesViaSdk(roomId).then(
			() => {
				clearTimeout(timer);
				resolve();
			},
			(err) => {
				clearTimeout(timer);
				reject(err);
			}
		);
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
): Promise<boolean> {
	// The placeholder is authored by the session user (the confirmation takes
	// the sender from the server response)
	if (!useStore.getState().session.id) {
		return Promise.resolve(false);
	}
	// A message sent from a window cut before the newest one would land after a hidden gap
	if (isDetached(roomId)) {
		return awaitReattach(roomId).then(
			() => (isDetached(roomId) ? false : sendTextViaSdk(caller, roomId, message, replyToId)),
			(err) => {
				console.error(`chatClient.${caller}: return to the latest messages failed`, err);
				return false;
			}
		);
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
	return wscSdk
		.sendMessage({
			roomId,
			text: sanitizeXmppMessage(message),
			tempId,
			...(replyToId
				? {
						replyToId,
						repliedMessage: findRepliedMessage(roomId, replyToId) as StoreTextMessage | undefined
					}
				: {})
		})
		.then(() => true)
		.catch((err) => {
			console.error(`chatClient.${caller}: message send failed`, err);
			return false;
		});
}

async function loadBackwardPageViaSdk(
	roomId: string,
	endHistory: number,
	quantity: number | undefined,
	oldestIdAtCall: string | undefined
): Promise<void> {
	const room = useStore.getState().rooms[roomId];
	const oldest = getOldestConfirmedMessage(
		useStore.getState().chatsRegistry[roomId]?.messages ?? []
	);
	// The window was replaced after the loader asked: its anchor is gone, and the loader
	// asks again from the new window
	if (!room || oldest?.id !== oldestIdAtCall) {
		useStore.getState().setHistoryLoadDisabled(roomId, false);
		return;
	}
	const lowerBound = room.userSettings?.clearedAt ?? room.createdAt;
	let failed = false;
	try {
		await wscSdk.fetchTimeline(roomId, {
			// With history in store the bound anchors the page backwards from
			// the known head (live events may have landed before the first
			// load). On an empty store the v1 call-site bound is a synthetic
			// client-clock now(): omitted, so "the latest N" is decided by the
			// SERVER clock — a client running behind would otherwise cut off
			// the most recent messages on the first load.
			...(oldest ? { before: endHistory } : {}),
			// Composite cursor only when the anchor is a message already in store
			...(oldest?.date === endHistory ? { beforeId: oldest.id } : {}),
			...(quantity === undefined ? {} : { limit: quantity }),
			...(lowerBound ? { notBefore: dateToTimestamp(lowerBound) } : {}),
			...windowLoadOptions(roomId)
		});
	} catch (err) {
		if (!isAbortError(err)) {
			failed = true;
		}
		throw err;
	} finally {
		// The loader asks again by itself while it is in view, so it is enabled again whatever the
		// outcome: at once after a page or an abort, after a growing delay after an error (a backend
		// that fails at once, offline or 5xx, must not be asked every half second)
		if (failed) {
			scheduleLoaderRetry(roomId, () => useStore.getState().setHistoryLoadDisabled(roomId, false));
		} else {
			resetLoaderRetry(roomId);
			useStore.getState().setHistoryLoadDisabled(roomId, false);
		}
	}
}

/** The date of a message that is not in the window: a search result or the pinned message. */
function findKnownMessageDate(roomId: string, stanzaId: string): number | undefined {
	const store = useStore.getState();
	const result = store.chatsRegistry[roomId]?.searchResults.find((row) => row.id === stanzaId);
	if (result) {
		return result.date;
	}
	const pinned = store.activeConversations[roomId]?.messagePinned;
	return pinned?.id === stanzaId ? pinned.date : undefined;
}

/**
 * v2 replacement of the MAM `to-id` form behind the search-result and pin jumps: the window of
 * the room becomes the timeline page around the target (one request, wherever the target is).
 * The page replaces the rows when the response is processed, so a load that fails leaves the
 * window as it was. The rows before and after the old window are not contiguous with the new
 * one: the window is flagged as cut before the newest message until the forward pages reach it.
 * Resolves whether the target is in the window.
 */
function loadWindowAroundMessageViaSdk(
	roomId: string,
	stanzaId: string,
	dateHint?: number
): Promise<boolean> {
	return runWindowOperation(roomId, async () => {
		const store = useStore.getState();
		// v2 invariant id === stanzaId: the same by-id lookup the reply hydration
		// uses matches the panel's "already stored" selector on confirmed messages
		if (!store.rooms[roomId] || isTextMessageStored(roomId, stanzaId)) {
			return isTextMessageStored(roomId, stanzaId);
		}
		const date = dateHint ?? findKnownMessageDate(roomId, stanzaId);
		if (date === undefined) {
			console.warn('chatClient.requestMessageResultHistoryToId: unknown message date', stanzaId);
			return false;
		}
		const notBefore = getNotBefore(roomId);
		// Below the cleared-history floor (a pin can be): the page would be empty and leave no anchor
		if (notBefore !== undefined && date < notBefore) {
			return false;
		}
		// The loaders must not page the window while it is replaced
		store.setHistoryLoadDisabled(roomId, true);
		// Applied when the rows land, so the list does not scroll to the bottom for a moment
		setReplaceScrollTarget(roomId, stanzaId);
		try {
			const { hasMoreAfter, newest } = await wscSdk.fetchTimeline(roomId, {
				around: date,
				aroundId: stanzaId,
				replaceWindow: true,
				...(notBefore ? { notBefore } : {}),
				...windowLoadOptions(roomId)
			});
			forwardCursors.delete(roomId);
			if (!hasMoreAfter) {
				await attachWindow(roomId, newest);
			} else if (newest) {
				forwardCursors.set(roomId, newest);
			}
		} finally {
			setReplaceScrollTarget(roomId, undefined);
			useStore.getState().setHistoryLoadDisabled(roomId, false);
		}
		return isTextMessageStored(roomId, stanzaId);
	}).then((loaded) => loaded ?? false);
}

function loadNextPageAfterViaSdk(roomId: string): Promise<void> {
	return runWindowOperation(roomId, async () => {
		if (!isDetached(roomId)) {
			return;
		}
		const from = forwardCursors.get(roomId) ?? newestServerRow(roomId);
		if (!from) {
			return;
		}
		const result = await wscSdk.fetchTimeline(roomId, {
			after: from.date,
			afterId: from.id,
			...windowLoadOptions(roomId)
		});
		if (!result.hasMoreAfter) {
			await attachWindow(roomId, result.newest ?? from);
			return;
		}
		if (!result.newest || (result.newest.id === from.id && result.newest.date === from.date)) {
			console.warn('chatClient.requestMessagesAfter: pagination stalled', roomId);
			return;
		}
		forwardCursors.set(roomId, result.newest ?? from);
	});
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
		markChatStack(isWscPure());
		if (isWscPure()) {
			wsDebug('chatClient.connect: WSC-pure backend, chat boots through the SDK');
			// REST has no persistent chat connection: the legacy xmpp status flag
			// feeds the connection-health banners, so mark it healthy.
			useStore.getState().setXmppStatus(true);
			scheduleBootInbox();
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
				return replacePlaceholderRoom(placeholderRoom[1], message)
					.then((response) => chatClient.sendChatMessage(response.id, message))
					.catch((err) => {
						console.error('chatClient.sendChatMessage: room creation failed', err);
						return false;
					});
			}
			return sendTextViaSdk('sendChatMessage', roomId, message);
		}
		xmppClient.sendChatMessage(roomId, message);
		return Promise.resolve(true);
	},
	sendChatMessageReply: (roomId, message, replyTo, replyMessageId) => {
		if (isWscPure()) {
			// The 3rd v1 arg (the quoted author, only needed for the XMPP `to`
			// address) has no v2 counterpart: the server resolves the quoted
			// message from replyToId.
			return sendTextViaSdk('sendChatMessageReply', roomId, message, replyMessageId);
		}
		xmppClient.sendChatMessageReply(roomId, message, replyTo, replyMessageId);
		return Promise.resolve(true);
	},
	sendChatMessageEdit: (roomId, message, messageStanzaId, parentStanzaId) => {
		if (isWscPure()) {
			// The 4th v1 arg (the previous correction's stanza id, the XEP-0422
			// parent-id) has no v2 counterpart: the edit is keyed on the stable
			// message id, unchanged across corrections. No optimistic write, like
			// v1: the bubble updates on whichever confirmation lands first (REST
			// response or MessageEdited echo).
			wscSdk
				.editMessage({
					roomId,
					messageId: messageStanzaId,
					text: sanitizeXmppMessage(message)
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
				// The v1 removal was an empty-valued stanza; v2 DELETEs the single
				// reaction of the user. Nothing active in the store, nothing to
				// remove: the empty v1 stanza was a no-op there too.
				const myReaction = getMyLastReaction(useStore.getState(), roomId, messageStanzaId);
				if (!myReaction) {
					return;
				}
				wscSdk.removeReaction(roomId, messageStanzaId).catch((err) => {
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
			const oldestAtCall = getOldestConfirmedMessage(store.chatsRegistry[roomId]?.messages ?? []);
			runWindowOperation(roomId, () =>
				loadBackwardPageViaSdk(roomId, endHistory, quantity, oldestAtCall?.id)
			).catch((err) => {
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
			downloadChatExport(roomId).catch((err) => {
				console.error('chatClient.requestFullHistory: chat export download failed', err);
			});
			return;
		}
		xmppClient.requestFullHistory(...args);
	},
	fullTextSearch: (roomId, text) => {
		if (isWscPure()) {
			// The first page of the query: the next ones come from fullTextSearchNextPage. The v1 MAM
			// `start` bound (clearedAt ?? createdAt) travels as notBefore: the
			// spec has no server-side lower bound, the SDK filters client-side.
			// Optional chaining is an improvement: v1 threw on unknown rooms.
			const notBefore = getNotBefore(roomId);
			const store = useStore.getState();
			store.beginSearch(roomId);
			store.setSearchHasMore(roomId, false);
			const isCurrent = searchTracker(roomId);
			// The page is written here, after the check: the SDK would write the page of a query that
			// is no longer the current one
			return wscSdk
				.searchMessages(roomId, text, { writeResults: false, ...(notBefore ? { notBefore } : {}) })
				.then(({ messages, hasMore }) => {
					if (isCurrent()) {
						useStore.getState().setSearchResults(roomId, messages as Array<TextMessage>);
						useStore.getState().setSearchHasMore(roomId, hasMore);
					}
				});
		}
		return xmppClient.fullTextSearch(roomId, text);
	},
	fullTextSearchNextPage: (roomId, text) => {
		if (!isWscPure()) {
			return Promise.resolve();
		}
		const results = useStore.getState().chatsRegistry[roomId]?.searchResults ?? [];
		const oldest = results[results.length - 1];
		if (!oldest) {
			return Promise.resolve();
		}
		const notBefore = getNotBefore(roomId);
		const isCurrent = searchTracker(roomId);
		return wscSdk
			.searchMessages(roomId, text, {
				before: oldest.date,
				beforeId: oldest.id,
				writeResults: false,
				...(notBefore ? { notBefore } : {})
			})
			.then(({ messages, hasMore }) => {
				// The query changed while the page was in flight: it belongs to the old one
				if (!isCurrent()) {
					return;
				}
				useStore.getState().appendSearchResults(roomId, messages as Array<TextMessage>);
				// A page that adds nothing ends the paging, whatever the server says: no endless requests
				useStore.getState().setSearchHasMore(roomId, hasMore && messages.length > 0);
			});
	},
	requestMessageResultHistoryToId: (roomId, stanzaId, date) => {
		if (isWscPure()) {
			return loadWindowAroundMessageViaSdk(roomId, stanzaId, date);
		}
		return xmppClient
			.requestMessageResultHistoryToId(roomId, stanzaId)
			.then(() => isTextMessageStored(roomId, stanzaId));
	},
	requestMessagesAfter: (roomId) => {
		if (!isWscPure()) {
			return Promise.resolve();
		}
		return loadNextPageAfterViaSdk(roomId);
	},
	returnToLatestMessages: (roomId) => {
		if (!isWscPure()) {
			return Promise.resolve();
		}
		return awaitReattach(roomId);
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
			// F1 guard: a placeholder room (`placeholder-<userId>`, not yet
			// promoted to a real room by a first sent message) has no backing
			// room on the backend, so GET /pin 404s on every mount of Chat.tsx.
			// Same skip as sendIsWriting/sendPaused above.
			if (useStore.getState().rooms[roomId]?.placeholder) {
				return;
			}
			// Store-first with the latest live edit applied (the banner renders
			// the copy as-is), else the message GET /pin carries
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
