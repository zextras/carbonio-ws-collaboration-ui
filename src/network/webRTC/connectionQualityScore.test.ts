/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, it } from 'vitest';

import {
	isUnstableQuality,
	jitterScore,
	LOSS_BAD_VIDEO,
	lossScore,
	rttScore,
	scoreToLevel
} from './connectionQualityScore';

describe('scoreToLevel', () => {
	it('maps the 0..10 score onto the 5 bars via round(score/2), half-up — no arbitrary cut-points', () => {
		// bars = round(s/2): optimal 5, high 4, medium 3, poor 2, terrible 0-1. Boundaries at odd scores.
		expect(scoreToLevel(10)).toBe('optimal'); // 5 bars
		expect(scoreToLevel(9)).toBe('optimal'); // 4.5 -> 5 (half-up)
		expect(scoreToLevel(8.9)).toBe('high'); // 4.45 -> 4
		expect(scoreToLevel(7)).toBe('high'); // 3.5 -> 4
		expect(scoreToLevel(6.9)).toBe('medium'); // 3.45 -> 3
		expect(scoreToLevel(5)).toBe('medium'); // 2.5 -> 3
		expect(scoreToLevel(4.9)).toBe('poor'); // 2.45 -> 2
		expect(scoreToLevel(3)).toBe('poor'); // 1.5 -> 2
		expect(scoreToLevel(2.9)).toBe('terrible'); // 1.45 -> 1
		expect(scoreToLevel(0)).toBe('terrible'); // 0 bars
	});
});

describe('rttScore', () => {
	it('is 10 when RTT is unknown (no evidence of latency harm)', () => {
		expect(rttScore(undefined)).toBe(10);
	});

	it('is 10 at/under RTT_GOOD (200 ms) and 0 at/over RTT_BAD (700 ms)', () => {
		expect(rttScore(150)).toBe(10);
		expect(rttScore(200)).toBe(10);
		expect(rttScore(700)).toBe(0);
		expect(rttScore(900)).toBe(0);
	});

	it('is a convex knee between the two thresholds', () => {
		// (700-450)/(700-200) = 0.5 -> 10*0.25 = 2.5
		expect(rttScore(450)).toBeCloseTo(2.5, 5);
	});
});

describe('jitterScore', () => {
	it('is 10 when jitter is unknown', () => {
		expect(jitterScore(undefined)).toBe(10);
	});

	it('is 10 at/under JITTER_GOOD (30 ms) and 0 at/over JITTER_BAD (120 ms)', () => {
		expect(jitterScore(10)).toBe(10);
		expect(jitterScore(30)).toBe(10);
		expect(jitterScore(120)).toBe(0);
		expect(jitterScore(200)).toBe(0);
	});

	it('is a convex knee between the two thresholds', () => {
		// (120-75)/(120-30) = 0.5 -> 10*0.25 = 2.5
		expect(jitterScore(75)).toBeCloseTo(2.5, 5);
	});
});

describe('lossScore', () => {
	it('is 10 when loss is unknown', () => {
		expect(lossScore(undefined)).toBe(10);
	});

	it('has a 2% deadband (noise stays 10), then reaches 0 at LOSS_BAD_AUDIO via a convex knee', () => {
		expect(lossScore(0)).toBe(10);
		expect(lossScore(0.01)).toBe(10); // below the 2% deadband — treated as noise
		expect(lossScore(0.02)).toBe(10); // deadband edge (GCC "increase" region)
		// 5% above deadband: (0.22-0.07)/(0.22-0.02) = 0.75 -> 10*0.5625 = 5.625
		expect(lossScore(0.07)).toBeCloseTo(5.625, 5);
		// 10% loss: (0.22-0.1)/(0.22-0.02) = 0.6 -> 10*0.36 = 3.6
		expect(lossScore(0.1)).toBeCloseTo(3.6, 5);
		// at/above LOSS_BAD_AUDIO (22%) the score reaches a hard 0
		expect(lossScore(0.22)).toBe(0);
		expect(lossScore(0.5)).toBe(0);
	});

	it('accepts an explicit bad threshold — video uses LOSS_BAD_VIDEO (2× audio tolerance)', () => {
		// At 22% loss: audio->0, video->(0.42-0.22)/(0.42-0.02)=0.5->10*0.25=2.5
		expect(lossScore(0.22, LOSS_BAD_VIDEO)).toBeCloseTo(2.5, 5);
		// At 42%: exactly at bad point -> 0
		expect(lossScore(0.42, LOSS_BAD_VIDEO)).toBe(0);
	});
});

describe('isUnstableQuality', () => {
	it('is true only for poor, terrible and lost (below medium)', () => {
		expect(isUnstableQuality('poor')).toBe(true);
		expect(isUnstableQuality('terrible')).toBe(true);
		expect(isUnstableQuality('lost')).toBe(true);
	});

	it('is false for medium and above (a stable or merely-throttled link)', () => {
		expect(isUnstableQuality('medium')).toBe(false);
		expect(isUnstableQuality('high')).toBe(false);
		expect(isUnstableQuality('optimal')).toBe(false);
	});
});
