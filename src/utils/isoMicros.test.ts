/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { parseIsoMicros, toIsoMicros } from './isoMicros';

describe('isoMicros', () => {
	it('keeps the microseconds through a round trip', () => {
		const iso = '2026-08-01T10:05:00.123456Z';
		expect(toIsoMicros(parseIsoMicros(iso))).toBe(iso);
	});

	it('orders instants that differ only by microseconds', () => {
		expect(parseIsoMicros('2026-08-01T10:05:00.123457Z')).toBeGreaterThan(
			parseIsoMicros('2026-08-01T10:05:00.123456Z')
		);
	});

	it('pads short fractions and parses plain ISO strings', () => {
		expect(parseIsoMicros('2026-08-01T10:05:00.5Z')).toBe(Date.parse('2026-08-01T10:05:00.500Z'));
		expect(parseIsoMicros('2026-08-01T10:05:00Z')).toBe(Date.parse('2026-08-01T10:05:00Z'));
		expect(parseIsoMicros(undefined)).toBe(0);
	});
});
