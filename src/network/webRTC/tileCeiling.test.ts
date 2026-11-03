/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, it } from 'vitest';

import { TOP_RUNG } from './inboundQualityController';
import { ceilingRungForHeight } from './tileCeiling';
import { SimulcastTier } from '../../types/store/SessionTypes';

const TIERS: SimulcastTier[] = [
	{ name: 'low', height: 144 },
	{ name: 'medium', height: 360 },
	{ name: 'high', height: 720 }
];

describe('ceilingRungForHeight — smallest covering simulcast tier', () => {
	it('picks the smallest tier that covers the physical pixel height (dpr=1)', () => {
		expect(ceilingRungForHeight(100, 1, TIERS)).toBe(0); // 100px -> 144 (low)
		expect(ceilingRungForHeight(144, 1, TIERS)).toBe(0); // exact 144 -> 144 (low)
		expect(ceilingRungForHeight(200, 1, TIERS)).toBe(1); // 200px -> 360 (medium)
		expect(ceilingRungForHeight(360, 1, TIERS)).toBe(1); // exact 360 -> 360 (medium)
		expect(ceilingRungForHeight(500, 1, TIERS)).toBe(2); // 500px -> 720 (high)
	});

	it('respects devicePixelRatio (multiplies the rendered height)', () => {
		// 200 CSS px on a 2x display = 400 physical px -> smallest covering tier is 720 (high).
		expect(ceilingRungForHeight(200, 2, TIERS)).toBe(2);
		// 100 CSS px on a 2x display = 200 physical px -> 360 (medium).
		expect(ceilingRungForHeight(100, 2, TIERS)).toBe(1);
	});

	it('returns the tallest tier rung when the tile is taller than every tier', () => {
		expect(ceilingRungForHeight(9999, 1, TIERS)).toBe(2);
	});

	it('returns TOP_RUNG (no cap) when tiers are absent or empty', () => {
		expect(ceilingRungForHeight(50, 1, undefined)).toBe(TOP_RUNG);
		expect(ceilingRungForHeight(50, 1, [])).toBe(TOP_RUNG);
	});

	it('is order-independent (sorts tiers by height)', () => {
		const unsorted: SimulcastTier[] = [
			{ name: 'high', height: 720 },
			{ name: 'low', height: 144 },
			{ name: 'medium', height: 360 }
		];
		expect(ceilingRungForHeight(200, 1, unsorted)).toBe(1);
	});

	it('falls back to dpr 1 when devicePixelRatio is falsy', () => {
		expect(ceilingRungForHeight(200, 0, TIERS)).toBe(1);
	});
});
