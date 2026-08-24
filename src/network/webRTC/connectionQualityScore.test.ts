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
	delayFactor,
	scoreToLevel
} from './connectionQualityScore';

describe('activeAudioKbps (DTX-robust encoded bitrate from raw getStats fields)', () => {
	it('computes ~24 kbps from 60 payload-bytes/packet (20 ms Opus)', () => {
		// 60 B/pkt * 50 pkt/s * 8 / 1000 = 24 kbps
		expect(activeAudioKbps({ payloadBytesDelta: 6000, packetsDelta: 100 })).toBe(24);
	});

	it('computes ~12 kbps from 30 payload-bytes/packet', () => {
		expect(activeAudioKbps({ payloadBytesDelta: 3000, packetsDelta: 100 })).toBe(12);
	});

	it('returns undefined when there are no packets', () => {
		expect(activeAudioKbps({ payloadBytesDelta: 0, packetsDelta: 0 })).toBeUndefined();
	});
});

describe('delayFactor — convex RTT knee, weighted per medium (200 ms good, 700 ms bad)', () => {
	it('is 1 (no penalty) when RTT is unknown', () => {
		expect(delayFactor(undefined, 1)).toBe(1);
	});

	it('is 1 at/below the good threshold (200 ms) for any weight', () => {
		expect(delayFactor(200, 1)).toBe(1);
		expect(delayFactor(100, 0.6)).toBe(1);
	});

	it('bottoms out at (1 - weight) at/above the bad threshold (700 ms)', () => {
		expect(delayFactor(700, 1)).toBe(0);
		expect(delayFactor(700, 0.6)).toBeCloseTo(0.4, 10);
		expect(delayFactor(700, 0.3)).toBeCloseTo(0.7, 10);
		expect(delayFactor(900, 0.15)).toBeCloseTo(0.85, 10);
	});

	it('follows a convex knee in between (x squared)', () => {
		// x=(700-450)/500=0.5, x^2=0.25 -> 1 - 1*(1-0.25) = 0.25
		expect(delayFactor(450, 1)).toBeCloseTo(0.25, 10);
		// x=(700-300)/500=0.8, x^2=0.64 -> 1 - 0.6*(1-0.64) = 0.784
		expect(delayFactor(300, 0.6)).toBeCloseTo(0.784, 10);
	});
});

describe('audioQualityFactor (concave log Opus mono-voice curve, 6 floor / 24 transparent)', () => {
	it('is 1.0 at/above the transparent bitrate (24 kbps)', () => {
		expect(audioQualityFactor(24)).toBe(1);
		expect(audioQualityFactor(48)).toBe(1);
	});

	it('is 0.5 at the log-midpoint (12 kbps)', () => {
		expect(audioQualityFactor(12)).toBeCloseTo(0.5, 10);
	});

	it('is 0 at/below the floor (6 kbps)', () => {
		expect(audioQualityFactor(6)).toBe(0);
		expect(audioQualityFactor(3)).toBe(0);
	});
});

describe('calcUplinkAudioVote — fidelity (BWE-armed) x uplink delay', () => {
	it('no activeKbps given -> ceiling (silence never reads as muffled)', () => {
		expect(calcUplinkAudioVote({})).toBe(10);
	});

	it('low bitrate but NOT network-constrained -> ceiling (VBR on easy speech is trusted)', () => {
		expect(calcUplinkAudioVote({ activeKbps: 10, networkConstrained: false })).toBe(10);
	});

	it('network-constrained: healthy bitrate (22 kbps) still near full', () => {
		// log(22/6)/log(4) = 0.9372 -> 9.4
		expect(calcUplinkAudioVote({ activeKbps: 22, networkConstrained: true })).toBe(9.4);
	});

	it('network-constrained: muffled (12 kbps) -> 5', () => {
		expect(calcUplinkAudioVote({ activeKbps: 12, networkConstrained: true })).toBe(5);
	});

	it('network-constrained: at the floor (6 kbps) -> 0', () => {
		expect(calcUplinkAudioVote({ activeKbps: 6, networkConstrained: true })).toBe(0);
	});

	it('applies the uplink delay factor (weight 0.6) on top of fidelity', () => {
		// fidelity(12)=0.5 -> 5, delay(700,0.6)=0.4 -> 2.0
		expect(calcUplinkAudioVote({ activeKbps: 12, networkConstrained: true, rttMs: 700 })).toBe(2);
	});
});

describe('calcDownlinkAudioVote — exponential loss x conversational delay (weight 1.0)', () => {
	it('returns 10 for zero loss and good/unknown RTT', () => {
		expect(calcDownlinkAudioVote({ lossRate: 0 })).toBe(10);
	});

	it('10% loss -> ~5.5 (front-loaded exponential, not linear)', () => {
		expect(calcDownlinkAudioVote({ lossRate: 0.1 })).toBe(5.5);
	});

	it('20% loss -> ~3.0 (below the linear model that read it 6.4)', () => {
		expect(calcDownlinkAudioVote({ lossRate: 0.2 })).toBe(3);
	});

	it('50% loss -> ~0.5 (near unusable)', () => {
		expect(calcDownlinkAudioVote({ lossRate: 0.5 })).toBe(0.5);
	});

	it('full conversational delay scales the whole curve down (20% loss @ 450 ms)', () => {
		// exp(-6*0.2)=0.3012 -> 3.01, delay(450,1)=0.25 -> 0.75 -> 0.8
		expect(calcDownlinkAudioVote({ lossRate: 0.2, rttMs: 450 })).toBe(0.8);
	});
});

describe('calcUplinkScreenVote — exponential loss x small screen delay (weight 0.15)', () => {
	it('returns 10 for no loss', () => {
		expect(calcUplinkScreenVote({ lossRate: 0 })).toBe(10);
	});

	it('2% loss -> ~3.7 (steep front-loaded decay)', () => {
		expect(calcUplinkScreenVote({ lossRate: 0.02 })).toBe(3.7);
	});

	it('5% loss -> ~0.8 (effectively unusable, matching the industry threshold)', () => {
		expect(calcUplinkScreenVote({ lossRate: 0.05 })).toBe(0.8);
	});

	it('applies the small screen delay factor', () => {
		// exp(-0.05/0.02)=0.0821 -> 0.821, delay(700,0.15)=0.85 -> 0.698 -> 0.7
		expect(calcUplinkScreenVote({ lossRate: 0.05, rttMs: 700 })).toBe(0.7);
	});
});

describe('calcDownlinkScreenVote — freeze ratio (post-recovery) x small screen delay', () => {
	it('returns 10 for no freeze (static content stays perfect)', () => {
		expect(calcDownlinkScreenVote({ freezeRatio: 0 })).toBe(10);
	});

	it('15% of the window frozen -> ~3.7', () => {
		expect(calcDownlinkScreenVote({ freezeRatio: 0.15 })).toBe(3.7);
	});

	it('30% frozen -> ~1.4', () => {
		expect(calcDownlinkScreenVote({ freezeRatio: 0.3 })).toBe(1.4);
	});

	it('applies the small screen delay factor on top of freeze', () => {
		// exp(-0.15/0.15)=0.3679 -> 3.679, delay(700,0.15)=0.85 -> 3.127 -> 3.1
		expect(calcDownlinkScreenVote({ freezeRatio: 0.15, rttMs: 700 })).toBe(3.1);
	});
});

describe('calcUplinkWebcamVote — tier ratio x mild webcam delay (weight 0.3)', () => {
	it('returns 10 at top rung, no BW limitation, good/unknown RTT', () => {
		expect(
			calcUplinkWebcamVote({ topActiveRung: 2, producibleRungs: 3, bwLimitedFraction: 0 })
		).toBe(10);
	});

	it('returns 6.7 when BW-limited to rung 1 of 3', () => {
		expect(
			calcUplinkWebcamVote({
				topActiveRung: 1,
				producibleRungs: 3,
				bwLimitedFraction: 1,
				cpuLimitedFraction: 0
			})
		).toBe(6.7);
	});

	it('returns 10 when CPU-dominant scale-down (CPU excluded — not a network fact)', () => {
		expect(
			calcUplinkWebcamVote({
				topActiveRung: 1,
				producibleRungs: 3,
				bwLimitedFraction: 0,
				cpuLimitedFraction: 1
			})
		).toBe(10);
	});

	it('returns 0 when sending nothing (topActiveRung -1)', () => {
		expect(
			calcUplinkWebcamVote({ topActiveRung: -1, producibleRungs: 3, bwLimitedFraction: 0 })
		).toBe(0);
	});

	it('returns 10 when producibleRungs is 0 (capture capabilities unknown)', () => {
		expect(
			calcUplinkWebcamVote({ topActiveRung: 0, producibleRungs: 0, bwLimitedFraction: 1 })
		).toBe(10);
	});

	it('applies the mild delay factor', () => {
		// tier 6.667 (rung1/3) * delay(700,0.3)=0.7 -> 4.667 -> 4.7
		expect(
			calcUplinkWebcamVote({
				topActiveRung: 1,
				producibleRungs: 3,
				bwLimitedFraction: 1,
				rttMs: 700
			})
		).toBe(4.7);
	});
});

describe('calcDownlinkWebcamVote — tier x framerate x mild webcam delay', () => {
	it('returns 10 when sender offers top tier and we show top tier', () => {
		expect(calcDownlinkWebcamVote([{ shownTierIdx: 2, senderMaxTierIdx: 2 }])).toBe(10);
	});

	it('returns 6.7 when showing medium of three offered tiers', () => {
		expect(calcDownlinkWebcamVote([{ shownTierIdx: 1, senderMaxTierIdx: 2 }])).toBe(6.7);
	});

	it('returns 10 when senderMaxTierIdx is -1 (unknown sender, no penalty)', () => {
		expect(calcDownlinkWebcamVote([{ shownTierIdx: 1, senderMaxTierIdx: -1 }])).toBe(10);
	});

	it('a framerate drop at the top tier lowers the vote by a small fixed amount (10 -> 8.5)', () => {
		expect(
			calcDownlinkWebcamVote([{ shownTierIdx: 2, senderMaxTierIdx: 2, temporalReduced: true }])
		).toBe(8.5);
	});

	it('averages feed votes across multiple feeds', () => {
		expect(
			calcDownlinkWebcamVote([
				{ shownTierIdx: 2, senderMaxTierIdx: 2 },
				{ shownTierIdx: 0, senderMaxTierIdx: 2 }
			])
		).toBe(6.7);
	});

	it('returns 10 for an empty feed list (nothing flowing)', () => {
		expect(calcDownlinkWebcamVote([])).toBe(10);
	});

	it('applies the mild delay factor to the averaged tier vote', () => {
		// top tier 10 * delay(700,0.3)=0.7 -> 7.0
		expect(calcDownlinkWebcamVote([{ shownTierIdx: 2, senderMaxTierIdx: 2 }], 700)).toBe(7);
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

describe('aggregateQuality — worst-aware weighted blend (audio x2), no RTT vote', () => {
	it('returns lost when ICE is not connected', () => {
		expect(aggregateQuality({ downlinkAudio: 8 }, false)).toBe('lost');
	});

	it('returns optimal when no direction is active but ICE is connected', () => {
		expect(aggregateQuality({}, true)).toBe('optimal');
	});

	it('returns medium for a single uplink-audio vote of 5', () => {
		expect(aggregateQuality({ uplinkAudio: 5 }, true)).toBe('medium');
	});

	it('a bad AUDIO vote pulls harder than a bad video vote (audio weight 2)', () => {
		// audio 2 (w2), webcam 10 (w1), webcam 10 (w1): mean=(4+10+10)/4=6.0, min=2
		// 0.6*6 + 0.4*2 = 4.4 -> poor
		expect(aggregateQuality({ uplinkAudio: 2, downlinkWebcam: 10, uplinkWebcam: 10 }, true)).toBe(
			'poor'
		);
	});

	it('a single bad video vote still pulls the level down to medium', () => {
		// screen 2 (w1), audio 10 (w2), audio 10 (w2): mean=(2+20+20)/5=8.4, min=2
		// 0.6*8.4 + 0.4*2 = 5.84 -> medium
		expect(aggregateQuality({ downlinkScreen: 2, downlinkAudio: 10, uplinkAudio: 10 }, true)).toBe(
			'medium'
		);
	});

	it('returns optimal when all six stream votes are 10', () => {
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
