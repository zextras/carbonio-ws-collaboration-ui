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
	it('returns 10 for no loss and RTT at threshold', () => {
		expect(calcUplinkAudioVote({ lossRate: 0, rttMs: 300 })).toBe(10);
	});

	it('returns 5.0 at half the loss threshold (0.15/0.30)', () => {
		expect(calcUplinkAudioVote({ lossRate: 0.15, rttMs: 300 })).toBe(5);
	});

	it('returns 0 at full loss threshold (0.30)', () => {
		expect(calcUplinkAudioVote({ lossRate: 0.3 })).toBe(0);
	});

	it('returns 5.0 when RTT is halfway through the bad range (650 ms)', () => {
		expect(calcUplinkAudioVote({ lossRate: 0, rttMs: 650 })).toBe(5);
	});

	it('returns 8.0 for 6% loss with RTT at threshold', () => {
		expect(calcUplinkAudioVote({ lossRate: 0.06, rttMs: 300 })).toBe(8);
	});
});

describe('calcUplinkScreenVote', () => {
	it('returns 10 for no loss', () => {
		expect(calcUplinkScreenVote({ lossRate: 0 })).toBe(10);
	});

	it('returns 5.0 at half the threshold (0.075)', () => {
		expect(calcUplinkScreenVote({ lossRate: 0.075 })).toBe(5);
	});

	it('returns 0 at full loss threshold (0.15)', () => {
		expect(calcUplinkScreenVote({ lossRate: 0.15 })).toBe(0);
	});

	it('uses bwFpsImpairment when it is the dominant signal', () => {
		// max(loss=0.5, bwFps=0.8) -> 0.8 -> score = round1((1-0.8)*10) = 2.0
		expect(calcUplinkScreenVote({ lossRate: 0.075, bwFpsImpairment: 0.8 })).toBe(2);
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

	it('returns 9.5 when at top rung but 5% loss', () => {
		// tierVote=10; round1(10*(1-0.05))=9.5
		expect(
			calcUplinkWebcamVote({
				topActiveRung: 2,
				producibleRungs: 3,
				bwLimitedFraction: 0,
				lossRate: 0.05
			})
		).toBe(9.5);
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

	it('returns 6.0 when BW-limited to rung 1 of 3 with 10% loss', () => {
		// tierVote=6.7; round1(6.7*(1-0.10)) = round1(6.0) = 6.0
		expect(
			calcUplinkWebcamVote({
				topActiveRung: 1,
				producibleRungs: 3,
				bwLimitedFraction: 1,
				lossRate: 0.1
			})
		).toBe(6);
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
	it('returns 10 for a single feed at top requested rung with no loss and no freeze', () => {
		expect(
			calcDownlinkWebcamVote([{ requestedRung: 2, inboundLossRate: 0, freezeFraction: 0 }])
		).toBe(10);
	});

	it('returns 6.7 for a single feed at middle rung with no degradation', () => {
		// tierVote=(2/3)*10=6.7; lossFactor=0
		expect(
			calcDownlinkWebcamVote([{ requestedRung: 1, inboundLossRate: 0, freezeFraction: 0 }])
		).toBe(6.7);
	});

	it('returns 3.3 for a single feed at bottom rung with no degradation', () => {
		// tierVote=(1/3)*10=3.3; lossFactor=0
		expect(
			calcDownlinkWebcamVote([{ requestedRung: 0, inboundLossRate: 0, freezeFraction: 0 }])
		).toBe(3.3);
	});

	it('returns 9.2 when top rung but 8% inbound loss (loss compounds on the tier)', () => {
		// tierVote=10; lossFactor=0.08; round1(10*0.92)=9.2
		expect(
			calcDownlinkWebcamVote([{ requestedRung: 2, inboundLossRate: 0.08, freezeFraction: 0 }])
		).toBe(9.2);
	});

	it('returns 5.0 when top rung but 50% freeze fraction', () => {
		// tierVote=10; lossFactor=max(0,0.5)=0.5; round1(10*0.5)=5.0
		expect(
			calcDownlinkWebcamVote([{ requestedRung: 2, inboundLossRate: 0, freezeFraction: 0.5 }])
		).toBe(5);
	});

	it('averages feed votes: top-rung perfect feed + bottom-rung degraded feed', () => {
		// feed1: tierVote=10, lossFactor=0 → 10; feed2: tierVote=3.3, lossFactor=0 → 3.3
		// avg(10, 3.33) = 6.67 → round1 = 6.7
		expect(
			calcDownlinkWebcamVote([
				{ requestedRung: 2, inboundLossRate: 0, freezeFraction: 0 },
				{ requestedRung: 0, inboundLossRate: 0, freezeFraction: 0 }
			])
		).toBe(6.7);
	});

	it('returns 10 for an empty feed list (nothing flowing)', () => {
		expect(calcDownlinkWebcamVote([])).toBe(10);
	});
});

describe('calcDownlinkAudioVote', () => {
	it('returns 10 for zero concealment at the JB_OK threshold', () => {
		expect(calcDownlinkAudioVote({ concealmentRatio: 0, jbDelayPerFrameSec: 0.1 })).toBe(10);
	});

	it('returns 5.0 at half the concealment unusable threshold (0.10/0.20)', () => {
		expect(calcDownlinkAudioVote({ concealmentRatio: 0.1 })).toBe(5);
	});

	it('returns 0 at the full concealment unusable threshold (0.20)', () => {
		expect(calcDownlinkAudioVote({ concealmentRatio: 0.2 })).toBe(0);
	});

	it('returns 5.0 when jbDelayPerFrameSec is halfway through the bad range (0.30 s)', () => {
		// (0.30 - 0.10) / (0.50 - 0.10) = 0.5 -> score(0.5) = 5.0
		expect(calcDownlinkAudioVote({ concealmentRatio: 0, jbDelayPerFrameSec: 0.3 })).toBe(5);
	});
});

describe('calcDownlinkScreenVote', () => {
	it('returns 10 for perfect conditions', () => {
		expect(calcDownlinkScreenVote({ freezeFraction: 0, qp: 50, lossRate: 0 })).toBe(10);
	});

	it('returns 5.0 when freeze fraction is half the unusable threshold (0.10/0.20)', () => {
		expect(calcDownlinkScreenVote({ freezeFraction: 0.1 })).toBe(5);
	});

	it('returns 5.0 when QP is halfway through the bad range (75)', () => {
		// (75 - 50) / (100 - 50) = 0.5 -> score(0.5) = 5.0
		expect(calcDownlinkScreenVote({ qp: 75 })).toBe(5);
	});

	it('returns 5.0 when loss is half the LOSS_VIDEO threshold (0.075)', () => {
		expect(calcDownlinkScreenVote({ lossRate: 0.075 })).toBe(5);
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

	it('plain mean: a single bad audio vote is diluted but still maps high (no worst-aware min)', () => {
		// mean(2, 10, 10) = 7.33 -> high
		expect(aggregateQuality({ uplinkAudio: 2, downlinkWebcam: 10, uplinkWebcam: 10 }, true)).toBe(
			'high'
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
