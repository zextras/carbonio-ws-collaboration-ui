/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, it } from 'vitest';

import {
	activeAudioKbps,
	aggregateQuality,
	audioQualityFactor,
	calcDownlinkAudioVote,
	calcDownlinkScreenVote,
	calcDownlinkWebcamVote,
	calcUplinkAudioVote,
	calcUplinkScreenVote,
	calcUplinkWebcamVote,
	scoreToLevel
} from './connectionQualityScore';

describe('calcUplinkAudioVote', () => {
	it('returns 10 for no loss and no jitter', () => {
		expect(calcUplinkAudioVote({ fractionLost: 0, jitter: 0 })).toBe(10);
	});

	it('returns 5 at half the loss tolerance (0.25/0.50), jitter 0', () => {
		expect(calcUplinkAudioVote({ fractionLost: 0.25, jitter: 0 })).toBe(5);
	});

	it('returns 0 at full loss tolerance (0.50), jitter 0', () => {
		expect(calcUplinkAudioVote({ fractionLost: 0.5, jitter: 0 })).toBe(0);
	});

	it('jitter alone caps its impairment at 0.5 (half weight): full jitter, no loss -> 5', () => {
		// 0.5 * clamp01(0.1/0.1) = 0.5 -> vote 5
		expect(calcUplinkAudioVote({ fractionLost: 0, jitter: 0.1 })).toBe(5);
	});

	it('loss and jitter ADD (jitter half weight): 0.25 loss + full jitter -> 0.5 + 0.5 = 1 -> 0', () => {
		expect(calcUplinkAudioVote({ fractionLost: 0.25, jitter: 0.1 })).toBe(0);
	});
});

describe('activeAudioKbps (DTX-robust encoded bitrate from raw getStats fields)', () => {
	it('computes ~24 kbps from 60 payload-bytes/packet (20 ms Opus)', () => {
		// 60 B/pkt * 50 pkt/s * 8 / 1000 = 24 kbps
		expect(activeAudioKbps({ payloadBytesDelta: 6000, packetsDelta: 100 })).toBe(24);
	});

	it('computes ~12 kbps from 30 payload-bytes/packet', () => {
		expect(activeAudioKbps({ payloadBytesDelta: 3000, packetsDelta: 100 })).toBe(12);
	});

	it('computes low kbps for tiny frames (silence is gated upstream via audioLevel, not here)', () => {
		// 3 B/pkt -> 3*50*8/1000 = 1.2 kbps; the monitor simply does not call this while not speaking
		expect(activeAudioKbps({ payloadBytesDelta: 30, packetsDelta: 10 })).toBe(1.2);
	});

	it('returns undefined when there are no packets', () => {
		expect(activeAudioKbps({ payloadBytesDelta: 0, packetsDelta: 0 })).toBeUndefined();
	});
});

describe('audioQualityFactor (empirical Opus mono-voice fidelity curve, anchors 8/16 kbps)', () => {
	it('is 1.0 at/above the full-fidelity bitrate (16 kbps)', () => {
		expect(audioQualityFactor(16)).toBe(1);
		expect(audioQualityFactor(24)).toBe(1);
	});

	it('is 0.5 at the mid point (12 kbps)', () => {
		expect(audioQualityFactor(12)).toBe(0.5);
	});

	it('is 0 at/below the floor (8 kbps)', () => {
		expect(audioQualityFactor(8)).toBe(0);
		expect(audioQualityFactor(4)).toBe(0);
	});
});

describe('calcUplinkAudioVote — quality (bitrate) ceiling', () => {
	it('no activeKbps given -> no quality penalty (backward compatible)', () => {
		expect(calcUplinkAudioVote({ fractionLost: 0, jitter: 0 })).toBe(10);
	});

	it('a healthy WebRTC mono-voice bitrate (~22 kbps) scores 10 (no false "muffled")', () => {
		expect(calcUplinkAudioVote({ fractionLost: 0, jitter: 0, activeKbps: 22 })).toBe(10);
	});

	it('full-fidelity bitrate (16 kbps), no loss/jitter -> 10', () => {
		expect(calcUplinkAudioVote({ fractionLost: 0, jitter: 0, activeKbps: 16 })).toBe(10);
	});

	it('muffled (12 kbps), no loss/jitter -> 5 (quality ceiling halves it)', () => {
		expect(calcUplinkAudioVote({ fractionLost: 0, jitter: 0, activeKbps: 12 })).toBe(5);
	});

	it('quality is a CEILING: 12 kbps AND 0.25 loss -> 10*0.5*0.5 = 2.5', () => {
		expect(calcUplinkAudioVote({ fractionLost: 0.25, jitter: 0, activeKbps: 12 })).toBe(2.5);
	});

	it('stays in [0,10]: floor bitrate + full loss -> 0', () => {
		expect(calcUplinkAudioVote({ fractionLost: 1, jitter: 0, activeKbps: 8 })).toBe(0);
	});
});

describe('calcUplinkScreenVote', () => {
	it('returns 10 for no loss and no jitter', () => {
		expect(calcUplinkScreenVote({ fractionLost: 0, jitter: 0 })).toBe(10);
	});

	it('returns 5 at half the loss tolerance (0.075/0.15), jitter 0', () => {
		expect(calcUplinkScreenVote({ fractionLost: 0.075, jitter: 0 })).toBe(5);
	});

	it('jitter equal weight: half the jitter tolerance (0.1/0.2), no loss -> 5', () => {
		expect(calcUplinkScreenVote({ fractionLost: 0, jitter: 0.1 })).toBe(5);
	});

	it('loss and jitter ADD equally (same freeze effect): 0.075 loss + 0.1 jitter -> 0.5 + 0.5 = 1 -> 0', () => {
		expect(calcUplinkScreenVote({ fractionLost: 0.075, jitter: 0.1 })).toBe(0);
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

describe('calcDownlinkWebcamVote — framerate (temporal) penalty', () => {
	it('a framerate drop at the top tier lowers the vote by a small fixed amount (10 -> 8.5)', () => {
		expect(
			calcDownlinkWebcamVote([
				{ shownTierIdx: 2, senderMaxTierIdx: 2, inboundLossRate: 0, temporalReduced: true }
			])
		).toBe(8.5);
	});

	it('a framerate drop is penalized LESS than a resolution step (8.5 > 6.7)', () => {
		const framerateOnly = calcDownlinkWebcamVote([
			{ shownTierIdx: 2, senderMaxTierIdx: 2, inboundLossRate: 0, temporalReduced: true }
		]);
		const resolutionStep = calcDownlinkWebcamVote([
			{ shownTierIdx: 1, senderMaxTierIdx: 2, inboundLossRate: 0, temporalReduced: false }
		]);
		expect(framerateOnly).toBe(8.5);
		expect(resolutionStep).toBe(6.7);
		expect(framerateOnly).toBeGreaterThan(resolutionStep);
	});

	it('resolution AND framerate drop compound (medium tier at base fps -> 5.7)', () => {
		expect(
			calcDownlinkWebcamVote([
				{ shownTierIdx: 1, senderMaxTierIdx: 2, inboundLossRate: 0, temporalReduced: true }
			])
		).toBe(5.7);
	});

	it('temporalReduced false (or absent) applies no framerate penalty', () => {
		expect(
			calcDownlinkWebcamVote([
				{ shownTierIdx: 2, senderMaxTierIdx: 2, inboundLossRate: 0, temporalReduced: false }
			])
		).toBe(10);
	});

	it('stays in [0,10]: full loss WITH a framerate drop clamps to 0, never negative', () => {
		// the penalty is multiplicative (x0.85) and the loss term is clamped to [0,1], so the product
		// of non-negative factors can never go below 0 (nor above 10).
		expect(
			calcDownlinkWebcamVote([
				{ shownTierIdx: 0, senderMaxTierIdx: 2, inboundLossRate: 1, temporalReduced: true }
			])
		).toBe(0);
		expect(
			calcDownlinkWebcamVote([
				{ shownTierIdx: 2, senderMaxTierIdx: 2, inboundLossRate: 5, temporalReduced: true }
			])
		).toBe(0);
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
