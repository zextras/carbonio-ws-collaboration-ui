/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, it } from 'vitest';

import {
	computeConnectionQuality,
	lossScore,
	rttScore,
	scoreToLevel
} from './connectionQualityScore';

describe('rttScore (convex interactivity knee)', () => {
	it('is a perfect 10 at or below the good-RTT floor', () => {
		expect(rttScore(0)).toBe(10);
		expect(rttScore(150)).toBe(10);
		expect(rttScore(200)).toBe(10);
	});

	it('is 0 at or above the bad-RTT ceiling', () => {
		expect(rttScore(700)).toBe(0);
		expect(rttScore(1200)).toBe(0);
	});

	it('falls convexly between the floor and ceiling', () => {
		// x=(700-450)/500=0.5 -> 10*0.5^2 = 2.5
		expect(rttScore(450)).toBeCloseTo(2.5, 5);
		// x=(700-600)/500=0.2 -> 10*0.2^2 = 0.4
		expect(rttScore(600)).toBeCloseTo(0.4, 5);
	});

	it('gives the benefit of the doubt when RTT is unknown', () => {
		expect(rttScore(undefined)).toBe(10);
	});
});

describe('lossScore (concave exponential decay)', () => {
	it('is a perfect 10 with no loss', () => {
		expect(lossScore(0)).toBe(10);
	});

	it('is front-loaded: ~1/e of the range gone by 5% loss', () => {
		expect(lossScore(0.05)).toBeCloseTo(10 * Math.exp(-1), 5); // 3.68
		expect(lossScore(0.1)).toBeCloseTo(10 * Math.exp(-2), 5); // 1.35
	});

	it('gives the benefit of the doubt when loss is unknown', () => {
		expect(lossScore(undefined)).toBe(10);
	});
});

describe('scoreToLevel', () => {
	it('maps the score bands to the five levels', () => {
		expect(scoreToLevel(1)).toBe('terrible');
		expect(scoreToLevel(3)).toBe('poor');
		expect(scoreToLevel(5)).toBe('medium');
		expect(scoreToLevel(7)).toBe('high');
		expect(scoreToLevel(10)).toBe('optimal');
	});
});

describe('computeConnectionQuality (the single vote)', () => {
	it('is "lost" whenever ICE is not connected, regardless of the sample', () => {
		expect(computeConnectionQuality({ rttMs: 20, lossUp: 0, lossDown: 0 }, false)).toBe('lost');
	});

	it('is "optimal" when there is no signal at all (idle/muted, RTT unknown)', () => {
		expect(computeConnectionQuality({}, true)).toBe('optimal');
	});

	it('is "optimal" on a clean, low-latency link', () => {
		expect(computeConnectionQuality({ rttMs: 100, lossUp: 0, lossDown: 0 }, true)).toBe('optimal');
	});

	it('takes the worse of up/down loss', () => {
		// downlink 10% dominates the near-zero uplink -> poor
		expect(computeConnectionQuality({ rttMs: 20, lossUp: 0.001, lossDown: 0.1 }, true)).toBe(
			'poor'
		);
	});

	it('reads moderate Wi-Fi loss on a fast link as "medium"', () => {
		// 5% loss, 40 ms: rttScore 10, lossScore 3.68 -> blend ~5.3 -> medium
		expect(computeConnectionQuality({ rttMs: 40, lossUp: 0.05 }, true)).toBe('medium');
	});

	it('lets bad RTT alone pull the level down even with no loss information', () => {
		// 600 ms, loss unknown: rttScore 0.4, lossScore 10 -> blend ~2.8 -> poor
		expect(computeConnectionQuality({ rttMs: 600 }, true)).toBe('poor');
	});
});
