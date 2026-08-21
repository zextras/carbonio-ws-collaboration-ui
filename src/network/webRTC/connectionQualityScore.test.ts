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
	calcRttVote,
	calcUplinkAudioVote,
	calcUplinkScreenVote,
	calcUplinkWebcamVote,
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

describe('calcUplinkAudioVote — bitrate fidelity only (loss/jitter dropped)', () => {
	it('no activeKbps given -> ceiling 1 -> 10 (silence never reads as muffled)', () => {
		expect(calcUplinkAudioVote({})).toBe(10);
	});

	it('a healthy WebRTC mono-voice bitrate (~22 kbps) scores 10 (no false "muffled")', () => {
		expect(calcUplinkAudioVote({ activeKbps: 22 })).toBe(10);
	});

	it('full-fidelity bitrate (16 kbps) -> 10', () => {
		expect(calcUplinkAudioVote({ activeKbps: 16 })).toBe(10);
	});

	it('muffled (12 kbps) -> 5', () => {
		expect(calcUplinkAudioVote({ activeKbps: 12 })).toBe(5);
	});

	it('at the floor bitrate (8 kbps) -> 0', () => {
		expect(calcUplinkAudioVote({ activeKbps: 8 })).toBe(0);
	});
});

describe('calcUplinkScreenVote — loss only (TOL_SCREEN=0.2, video freezes early)', () => {
	it('returns 10 for no loss', () => {
		expect(calcUplinkScreenVote({ lossRate: 0 })).toBe(10);
	});

	it('returns 5 at half the loss tolerance (0.1/0.2)', () => {
		expect(calcUplinkScreenVote({ lossRate: 0.1 })).toBe(5);
	});

	it('returns 0 at the loss tolerance (0.2)', () => {
		expect(calcUplinkScreenVote({ lossRate: 0.2 })).toBe(0);
	});

	it('returns 0 when loss exceeds the tolerance (clamped)', () => {
		expect(calcUplinkScreenVote({ lossRate: 0.5 })).toBe(0);
	});
});

describe('calcDownlinkScreenVote — loss only (TOL_SCREEN=0.2)', () => {
	it('returns 10 for zero loss', () => {
		expect(calcDownlinkScreenVote({ lossRate: 0 })).toBe(10);
	});

	it('returns 5 at half the loss tolerance (0.1/0.2)', () => {
		expect(calcDownlinkScreenVote({ lossRate: 0.1 })).toBe(5);
	});

	it('returns 0 at/above the loss tolerance (0.2)', () => {
		expect(calcDownlinkScreenVote({ lossRate: 0.2 })).toBe(0);
		expect(calcDownlinkScreenVote({ lossRate: 1 })).toBe(0);
	});
});

describe('calcDownlinkAudioVote — loss only (TOL_AUDIO=0.55, audio+PLC rides out more loss)', () => {
	it('returns 10 for zero loss', () => {
		expect(calcDownlinkAudioVote({ lossRate: 0 })).toBe(10);
	});

	it('returns 5 at half the loss tolerance (0.275/0.55)', () => {
		expect(calcDownlinkAudioVote({ lossRate: 0.275 })).toBe(5);
	});

	it('50% loss is near the floor but not quite 0 (~1)', () => {
		// 10*(1-0.5/0.55) = 0.909 -> round1 = 0.9
		expect(calcDownlinkAudioVote({ lossRate: 0.5 })).toBe(0.9);
	});

	it('returns 0 at/above the loss tolerance (0.55)', () => {
		expect(calcDownlinkAudioVote({ lossRate: 0.55 })).toBe(0);
		expect(calcDownlinkAudioVote({ lossRate: 1 })).toBe(0);
	});
});

describe('screen is harsher than audio at equal loss (video is more loss-fragile)', () => {
	it('at 20% loss screen is 0 while audio is still usable (>0)', () => {
		expect(calcDownlinkScreenVote({ lossRate: 0.2 })).toBe(0);
		expect(calcDownlinkAudioVote({ lossRate: 0.2 })).toBeGreaterThan(0);
	});
});

describe('calcRttVote — global round-trip curve (200 ms -> 10, 700 ms -> 0)', () => {
	it('returns 10 at/below the good threshold (200 ms)', () => {
		expect(calcRttVote(200)).toBe(10);
		expect(calcRttVote(100)).toBe(10);
	});

	it('returns 5 at the midpoint (450 ms)', () => {
		// (700-450)/500 = 0.5 -> 5
		expect(calcRttVote(450)).toBe(5);
	});

	it('returns 0 at/above the bad threshold (700 ms)', () => {
		expect(calcRttVote(700)).toBe(0);
		expect(calcRttVote(900)).toBe(0);
	});
});

describe('calcUplinkWebcamVote — tier ceiling only (loss dropped)', () => {
	// prodRungs=3 unless stated; bwLimitedFraction/cpuLimitedFraction default to 0

	it('returns 10 when at top rung with no BW limitation', () => {
		expect(
			calcUplinkWebcamVote({ topActiveRung: 2, producibleRungs: 3, bwLimitedFraction: 0 })
		).toBe(10);
	});

	it('returns 6.7 when BW-limited to rung 1 of 3', () => {
		// ratio=2/3, bwLimitedFraction=1 > cpuLimitedFraction=0 -> 6.7
		expect(
			calcUplinkWebcamVote({
				topActiveRung: 1,
				producibleRungs: 3,
				bwLimitedFraction: 1,
				cpuLimitedFraction: 0
			})
		).toBe(6.7);
	});

	it('returns 3.3 when BW-limited to rung 0 of 3', () => {
		expect(
			calcUplinkWebcamVote({ topActiveRung: 0, producibleRungs: 3, bwLimitedFraction: 1 })
		).toBe(3.3);
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

	it('returns 10 for a 360p camera at its top rung (small-camera sending its best)', () => {
		expect(
			calcUplinkWebcamVote({ topActiveRung: 1, producibleRungs: 2, bwLimitedFraction: 0 })
		).toBe(10);
	});

	it('returns 5.0 when BW-limited to rung 0 of 2', () => {
		expect(
			calcUplinkWebcamVote({ topActiveRung: 0, producibleRungs: 2, bwLimitedFraction: 1 })
		).toBe(5);
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
});

describe('calcDownlinkWebcamVote — tier x framerate only (loss dropped)', () => {
	it('returns 10 when sender offers top tier and we show top tier', () => {
		expect(calcDownlinkWebcamVote([{ shownTierIdx: 2, senderMaxTierIdx: 2 }])).toBe(10);
	});

	it('returns 6.7 when showing medium of three offered tiers', () => {
		expect(calcDownlinkWebcamVote([{ shownTierIdx: 1, senderMaxTierIdx: 2 }])).toBe(6.7);
	});

	it('returns 10 when sender only offers medium and we show medium (not penalized)', () => {
		expect(calcDownlinkWebcamVote([{ shownTierIdx: 1, senderMaxTierIdx: 1 }])).toBe(10);
	});

	it('returns 3.3 when showing low of three offered tiers', () => {
		expect(calcDownlinkWebcamVote([{ shownTierIdx: 0, senderMaxTierIdx: 2 }])).toBe(3.3);
	});

	it('returns 10 when senderMaxTierIdx is -1 (unknown sender, no penalty)', () => {
		expect(calcDownlinkWebcamVote([{ shownTierIdx: 1, senderMaxTierIdx: -1 }])).toBe(10);
	});

	it('averages feed votes across multiple feeds', () => {
		// feed1: 10; feed2: min(1,1/3)*10=3.3 -> avg(10, 3.33) = 6.7
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
});

describe('calcDownlinkWebcamVote — framerate (temporal) penalty', () => {
	it('a framerate drop at the top tier lowers the vote by a small fixed amount (10 -> 8.5)', () => {
		expect(
			calcDownlinkWebcamVote([{ shownTierIdx: 2, senderMaxTierIdx: 2, temporalReduced: true }])
		).toBe(8.5);
	});

	it('a framerate drop is penalized LESS than a resolution step (8.5 > 6.7)', () => {
		const framerateOnly = calcDownlinkWebcamVote([
			{ shownTierIdx: 2, senderMaxTierIdx: 2, temporalReduced: true }
		]);
		const resolutionStep = calcDownlinkWebcamVote([
			{ shownTierIdx: 1, senderMaxTierIdx: 2, temporalReduced: false }
		]);
		expect(framerateOnly).toBe(8.5);
		expect(resolutionStep).toBe(6.7);
		expect(framerateOnly).toBeGreaterThan(resolutionStep);
	});

	it('resolution AND framerate drop compound (medium tier at base fps -> 5.7)', () => {
		expect(
			calcDownlinkWebcamVote([{ shownTierIdx: 1, senderMaxTierIdx: 2, temporalReduced: true }])
		).toBe(5.7);
	});

	it('temporalReduced false (or absent) applies no framerate penalty', () => {
		expect(
			calcDownlinkWebcamVote([{ shownTierIdx: 2, senderMaxTierIdx: 2, temporalReduced: false }])
		).toBe(10);
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

	it('the global RTT vote participates like any other vote (bad RTT pulls the level down)', () => {
		// mean(3,10,10)=7.67, min=3 -> 0.6*7.67 + 0.4*3 = 5.8 -> medium
		expect(aggregateQuality({ rtt: 3, uplinkWebcam: 10, downlinkAudio: 10 }, true)).toBe('medium');
	});

	it('returns optimal when all votes (six streams + RTT) are 10', () => {
		expect(
			aggregateQuality(
				{
					uplinkWebcam: 10,
					downlinkWebcam: 10,
					uplinkAudio: 10,
					downlinkAudio: 10,
					uplinkScreen: 10,
					downlinkScreen: 10,
					rtt: 10
				},
				true
			)
		).toBe('optimal');
	});
});
