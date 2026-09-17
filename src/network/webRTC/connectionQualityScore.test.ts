/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, it } from 'vitest';

import {
	absoluteScore,
	combineVote,
	curveScore,
	isUnstableQuality,
	jitterScore,
	producibleCeiling,
	rttScore,
	scoreToBars,
	scoreToLevel,
	TIER_PENALTY_RATIO,
	tierPenalty,
	uplinkLossScore,
	uplinkShortfall,
	videoFpsScore,
	weightByTier
} from './connectionQualityScore';

describe('curveScore', () => {
	it('returns 10 when value is undefined (no evidence of harm)', () => {
		expect(curveScore(undefined, 200, 700)).toBe(10);
	});

	it('returns 10 at or below the good threshold', () => {
		expect(curveScore(200, 200, 700)).toBe(10);
		expect(curveScore(100, 200, 700)).toBe(10);
	});

	it('returns 0 at or above the bad threshold', () => {
		expect(curveScore(700, 200, 700)).toBe(0);
		expect(curveScore(900, 200, 700)).toBe(0);
	});

	it('follows a convex (quadratic) knee between thresholds', () => {
		// midpoint v=450: (700-450)/(700-200)=0.5 -> 10*0.25=2.5
		expect(curveScore(450, 200, 700)).toBeCloseTo(2.5, 5);
	});
});

describe('rttScore', () => {
	it('is 10 when RTT is unknown (no evidence of latency harm)', () => {
		expect(rttScore(undefined)).toBe(10);
	});

	it('is 10 at/under RTT_GOOD (150 ms) and 0 at/over RTT_BAD (700 ms)', () => {
		expect(rttScore(100)).toBe(10);
		expect(rttScore(150)).toBe(10);
		expect(rttScore(700)).toBe(0);
		expect(rttScore(900)).toBe(0);
	});

	it('is a convex knee between the two thresholds', () => {
		// midpoint v=425: (700-425)/(700-150) = 0.5 -> 10*0.25 = 2.5
		expect(rttScore(425)).toBeCloseTo(2.5, 5);
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

describe('uplinkLossScore', () => {
	it('is 10 when loss is unknown', () => {
		expect(uplinkLossScore(undefined)).toBe(10);
	});

	it('is 10 at 0% loss (below the 2% deadband — treated as noise)', () => {
		expect(uplinkLossScore(0)).toBe(10);
	});

	it('is 10 at the deadband edge (2% — GCC increase region)', () => {
		expect(uplinkLossScore(0.02)).toBe(10);
	});

	it('reaches 0 at/above LOSS_BAD_UP (16%)', () => {
		expect(uplinkLossScore(0.16)).toBe(0);
		expect(uplinkLossScore(0.5)).toBe(0);
	});

	it('is a convex knee between 2% and 16%', () => {
		// midpoint v=0.09: (0.16-0.09)/(0.16-0.02)=0.5 -> 10*0.25=2.5
		expect(uplinkLossScore(0.09)).toBeCloseTo(2.5, 5);
	});
});

describe('videoFpsScore', () => {
	it('returns 0 at 0 fps (completely stalled)', () => {
		expect(videoFpsScore(0)).toBe(0);
	});

	it('returns 10 at HEALTHY_FPS (15 fps)', () => {
		expect(videoFpsScore(15)).toBe(10);
	});

	it('returns 5 at a third of HEALTHY_FPS (5 fps → 3.33)', () => {
		expect(videoFpsScore(5)).toBeCloseTo(10 / 3, 5);
	});

	it('clamps to 10 above HEALTHY_FPS (20 fps → 10)', () => {
		expect(videoFpsScore(20)).toBe(10);
	});

	it('is monotonically non-decreasing: more fps → higher or equal score', () => {
		expect(videoFpsScore(0)).toBeLessThanOrEqual(videoFpsScore(3));
		expect(videoFpsScore(3)).toBeLessThanOrEqual(videoFpsScore(7));
		expect(videoFpsScore(7)).toBeLessThanOrEqual(videoFpsScore(10));
		expect(videoFpsScore(10)).toBeLessThanOrEqual(videoFpsScore(15));
	});
});

describe('combineVote', () => {
	it('returns 10 when all signals are perfect', () => {
		expect(combineVote(10, 10, 10)).toBe(10);
	});

	it('returns 0 when all signals are worst', () => {
		expect(combineVote(0, 0, 0)).toBe(0);
	});

	it('is worst-aware (lambda=0.7): one bad signal drags the result below the mean', () => {
		// combineVote(10,10,0): mean=20/3, min=0
		// score = 0.3*(20/3) + 0.7*0 = 2.0 -> round1 = 2
		expect(combineVote(10, 10, 0)).toBe(2);
	});

	it('rounds to 1 decimal', () => {
		// combineVote(10,5,8): mean=23/3=7.667, min=5
		// score = 0.3*7.667 + 0.7*5 = 2.3 + 3.5 = 5.8 -> round1 = 5.8
		expect(combineVote(10, 5, 8)).toBe(5.8);
	});
});

describe('scoreToBars', () => {
	it('maps 0..10 score onto 0..5 bars via round(score/2)', () => {
		expect(scoreToBars(0)).toBe(0);
		expect(scoreToBars(1)).toBe(1); // round(0.5) = 1 (half-up)
		expect(scoreToBars(2)).toBe(1); // round(1) = 1
		expect(scoreToBars(3)).toBe(2); // round(1.5) = 2
		expect(scoreToBars(5)).toBe(3); // round(2.5) = 3
		expect(scoreToBars(7)).toBe(4); // round(3.5) = 4
		expect(scoreToBars(9)).toBe(5); // round(4.5) = 5
		expect(scoreToBars(10)).toBe(5); // round(5) = 5
	});

	it('clamps below 0 and above 5', () => {
		expect(scoreToBars(-1)).toBe(0);
		expect(scoreToBars(12)).toBe(5);
	});
});

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

describe('producibleCeiling', () => {
	const tiers = [
		{ name: 'low' as const, height: 180 },
		{ name: 'medium' as const, height: 360 },
		{ name: 'high' as const, height: 720 }
	];

	it('returns null when tiers are undefined', () => {
		expect(producibleCeiling(undefined, 720)).toBeNull();
	});

	it('returns null when tiers list is empty', () => {
		expect(producibleCeiling([], 720)).toBeNull();
	});

	it('returns null when captureHeight is undefined', () => {
		expect(producibleCeiling(tiers, undefined)).toBeNull();
	});

	it('returns 0 (low) when camera is below even the lowest tier', () => {
		expect(producibleCeiling(tiers, 100)).toBe(0);
	});

	it('returns 0 (low) when camera matches only the low tier (180p)', () => {
		expect(producibleCeiling(tiers, 180)).toBe(0);
	});

	it('returns 1 (medium) when camera height is exactly the medium tier height (360p)', () => {
		expect(producibleCeiling(tiers, 360)).toBe(1);
	});

	it('returns 2 (high) when camera height is at or above the high tier (720p)', () => {
		expect(producibleCeiling(tiers, 720)).toBe(2);
		expect(producibleCeiling(tiers, 1080)).toBe(2);
	});

	it('never hardcodes heights — a custom tier list resolves by name rung', () => {
		const customTiers = [
			{ name: 'low' as const, height: 144 },
			{ name: 'medium' as const, height: 480 }
		];
		expect(producibleCeiling(customTiers, 144)).toBe(0);
		expect(producibleCeiling(customTiers, 480)).toBe(1);
		expect(producibleCeiling(customTiers, 200)).toBe(0);
	});
});

describe('weightByTier', () => {
	it('returns score unchanged (penalty=1) when shortfall is 0 (at hardware ceiling)', () => {
		expect(weightByTier(10, 2, 2)).toBe(10);
		expect(weightByTier(10, 0, 0)).toBe(10);
	});

	it('applies geometric penalty (0.63^1) for shortfall of 1, rounded to 1 decimal', () => {
		// 10 * 0.63 = 6.3 → round1 = 6.3
		const expected = Math.round(10 * 0.63 * 10) / 10;
		expect(weightByTier(10, 2, 1)).toBe(expected);
	});

	it('applies geometric penalty (0.63^2) for shortfall of 2, rounded to 1 decimal', () => {
		// 10 * 0.63^2 = 3.969 → round1 = 4.0
		const expected = Math.round(10 * 0.63 * 0.63 * 10) / 10;
		expect(weightByTier(10, 2, 0)).toBe(expected);
	});

	it('returns round1(score) unchanged when both tiers are null', () => {
		expect(weightByTier(7.5, null, null)).toBe(7.5);
	});

	it('returns round1(score) unchanged when maxHardwareTier is null', () => {
		expect(weightByTier(8, null, 1)).toBe(8);
	});

	it('returns round1(score) unchanged when maxUplinkTier is null', () => {
		expect(weightByTier(8, 2, null)).toBe(8);
	});

	it('does not penalise a low-res camera at its ceiling (maxUplink >= maxHardware)', () => {
		expect(weightByTier(6, 0, 0)).toBe(6);
	});

	it('rounds result to 1 decimal', () => {
		const raw = 10 * 0.63;
		const expected = Math.round(raw * 10) / 10;
		expect(weightByTier(10, 2, 1)).toBe(expected);
	});
});

describe('uplinkShortfall', () => {
	it('returns 0 when both tiers are null (webcam off or unsettled)', () => {
		expect(uplinkShortfall(null, null)).toBe(0);
	});

	it('returns 0 when maxHardwareTier is null', () => {
		expect(uplinkShortfall(null, 1)).toBe(0);
	});

	it('returns 0 when maxUplinkTier is null', () => {
		expect(uplinkShortfall(2, null)).toBe(0);
	});

	it('returns 0 when at the hardware ceiling (hw == up)', () => {
		expect(uplinkShortfall(2, 2)).toBe(0);
	});

	it('returns 0 when above the hardware ceiling (up > hw, clamped)', () => {
		expect(uplinkShortfall(1, 2)).toBe(0);
	});

	it('returns the positive shortfall when sending below the ceiling', () => {
		expect(uplinkShortfall(2, 0)).toBe(2);
		expect(uplinkShortfall(2, 1)).toBe(1);
	});
});

describe('tierPenalty', () => {
	it('returns 1.0 for shortfall 0 (no penalty)', () => {
		expect(tierPenalty(0)).toBe(1);
	});

	it('returns TIER_PENALTY_RATIO^1 for shortfall 1', () => {
		expect(tierPenalty(1)).toBeCloseTo(TIER_PENALTY_RATIO, 10);
	});

	it('returns TIER_PENALTY_RATIO^2 for shortfall 2', () => {
		expect(tierPenalty(2)).toBeCloseTo(TIER_PENALTY_RATIO ** 2, 10);
	});

	it('returns TIER_PENALTY_RATIO^4 for shortfall 4 (both up=2, down=2 combined)', () => {
		expect(tierPenalty(4)).toBeCloseTo(TIER_PENALTY_RATIO ** 4, 10);
	});
});

describe('absoluteScore', () => {
	it('returns null when relativeScore is null (LOST)', () => {
		expect(absoluteScore(null, 0, 0)).toBeNull();
	});

	it('returns relativeScore unchanged (rounded) when both shortfalls are 0', () => {
		expect(absoluteScore(10, 0, 0)).toBe(10);
		expect(absoluteScore(6.5, 0, 0)).toBe(6.5);
	});

	it('clamps to 0 for combined shortfall that would go negative (up=2, down=2 → 10-3-6=1)', () => {
		// clamp(10 - 1.5*2 - 3*2, 0, 10) = clamp(1, 0, 10) = 1
		expect(absoluteScore(10, 2, 2)).toBe(1);
	});

	it('applies only uplink penalty when downShortfall is 0', () => {
		// clamp(10 - 1.5*2 - 0, 0, 10) = 7.0
		expect(absoluteScore(10, 2, 0)).toBe(7);
	});

	it('applies only downlink penalty when upShortfall is 0', () => {
		// clamp(10 - 0 - 3*1, 0, 10) = 7.0
		expect(absoluteScore(10, 0, 1)).toBe(7);
	});

	it('rounds the result to 1 decimal', () => {
		// clamp(7 - 1.5*1 - 0, 0, 10) = 5.5
		expect(absoluteScore(7, 1, 0)).toBe(5.5);
	});
});
