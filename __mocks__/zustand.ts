/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { act, cleanup } from '@testing-library/react';
import { StateCreator, StoreApi, UseBoundStore, create as actualCreate } from 'zustand';

import { deleteAttachment } from '../src/network/apis/AttachmentsApi';
import ChatApi from '../src/network/apis/ChatApi';
import { IMessagingBackend } from '../src/network/messaging/IMessagingBackend';
import { WebSocketClient } from '../src/network/websocket/WebSocketClient';
import { MarkerStatus, MessageType, TextMessage } from '../src/types/store/ChatsRegistryTypes';
import { RootStore } from '../src/types/store/StoreTypes';

// a variable to hold reset functions for all stores declared in the app
const storeResetFns = new Set<() => void>();

// Default test backend that delegates to ChatApi so that existing tests which
// spy on ChatApi.sendMessage / ChatApi.editMessage etc. continue to work after the
// IMessagingBackend strategy refactoring (c68a7d2e). This is equivalent to
// RestMessagingBackend but without real network side-effects (ChatApi is mocked
// via setupTests → vi.mock via FetchUtils mock).
export const mockMessagingBackend: IMessagingBackend = {
	sendMessage: vi.fn((roomId, text, replyTo) => {
		ChatApi.sendMessage(roomId, text, replyTo?.messageId).catch(() => undefined);
	}),
	editMessage: vi.fn((roomId, messageId, text) => {
		ChatApi.editMessage(roomId, messageId, text).catch(() => undefined);
	}),
	deleteMessage: vi.fn((roomId, messageId, attachmentId) => {
		const doDelete = (): void => {
			ChatApi.deleteMessage(roomId, messageId).catch(() => undefined);
		};
		if (attachmentId) {
			deleteAttachment(attachmentId).then(doDelete).catch(doDelete);
		} else {
			doDelete();
		}
	}),
	forwardMessages: vi.fn((targetRoomIds: string[], messages: TextMessage[]) => {
		const mapped = messages.map((m) => ({ sourceRoomId: m.roomId, messageId: m.stanzaId }));
		return Promise.allSettled(
			targetRoomIds.map((id: string) => ChatApi.forwardMessages(id, mapped))
		).then(() => undefined);
	}),
	toggleReaction: vi.fn((roomId, stanzaId, emoji, shouldRemove) => {
		if (shouldRemove) {
			ChatApi.removeReaction(roomId, stanzaId, emoji);
		} else {
			ChatApi.addReaction(roomId, stanzaId, emoji);
		}
	}),
	markAsRead: vi.fn((roomId, messageId) => {
		ChatApi.setReadMarker(roomId, messageId).catch(() => undefined);
	}),
	pinMessage: vi.fn((roomId, messageId) => {
		ChatApi.pinMessage(roomId, messageId).catch(() => undefined);
	}),
	unpinMessage: vi.fn((roomId, messageId) => {
		ChatApi.unpinMessage(roomId, messageId).catch(() => undefined);
	}),
	getPinnedMessage: vi.fn((roomId) =>
		ChatApi.getPinnedMessage(roomId)
			.then((pins) => {
				if (!pins || !Array.isArray(pins) || pins.length === 0) return undefined;
				const sorted = [...pins].sort((a, b) => Date.parse(b.pinnedAt) - Date.parse(a.pinnedAt));
				const pin = sorted[0];
				return {
					id: pin.messageId,
					stanzaId: pin.messageId,
					roomId: pin.roomId,
					from: pin.senderId,
					text: pin.text,
					date: Date.parse(pin.pinnedAt),
					type: MessageType.TEXT_MSG,
					read: MarkerStatus.READ
				} as TextMessage;
			})
			.catch(() => undefined)
	),
	canPin: vi.fn(() => true),
	sendTyping: vi.fn(),
	sendTypingStopped: vi.fn(),
	requestExportHistory: vi.fn(),
	applyFastening: vi.fn((action) => {
		if (action === 'edit')
			return { edited: true, editedInfo: { editedAt: new Date().toISOString() } };
		return { deleted: true, deletedInfo: { deletedBy: '', deletedAt: new Date().toISOString() } };
	})
};

// when creating a store, we get its initial state, create a reset function and add it in the set
export const create =
	() =>
	(createState: StateCreator<RootStore>): UseBoundStore<StoreApi<RootStore>> => {
		const store = actualCreate(createState);
		const initialState = store.getState();
		storeResetFns.add(() => {
			const resetStore = {
				...initialState,
				connections: {
					wsClient: new WebSocketClient(),
					status: {},
					isMongooseIM: undefined,
					messagingBackend: mockMessagingBackend
				}
			};
			store.setState(resetStore, true);
		});
		return store;
	};

beforeEach(() => {
	act(() => {
		storeResetFns.forEach((resetFn) => resetFn());
	});
});

afterEach(() => {
	cleanup();
});

export default create;
