/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, it } from 'vitest';

import {
	aggregateQuality,
	calcDownlinkAudioVote,
	calcDownlinkScreenVote,
	calcDownlinkWebcamVote,
	calcUplinkAudioVote,
	calcUplinkScreenVote,
	calcUplinkWebcamVote,
	scoreToLevel
} from './connectionQualityScore';

describe('calcUplinkAudioVote', () => {
	it('returns 10 for no loss (TOL_AUDIO=0.5)', () => {
		expect(calcUplinkAudioVote({ fractionLost: 0 })).toBe(10);
	});

	it('returns 5 at half the loss tolerance (0.25/0.50)', () => {
		// 1 - 0.25/0.5 = 0.5 -> 5
		expect(calcUplinkAudioVote({ fractionLost: 0.25 })).toBe(5);
	});

	it('returns 0 at full loss tolerance (0.50)', () => {
		expect(calcUplinkAudioVote({ fractionLost: 0.5 })).toBe(0);
	});

	it('uplink audio: returns 0 when loss exceeds tolerance (clamped at 1)', () => {
		expect(calcUplinkAudioVote({ fractionLost: 1 })).toBe(0);
	});
});

describe('calcUplinkScreenVote', () => {
	it('returns 10 for no loss (TOL_SCREEN=0.15)', () => {
		expect(calcUplinkScreenVote({ fractionLost: 0 })).toBe(10);
	});

	it('returns 5 at half the loss tolerance (0.075/0.15)', () => {
		expect(calcUplinkScreenVote({ fractionLost: 0.075 })).toBe(5);
	});

	it('returns 0 at full loss tolerance (0.15)', () => {
		expect(calcUplinkScreenVote({ fractionLost: 0.15 })).toBe(0);
	});

	it('uplink screen: returns 0 when loss exceeds tolerance (clamped at 1)', () => {
		expect(calcUplinkScreenVote({ fractionLost: 1 })).toBe(0);
	});
});

describe('calcUplinkWebcamVote', () => {
	// prodRungs=3 unless stated; bwLimitedFraction/cpuLimitedFraction default to 0

	it('returns 10 when at top rung with no BW limitation and no loss', () => {
		// ratio=1 → not scaled down → tierVote=10; lossFactor=0
		expect(
			calcUplinkWebcamVote({
				topActiveRung: 2,
				producibleRungs: 3,
				bwLimitedFraction: 0,
				lossRate: 0
			})
		).toBe(10);
	});

	it('returns 8.3 when at top rung but 5% loss (TOL_WEBCAM=0.3)', () => {
		// ceiling=10; round1(10*(1-0.05/0.3))=round1(10*0.833)=8.3
		expect(
			calcUplinkWebcamVote({
				topActiveRung: 2,
				producibleRungs: 3,
				bwLimitedFraction: 0,
				lossRate: 0.05
			})
		).toBe(8.3);
	});

	it('returns 6.7 when BW-limited to rung 1 of 3 with no loss', () => {
		// ratio=2/3, bwLimitedFraction=1 > cpuLimitedFraction=0 → tierVote=6.7; lossFactor=0
		expect(
			calcUplinkWebcamVote({
				topActiveRung: 1,
				producibleRungs: 3,
				bwLimitedFraction: 1,
				cpuLimitedFraction: 0,
				lossRate: 0
			})
		).toBe(6.7);
	});

	it('returns 4.4 when BW-limited to rung 1 of 3 with 10% loss (TOL_WEBCAM=0.3)', () => {
		// ceiling=(2/3)*10=6.67; round1(6.67*(1-0.1/0.3))=round1(6.67*0.667)=round1(4.44)=4.4
		expect(
			calcUplinkWebcamVote({
				topActiveRung: 1,
				producibleRungs: 3,
				bwLimitedFraction: 1,
				lossRate: 0.1
			})
		).toBe(4.4);
	});

	it('returns 3.3 when BW-limited to rung 0 of 3 with no loss', () => {
		expect(
			calcUplinkWebcamVote({
				topActiveRung: 0,
				producibleRungs: 3,
				bwLimitedFraction: 1,
				lossRate: 0
			})
		).toBe(3.3);
	});

	it('returns 0 when BW-limited to rung 0 and full loss', () => {
		expect(
			calcUplinkWebcamVote({
				topActiveRung: 0,
				producibleRungs: 3,
				bwLimitedFraction: 1,
				lossRate: 1
			})
		).toBe(0);
	});

	it('returns 10 when CPU-dominant scale-down (CPU excluded — not a network fact)', () => {
		// cpuLimitedFraction > bwLimitedFraction → byCpu=true → tierVote=10
		expect(
			calcUplinkWebcamVote({
				topActiveRung: 1,
				producibleRungs: 3,
				bwLimitedFraction: 0,
				cpuLimitedFraction: 1,
				lossRate: 0
			})
		).toBe(10);
	});

	it('returns 10 for a 360p camera at its top rung (small-camera sending its best)', () => {
		// ratio=1 → not scaled down → tierVote=10
		expect(
			calcUplinkWebcamVote({
				topActiveRung: 1,
				producibleRungs: 2,
				bwLimitedFraction: 0,
				lossRate: 0
			})
		).toBe(10);
	});

	it('returns 5.0 when BW-limited to rung 0 of 2', () => {
		expect(
			calcUplinkWebcamVote({
				topActiveRung: 0,
				producibleRungs: 2,
				bwLimitedFraction: 1,
				lossRate: 0
			})
		).toBe(5);
	});

	it('returns 0 when sending nothing (topActiveRung -1)', () => {
		expect(
			calcUplinkWebcamVote({
				topActiveRung: -1,
				producibleRungs: 3,
				bwLimitedFraction: 0,
				lossRate: 0
			})
		).toBe(0);
	});

	it('returns 10 when producibleRungs is 0 (capture capabilities unknown)', () => {
		expect(
			calcUplinkWebcamVote({
				topActiveRung: 0,
				producibleRungs: 0,
				bwLimitedFraction: 1,
				lossRate: 0
			})
		).toBe(10);
	});
});

describe('calcDownlinkWebcamVote', () => {
	it('returns 10 when sender offers top tier and we show top tier, no loss', () => {
		// ceiling=min(1,3/3)*10=10; loss=0 -> 10
		expect(
			calcDownlinkWebcamVote([{ shownTierIdx: 2, senderMaxTierIdx: 2, inboundLossRate: 0 }])
		).toBe(10);
	});

	it('returns 6.7 when showing medium of three offered tiers, no loss', () => {
		// ceiling=min(1,2/3)*10=6.7; loss=0 -> 6.7
		expect(
			calcDownlinkWebcamVote([{ shownTierIdx: 1, senderMaxTierIdx: 2, inboundLossRate: 0 }])
		).toBe(6.7);
	});

	it('returns 10 when sender only offers medium and we show medium (not penalized)', () => {
		// ceiling=min(1,2/2)*10=10; sender never offered higher -> no penalty
		expect(
			calcDownlinkWebcamVote([{ shownTierIdx: 1, senderMaxTierIdx: 1, inboundLossRate: 0 }])
		).toBe(10);
	});

	it('returns 3.3 when showing low of three offered tiers, no loss', () => {
		// ceiling=min(1,1/3)*10=3.3; loss=0 -> 3.3
		expect(
			calcDownlinkWebcamVote([{ shownTierIdx: 0, senderMaxTierIdx: 2, inboundLossRate: 0 }])
		).toBe(3.3);
	});

	it('returns 10 when senderMaxTierIdx is -1 (unknown sender, no penalty)', () => {
		expect(
			calcDownlinkWebcamVote([{ shownTierIdx: 1, senderMaxTierIdx: -1, inboundLossRate: 0 }])
		).toBe(10);
	});

	it('returns 5 when showing top of top and 15% inbound loss (half TOL_WEBCAM=0.3)', () => {
		// ceiling=10; 10*(1-0.15/0.3)=10*0.5=5
		expect(
			calcDownlinkWebcamVote([{ shownTierIdx: 2, senderMaxTierIdx: 2, inboundLossRate: 0.15 }])
		).toBe(5);
	});

	it('averages feed votes across multiple feeds', () => {
		// feed1: ceiling=10, loss=0 -> 10; feed2: ceiling=min(1,1/3)*10=3.3, loss=0 -> 3.3
		// avg(10, 3.33) = 6.67 -> round1 = 6.7
		expect(
			calcDownlinkWebcamVote([
				{ shownTierIdx: 2, senderMaxTierIdx: 2, inboundLossRate: 0 },
				{ shownTierIdx: 0, senderMaxTierIdx: 2, inboundLossRate: 0 }
			])
		).toBe(6.7);
	});

	it('returns 10 for an empty feed list (nothing flowing)', () => {
		expect(calcDownlinkWebcamVote([])).toBe(10);
	});
});

describe('calcDownlinkAudioVote', () => {
	it('returns 10 for zero loss (TOL_AUDIO=0.5)', () => {
		expect(calcDownlinkAudioVote({ lossRate: 0 })).toBe(10);
	});

	it('returns 5 at half the loss tolerance (0.25/0.50)', () => {
		// 1 - 0.25/0.5 = 0.5 -> 5
		expect(calcDownlinkAudioVote({ lossRate: 0.25 })).toBe(5);
	});

	it('returns 0 at full loss tolerance (0.50)', () => {
		expect(calcDownlinkAudioVote({ lossRate: 0.5 })).toBe(0);
	});

	it('downlink audio: returns 0 when loss exceeds tolerance (clamped at 1)', () => {
		expect(calcDownlinkAudioVote({ lossRate: 1 })).toBe(0);
	});
});

describe('calcDownlinkScreenVote', () => {
	it('returns 10 for zero loss (TOL_SCREEN=0.15)', () => {
		expect(calcDownlinkScreenVote({ lossRate: 0 })).toBe(10);
	});

	it('returns 5 at half the loss tolerance (0.075/0.15)', () => {
		expect(calcDownlinkScreenVote({ lossRate: 0.075 })).toBe(5);
	});

	it('returns 0 at full loss tolerance (0.15)', () => {
		expect(calcDownlinkScreenVote({ lossRate: 0.15 })).toBe(0);
	});

	it('downlink screen: returns 0 when loss exceeds tolerance (clamped at 1)', () => {
		expect(calcDownlinkScreenVote({ lossRate: 1 })).toBe(0);
	});
});

describe('scoreToLevel', () => {
	it('maps 1.9 to terrible', () => {
		expect(scoreToLevel(1.9)).toBe('terrible');
	});

	it('maps 3 to poor', () => {
		expect(scoreToLevel(3)).toBe('poor');
	});

	it('maps 5 to medium', () => {
		expect(scoreToLevel(5)).toBe('medium');
	});

	it('maps 7 to high', () => {
		expect(scoreToLevel(7)).toBe('high');
	});

	it('maps 9 to optimal', () => {
		expect(scoreToLevel(9)).toBe('optimal');
	});
});

describe('aggregateQuality', () => {
	it('returns lost when ICE is not connected', () => {
		expect(aggregateQuality({ downlinkAudio: 8 }, false)).toBe('lost');
	});

	it('returns optimal when no direction is active but ICE is connected', () => {
		expect(aggregateQuality({}, true)).toBe('optimal');
	});

	it('returns medium for a single uplink-audio vote of 5', () => {
		expect(aggregateQuality({ uplinkAudio: 5 }, true)).toBe('medium');
	});

	it('worst-aware blend: a single bad audio vote pulls the level down, not diluted to high', () => {
		// mean(2,10,10)=7.33, min=2 -> 0.6*7.33 + 0.4*2 = 5.2 -> medium
		expect(aggregateQuality({ uplinkAudio: 2, downlinkWebcam: 10, uplinkWebcam: 10 }, true)).toBe(
			'medium'
		);
	});

	it('returns optimal when all six votes are 10', () => {
		expect(
			aggregateQuality(
				{
					uplinkWebcam: 10,
					downlinkWebcam: 10,
					uplinkAudio: 10,
					downlinkAudio: 10,
					uplinkScreen: 10,
					downlinkScreen: 10
				},
				true
			)
		).toBe('optimal');
	});
});
