/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { pickReadTarget, shouldRequestRead } from './readTargetUtils';
import { PLACEHOLDER_STANZA_PREFIX } from '../constants/messageConstants';
import {
	createMockConfigurationMessage,
	createMockDateMessage,
	createMockMessageFastening,
	createMockTextMessage
} from '../tests/createMock';
import { MarkerStatus } from '../types/store/ChatsRegistryTypes';

const systemEventId = '6f1c2a4e-8d3b-4f7a-9c21-0b5e7d9a3f10';

const other = createMockTextMessage({ id: 'm1', from: 'other', date: 100 });
const mine = createMockTextMessage({ id: 'm2', from: 'me', date: 200 });
const placeholder = createMockTextMessage({
	id: 'tmp',
	from: 'me',
	date: 300,
	stanzaId: `${PLACEHOLDER_STANZA_PREFIX}tmp`,
	read: MarkerStatus.PENDING
});

describe('pickReadTarget', () => {
	test('returns the last row when it is my own message', () => {
		expect(pickReadTarget([other, mine])).toBe(mine);
	});

	test('falls back to the newest persisted row above a placeholder', () => {
		expect(pickReadTarget([other, mine, placeholder])).toBe(mine);
	});

	test('skips date rows, fastenings and the client-side creation row', () => {
		const creation = createMockConfigurationMessage({ id: 'creationMessage-100', date: 99 });
		const fastening = createMockMessageFastening({ id: 'fastening', date: 400 });
		const date = createMockDateMessage({ id: 'dateMessage-500', date: 500 });
		expect(pickReadTarget([creation, other, fastening, date])).toBe(other);
		expect(pickReadTarget([creation, fastening, date])).toBeUndefined();
	});

	test('targets a system event with a server id', () => {
		const systemEvent = createMockConfigurationMessage({ id: systemEventId, date: 350 });
		expect(pickReadTarget([other, mine, systemEvent])).toBe(systemEvent);
	});

	test('ignores a configuration row without a server id', () => {
		const livePin = createMockConfigurationMessage({ id: 'pin_msg_1', date: 350 });
		expect(pickReadTarget([other, livePin])).toBe(other);
	});

	test('starts from the bottom-most visible row when it is given', () => {
		expect(pickReadTarget([other, mine], other.id)).toBe(other);
	});

	test('walks up from a non persisted bottom-most visible row', () => {
		expect(pickReadTarget([other, mine, placeholder], placeholder.id)).toBe(mine);
	});

	test('uses the last row when the visible id is unknown', () => {
		expect(pickReadTarget([other, mine], 'ghost')).toBe(mine);
	});

	test('returns undefined for an empty list', () => {
		expect(pickReadTarget([])).toBeUndefined();
	});
});

describe('shouldRequestRead', () => {
	test('requests when there is neither a marker nor a previous request', () => {
		expect(shouldRequestRead(100, undefined, undefined)).toBe(true);
	});

	test('does not request when the marker is already at or after the target', () => {
		expect(shouldRequestRead(100, 100, undefined)).toBe(false);
		expect(shouldRequestRead(100, 200, undefined)).toBe(false);
	});

	test('does not request when the same or a newer target was already requested', () => {
		expect(shouldRequestRead(100, 50, 100)).toBe(false);
		expect(shouldRequestRead(100, 50, 150)).toBe(false);
	});

	test('requests when the target is newer than marker and last request', () => {
		expect(shouldRequestRead(200, 100, 150)).toBe(true);
	});
});
