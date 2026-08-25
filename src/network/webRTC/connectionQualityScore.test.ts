/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, it } from 'vitest';

import {
	aggregateUplinkQuality,
	audioUplinkVote,
	lossVote,
	scoreToLevel,
	screenUplinkVote,
	webcamUplinkVote
} from './connectionQualityScore';

describe('scoreToLevel', () => {
	it('maps the five score bands correctly', () => {
		expect(scoreToLevel(0)).toBe('terrible');
		expect(scoreToLevel(1.9)).toBe('terrible');
		expect(scoreToLevel(2)).toBe('poor');
		expect(scoreToLevel(4.4)).toBe('poor');
		expect(scoreToLevel(4.5)).toBe('medium');
		expect(scoreToLevel(6.4)).toBe('medium');
		expect(scoreToLevel(6.5)).toBe('high');
		expect(scoreToLevel(8.4)).toBe('high');
		expect(scoreToLevel(8.5)).toBe('optimal');
		expect(scoreToLevel(10)).toBe('optimal');
	});
});

describe('lossVote', () => {
	it('returns 10 when loss is at or below ok', () => {
		expect(lossVote(0, 0.05, 0.35)).toBe(10);
		expect(lossVote(0.05, 0.05, 0.35)).toBe(10);
	});

	it('returns 0 when loss is at or above bad', () => {
		expect(lossVote(0.35, 0.05, 0.35)).toBe(0);
		expect(lossVote(0.5, 0.05, 0.35)).toBe(0);
	});

	it('is linear at the midpoint between ok and bad', () => {
		// (0.35 - 0.20) / (0.35 - 0.05) = 0.15/0.30 = 0.5 -> 5
		expect(lossVote(0.2, 0.05, 0.35)).toBeCloseTo(5, 5);
	});

	it('clamps to 10 when loss is below ok', () => {
		expect(lossVote(0, 0.05, 0.35)).toBe(10);
	});
});

describe('webcamUplinkVote', () => {
	it('returns 0 when topActiveRung is negative AND bandwidth-limited (network shed every rung)', () => {
		expect(
			webcamUplinkVote({
				topActiveRung: -1,
				producibleRungs: 3,
				bandwidthLimited: true,
				fractionLost: 0
			})
		).toBe(0);
	});

	it('returns 10 when topActiveRung is negative but NOT bandwidth-limited (CPU/weak hardware, not our fault)', () => {
		expect(
			webcamUplinkVote({
				topActiveRung: -1,
				producibleRungs: 3,
				bandwidthLimited: false,
				fractionLost: 0
			})
		).toBe(10);
	});

	it('returns tier ratio * 10 when bandwidth-limited (3 rungs)', () => {
		// top=2: (2+1)/3 = 1 -> 10
		expect(
			webcamUplinkVote({
				topActiveRung: 2,
				producibleRungs: 3,
				bandwidthLimited: true,
				fractionLost: 0
			})
		).toBeCloseTo(10, 5);
		// top=1: (1+1)/3 = 6.67
		expect(
			webcamUplinkVote({
				topActiveRung: 1,
				producibleRungs: 3,
				bandwidthLimited: true,
				fractionLost: 0
			})
		).toBeCloseTo(20 / 3, 5);
		// top=0: (0+1)/3 = 3.33
		expect(
			webcamUplinkVote({
				topActiveRung: 0,
				producibleRungs: 3,
				bandwidthLimited: true,
				fractionLost: 0
			})
		).toBeCloseTo(10 / 3, 5);
	});

	it('returns 10 when not bandwidth-limited even with low top rung', () => {
		expect(
			webcamUplinkVote({
				topActiveRung: 0,
				producibleRungs: 3,
				bandwidthLimited: false,
				fractionLost: 0
			})
		).toBe(10);
	});

	it('takes the min with lossVote when loss is severe', () => {
		// fractionLost=0.40 > LOSS_BAD=0.35 -> lossVote=0 dominates quality=10
		expect(
			webcamUplinkVote({
				topActiveRung: 2,
				producibleRungs: 3,
				bandwidthLimited: false,
				fractionLost: 0.4
			})
		).toBe(0);
	});

	it('loss axis can further degrade an already-low tier vote', () => {
		// quality=10/3≈3.33, lossVote(0.20,0.05,0.35)=5 -> min=3.33
		expect(
			webcamUplinkVote({
				topActiveRung: 0,
				producibleRungs: 3,
				bandwidthLimited: true,
				fractionLost: 0.2
			})
		).toBeCloseTo(10 / 3, 5);
	});
});

describe('screenUplinkVote', () => {
	it('scores fps ratio when bandwidth-limited', () => {
		// encodedFps=15/captureFps=30 -> quality=5
		expect(
			screenUplinkVote({ bandwidthLimited: true, captureFps: 30, encodedFps: 15, fractionLost: 0 })
		).toBeCloseTo(5, 5);
	});

	it('returns quality 10 when bandwidth-limited but captureFps is undefined', () => {
		expect(
			screenUplinkVote({
				bandwidthLimited: true,
				captureFps: undefined,
				encodedFps: 15,
				fractionLost: 0
			})
		).toBe(10);
	});

	it('returns 10 when not bandwidth-limited regardless of fps ratio', () => {
		expect(
			screenUplinkVote({ bandwidthLimited: false, captureFps: 30, encodedFps: 5, fractionLost: 0 })
		).toBe(10);
	});

	it('lossVote dominates when loss exceeds SCREEN_LOSS_BAD', () => {
		// fractionLost=0.15 > LOSS_BAD=0.13 -> lossVote=0
		expect(
			screenUplinkVote({
				bandwidthLimited: false,
				captureFps: 30,
				encodedFps: 30,
				fractionLost: 0.15
			})
		).toBe(0);
	});

	it('takes min of fps quality and loss midpoint', () => {
		// quality=10 (not limited), lossVote(0.08, 0.03, 0.13) = 10*(0.13-0.08)/0.10 = 5
		expect(
			screenUplinkVote({
				bandwidthLimited: false,
				captureFps: 30,
				encodedFps: 30,
				fractionLost: 0.08
			})
		).toBeCloseTo(5, 5);
	});
});

describe('audioUplinkVote', () => {
	it('returns 0 when speaking at the floor bitrate (6 kbps)', () => {
		expect(audioUplinkVote({ speaking: true, actualKbps: 6, fractionLost: 0 })).toBeCloseTo(0, 5);
	});

	it('returns 10 when speaking at the transparent ceiling (24 kbps)', () => {
		expect(audioUplinkVote({ speaking: true, actualKbps: 24, fractionLost: 0 })).toBeCloseTo(10, 5);
	});

	it('returns 5 at the geometric midpoint (12 kbps)', () => {
		// ln(12/6)/ln(24/6) = ln2/(2*ln2) = 0.5 -> quality 5
		expect(audioUplinkVote({ speaking: true, actualKbps: 12, fractionLost: 0 })).toBeCloseTo(5, 5);
	});

	it('returns quality 10 when not speaking regardless of bitrate', () => {
		expect(audioUplinkVote({ speaking: false, actualKbps: 6, fractionLost: 0 })).toBe(10);
	});

	it('returns 0 when actualKbps is zero or negative while speaking', () => {
		expect(audioUplinkVote({ speaking: true, actualKbps: 0, fractionLost: 0 })).toBe(0);
		expect(audioUplinkVote({ speaking: true, actualKbps: -1, fractionLost: 0 })).toBe(0);
	});

	it('collapses to 0 when loss exceeds AUDIO_LOSS_BAD', () => {
		// fractionLost=0.30 > LOSS_BAD=0.28 -> lossVote=0
		expect(audioUplinkVote({ speaking: true, actualKbps: 24, fractionLost: 0.3 })).toBe(0);
	});

	it('takes min of quality and loss at midpoint loss', () => {
		// lossVote(0.19, 0.10, 0.28) = 10*(0.28-0.19)/0.18 = 10*0.09/0.18 = 5
		expect(audioUplinkVote({ speaking: true, actualKbps: 24, fractionLost: 0.19 })).toBeCloseTo(
			5,
			5
		);
	});

	it('not-speaking quality=10 still clipped by severe loss', () => {
		expect(audioUplinkVote({ speaking: false, actualKbps: 0, fractionLost: 0.3 })).toBe(0);
	});
});

describe('aggregateUplinkQuality', () => {
	it('returns "lost" when ICE is not connected regardless of votes', () => {
		expect(aggregateUplinkQuality({ webcam: 10, audio: 10, screen: 10 }, false)).toBe('lost');
		expect(aggregateUplinkQuality({}, false)).toBe('lost');
	});

	it('returns "optimal" when votes object is empty (publishing nothing)', () => {
		expect(aggregateUplinkQuality({}, true)).toBe('optimal');
	});

	it('returns "optimal" when only webcam is active at full quality', () => {
		// wmean=10, min=10, score=10 -> optimal
		expect(aggregateUplinkQuality({ webcam: 10 }, true)).toBe('optimal');
	});

	it('undefined streams are OMITTED — not treated as 10 or 0', () => {
		// {webcam:10, audio:undefined} -> only webcam counted -> optimal
		expect(aggregateUplinkQuality({ webcam: 10, audio: undefined }, true)).toBe('optimal');
		// {audio:0, webcam:undefined} -> only audio counted -> terrible
		expect(aggregateUplinkQuality({ audio: 0, webcam: undefined }, true)).toBe('terrible');
	});

	it('a single collapsed audio stream produces "terrible"', () => {
		expect(aggregateUplinkQuality({ audio: 0 }, true)).toBe('terrible');
	});

	it('audio collapse drives the aggregate down even with perfect webcam and screen', () => {
		// weights: audio=2, webcam=0.5, screen=1.0; sum=3.5
		// wmean = (0*2 + 10*0.5 + 10*1.0) / 3.5 = 15/3.5 ≈ 4.286
		// min = 0; score = 0.6*4.286 + 0.4*0 ≈ 2.57 -> poor
		expect(aggregateUplinkQuality({ audio: 0, webcam: 10, screen: 10 }, true)).toBe('poor');
	});

	it('weighted mean gives audio (weight 2) dominance over webcam (weight 0.5)', () => {
		// audio=10 (w=2), webcam=0 (w=0.5): wmean=(10*2+0*0.5)/2.5=20/2.5=8; min=0
		// score=0.6*8+0.4*0=4.8 -> medium (4.5<=4.8<6.5)
		expect(aggregateUplinkQuality({ audio: 10, webcam: 0 }, true)).toBe('medium');
	});

	it('all streams at equal midrange score produces expected level', () => {
		// all=6: wmean=6, min=6, score=6 -> medium (6 < 6.5)
		expect(aggregateUplinkQuality({ webcam: 6, screen: 6, audio: 6 }, true)).toBe('medium');
	});

	it('min floor (BLEND_MIN=0.4) prevents "optimal" when one stream is mediocre', () => {
		// webcam=10, audio=4: wmean=(10*0.5+4*2)/2.5=(5+8)/2.5=5.2; min=4
		// score=0.6*5.2+0.4*4=3.12+1.6=4.72 -> medium
		expect(aggregateUplinkQuality({ webcam: 10, audio: 4 }, true)).toBe('medium');
	});
});
