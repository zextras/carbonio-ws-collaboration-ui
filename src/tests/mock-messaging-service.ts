/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { IMessagingService } from '../types/network/messaging/IMessagingService';

export const mockMessagingService = {
	connect: vi.fn(),
	setOnline: vi.fn(),
	getLastActivity: vi.fn(),
	sendPong: vi.fn(),
	sendMessage: vi.fn(),
	sendReply: vi.fn(),
	editMessage: vi.fn(),
	deleteMessage: vi.fn(),
	sendReaction: vi.fn(),
	requestHistory: vi.fn(),
	requestFullHistory: vi.fn(),
	requestHistoryBetweenDates: vi.fn(),
	requestMessageSubjectOfReply: vi.fn(),
	requestMessageToForward: vi.fn().mockResolvedValue(undefined),
	requestMessageResultHistoryToId: vi.fn().mockResolvedValue(undefined),
	searchMessages: vi.fn().mockResolvedValue(undefined),
	sendTyping: vi.fn(),
	sendTypingPaused: vi.fn(),
	markAsRead: vi.fn(),
	requestReadMarkers: vi.fn(),
	pinMessage: vi.fn(),
	unpinMessage: vi.fn(),
	getPinnedMessage: vi.fn(),
	features: ['zextras:iq:pin']
} satisfies IMessagingService;
