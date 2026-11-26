/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { getOldestConfirmedMessage, isPendingMessage } from './historyAnchorUtils';
import { PLACEHOLDER_STANZA_PREFIX } from '../constants/messageConstants';
import { createMockConfigurationMessage, createMockTextMessage } from '../tests/createMock';
import { MarkerStatus } from '../types/store/ChatsRegistryTypes';

const pending = createMockTextMessage({
	id: 'p1',
	stanzaId: `${PLACEHOLDER_STANZA_PREFIX}p1`,
	date: 100,
	read: MarkerStatus.PENDING
});
const confirmed = createMockTextMessage({ id: 'm1', stanzaId: 'm1', date: 500 });

describe('historyAnchorUtils', () => {
	test('A placeholder is pending, a server message is not', () => {
		expect(isPendingMessage(pending)).toBe(true);
		expect(isPendingMessage(confirmed)).toBe(false);
		expect(isPendingMessage(createMockConfigurationMessage())).toBe(false);
	});

	test('The oldest confirmed message skips the placeholders in front of it', () => {
		expect(getOldestConfirmedMessage([pending, confirmed])).toBe(confirmed);
	});

	test('Only placeholders: no anchor', () => {
		expect(getOldestConfirmedMessage([pending])).toBeUndefined();
	});
});
