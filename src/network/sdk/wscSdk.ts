/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createHttpClient, createWscClient } from '@zextras/carbonio-ws-collaboration-sdk';
import type {
	StoreBridge,
	StoreMarker,
	StoreMessage,
	StoreMessageFastening,
	StoreTextMessage
} from '@zextras/carbonio-ws-collaboration-sdk';

import useStore from '../../store/Store';
import type {
	ConfigurationMessage,
	Marker,
	Message,
	MessageFastening,
	TextMessage
} from '../../types/store/ChatsRegistryTypes';
import type { Version } from '../../types/store/SessionTypes';
import { BASE_PATH } from '../../utils/FetchUtils';

// The SDK emits structural store types (string-literal unions with the same
// wire values as the store enums); the enums are nominal, hence the single
// cast at this boundary.
const bridge: StoreBridge = {
	setInboxMessages: (messages: Array<StoreMessage>): void =>
		useStore.getState().setInboxMessages(messages as Array<Message>),
	setUnreadCount: (roomId, count): void => useStore.getState().setUnreadCount(roomId, count),
	updateReadStatus: (roomId, markers: Array<StoreMarker>): void =>
		useStore.getState().updateReadStatus(roomId, markers as Array<Marker>),
	setUserPresence: (userId, online): void => useStore.getState().setUserPresence(userId, online),
	setUserLastActivity: (userId, date): void =>
		useStore.getState().setUserLastActivity(userId, date),
	updateHistory: (roomId, messages: Array<StoreMessage>): void =>
		useStore.getState().updateHistory(roomId, messages as Array<Message>),
	setHistoryIsFullyLoaded: (roomId): void => useStore.getState().setHistoryIsFullyLoaded(roomId),
	addCreateRoomMessage: (roomId): void => useStore.getState().addCreateRoomMessage(roomId),
	newMessage: (message: StoreMessage): void => useStore.getState().newMessage(message as Message),
	removePlaceholderMessage: (roomId, messageId): void =>
		useStore.getState().removePlaceholderMessage(roomId, messageId),
	addFastening: (fastenings: Array<StoreMessageFastening>): void =>
		useStore.getState().addFastening(fastenings as Array<MessageFastening>),
	setLastMessage: (roomId, message: StoreMessage): void =>
		useStore.getState().setLastMessage(roomId, message as TextMessage | ConfigurationMessage),
	setPinnedMessage: (roomId, message: StoreTextMessage): void =>
		useStore.getState().setPinnedMessage(roomId, message as TextMessage),
	removePinnedMessage: (roomId): void => useStore.getState().removePinnedMessage(roomId),
	setIsWriting: (roomId, userId, writing): void =>
		useStore.getState().setIsWriting(roomId, userId, writing)
};

const http = createHttpClient({
	fetch: (url, init) => window.fetch(url, init),
	baseUrl: BASE_PATH,
	versionStore: {
		getApiVersion: (): string | undefined => useStore.getState().session.apiVersion,
		setApiVersion: (version: string): void => useStore.getState().setApiVersion(version as Version),
		getSupportedVersions: (): ReadonlyArray<string> =>
			useStore.getState().session.supportedVersions ?? []
	},
	getExtraHeaders: (): Record<string, string> => {
		const { queueId } = useStore.getState().session;
		return queueId ? { 'queue-id': queueId } : {};
	},
	// Surfaces protocol diagnostics (e.g. the 422 version renegotiation)
	logger: { warn: console.warn, error: console.error }
});

export const wscSdk = createWscClient({ http, bridge });
