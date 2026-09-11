/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, it } from 'vitest';

import {
	combineDownlinkScore,
	combineVote,
	curveScore,
	downlinkBufferDelayScore,
	downlinkVideoLossScore,
	isUnstableQuality,
	jitterScore,
	rttScore,
	scoreToBars,
	scoreToLevel,
	uplinkLossScore
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

	it('reaches 0 at/above LOSS_BAD_UP (22%)', () => {
		expect(uplinkLossScore(0.22)).toBe(0);
		expect(uplinkLossScore(0.5)).toBe(0);
	});

	it('is a convex knee between 2% and 22%', () => {
		// midpoint v=0.12: (0.22-0.12)/(0.22-0.02)=0.5 -> 10*0.25=2.5
		expect(uplinkLossScore(0.12)).toBeCloseTo(2.5, 5);
	});
});

describe('downlinkVideoLossScore', () => {
	it('is 10 when loss is unknown', () => {
		expect(downlinkVideoLossScore(undefined)).toBe(10);
	});

	it('is 10 at the 2% deadband edge', () => {
		expect(downlinkVideoLossScore(0.02)).toBe(10);
	});

	it('reaches 0 at/above DOWNLINK_LOSS_BAD (12%) — recalibrated aggressive', () => {
		expect(downlinkVideoLossScore(0.12)).toBe(0);
		expect(downlinkVideoLossScore(0.42)).toBe(0);
	});

	it('crosses below 5 (DOWN) at ~5% loss and is a convex knee 2%..12%', () => {
		// midpoint v=0.07: (0.12-0.07)/(0.12-0.02)=0.5 -> 10*0.25=2.5
		expect(downlinkVideoLossScore(0.07)).toBeCloseTo(2.5, 5);
		expect(downlinkVideoLossScore(0.05)).toBeLessThan(5);
	});
});

describe('downlinkBufferDelayScore', () => {
	it('is 10 when the delay is unknown or at/under the 60 ms good point', () => {
		expect(downlinkBufferDelayScore(undefined)).toBe(10);
		expect(downlinkBufferDelayScore(60)).toBe(10);
		expect(downlinkBufferDelayScore(30)).toBe(10);
	});

	it('reaches 0 at/above BUF_BAD (400 ms)', () => {
		expect(downlinkBufferDelayScore(400)).toBe(0);
		expect(downlinkBufferDelayScore(800)).toBe(0);
	});

	it('is a convex knee 60..400 ms (crosses below 5 around 160 ms)', () => {
		// midpoint v=230: (400-230)/(400-60)=0.5 -> 10*0.25=2.5
		expect(downlinkBufferDelayScore(230)).toBeCloseTo(2.5, 5);
		expect(downlinkBufferDelayScore(160)).toBeLessThan(5);
	});
});

describe('combineDownlinkScore (worst-aware over defined signals)', () => {
	it('is undefined when neither signal is measurable (loss-blind → HOLD)', () => {
		expect(combineDownlinkScore(undefined, undefined)).toBeUndefined();
	});

	it('uses the single defined signal when the other is undefined', () => {
		expect(combineDownlinkScore(3, undefined)).toBe(3);
		expect(combineDownlinkScore(undefined, 2)).toBe(2);
	});

	it('takes the worse (min) of the two when both are defined (lambda=1)', () => {
		expect(combineDownlinkScore(10, 0)).toBe(0); // pure delay bad, loss perfect -> DOWN
		expect(combineDownlinkScore(0, 10)).toBe(0); // pure loss bad, delay perfect -> DOWN
		expect(combineDownlinkScore(10, 9.5)).toBe(9.5); // both healthy -> stays high
	});
});

describe('combineVote', () => {
	it('returns 10 when all signals are perfect', () => {
		expect(combineVote(10, 10, 10)).toBe(10);
	});

	it('returns 0 when all signals are worst', () => {
		expect(combineVote(0, 0, 0)).toBe(0);
	});

	it('is worst-aware (lambda=0.5): one bad signal drags the result below the mean', () => {
		// combineVote(10,10,0): mean=20/3, min=0
		// score = 0.5*(20/3) + 0.5*0 = 10/3 = 3.333... -> round1 = 3.3
		expect(combineVote(10, 10, 0)).toBe(3.3);
	});

	it('rounds to 1 decimal', () => {
		// combineVote(10,5,8): mean=23/3=7.667, min=5
		// score = 0.5*7.667 + 0.5*5 = 3.833 + 2.5 = 6.333 -> round1 = 6.3
		expect(combineVote(10, 5, 8)).toBe(6.3);
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
