/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, it } from 'vitest';

import { deltaLossRate, stepHysteresis } from './ConnectionQualityMonitor';
import { ConnectionQuality } from './connectionQualityScore';

describe('deltaLossRate', () => {
	it('returns 0 when there are fewer than minSamples total packets', () => {
		expect(deltaLossRate(2, 2, 0, 0)).toBe(0);
	});

	it('computes the delta loss fraction when denominator meets the threshold', () => {
		// 5 new lost, 15 new received → loss = 5/20 = 0.25
		expect(deltaLossRate(5, 15, 0, 0)).toBe(0.25);
	});

	it('clamps negative deltas to 0', () => {
		// prevLost > currentLost is a reset/reorder artifact; treat as 0 new loss
		expect(deltaLossRate(0, 20, 10, 0)).toBe(0);
	});

	it('returns 0 on a clean tick', () => {
		expect(deltaLossRate(10, 110, 10, 100)).toBe(0);
	});

	it('uses a custom minSamples threshold', () => {
		// 4 total packets < default 5 → 0, but >= custom 3 → actual rate
		expect(deltaLossRate(1, 3, 0, 0, 3)).toBeCloseTo(0.25);
		expect(deltaLossRate(1, 3, 0, 0, 5)).toBe(0);
	});
});

describe('stepHysteresis', () => {
	it('commits the first level immediately regardless of direction', () => {
		const r = stepHysteresis('medium', null, 0);
		expect(r).toEqual({ next: 'medium', streak: 0, changed: true });
	});

	it('commits to "lost" immediately even when currently optimal', () => {
		const r = stepHysteresis('lost', 'optimal', 0);
		expect(r).toEqual({ next: 'lost', streak: 0, changed: true });
	});

	it('does not fire changed when level is already "lost"', () => {
		const r = stepHysteresis('lost', 'lost', 0);
		expect(r.changed).toBe(false);
		expect(r.next).toBe('lost');
	});

	it('commits a worsening level immediately (1 tick)', () => {
		const r = stepHysteresis('poor', 'optimal', 0);
		expect(r).toEqual({ next: 'poor', streak: 0, changed: true });
	});

	it('does not commit an improvement until the 3rd consecutive better tick', () => {
		let streak = 0;
		const committed: ConnectionQuality = 'poor';

		const r1 = stepHysteresis('optimal', committed, streak);
		expect(r1.changed).toBe(false);
		expect(r1.next).toBe('poor');
		streak = r1.streak;

		const r2 = stepHysteresis('optimal', committed, streak);
		expect(r2.changed).toBe(false);
		expect(r2.next).toBe('poor');
		streak = r2.streak;

		const r3 = stepHysteresis('optimal', committed, streak);
		expect(r3.changed).toBe(true);
		expect(r3.next).toBe('optimal');
		expect(r3.streak).toBe(0);
	});

	it('resets the better streak when a same-level tick arrives', () => {
		const r1 = stepHysteresis('optimal', 'poor', 0);
		expect(r1.streak).toBe(1);

		const r2 = stepHysteresis('poor', 'poor', r1.streak);
		expect(r2.streak).toBe(0);
		expect(r2.changed).toBe(false);
	});

	it('resets the better streak when the level worsens mid-climb', () => {
		const r1 = stepHysteresis('optimal', 'poor', 0);
		expect(r1.streak).toBe(1);

		const r2 = stepHysteresis('terrible', 'poor', r1.streak);
		expect(r2.streak).toBe(0);
		expect(r2.changed).toBe(true);
		expect(r2.next).toBe('terrible');
	});

	it('unchanged same-level produces changed: false', () => {
		const r = stepHysteresis('medium', 'medium', 0);
		expect(r).toEqual({ next: 'medium', streak: 0, changed: false });
	});
});
