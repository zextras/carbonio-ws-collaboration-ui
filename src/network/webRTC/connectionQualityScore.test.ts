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

describe('calcUplinkWebcamVote', () => {
	it('returns 10 when not limited regardless of rung', () => {
		expect(calcUplinkWebcamVote({ producibleRungs: 3, topActiveRung: 2, limited: false })).toBe(10);
	});

	it('returns 10 when not limited even with a lower rung', () => {
		expect(calcUplinkWebcamVote({ producibleRungs: 2, topActiveRung: 1, limited: false })).toBe(10);
	});

	it('returns a partial score when limited and sending rung 1 of 3', () => {
		expect(calcUplinkWebcamVote({ producibleRungs: 3, topActiveRung: 1, limited: true })).toBe(6.7);
	});

	it('returns 0 when limited and no rung is active', () => {
		expect(calcUplinkWebcamVote({ producibleRungs: 3, topActiveRung: -1, limited: true })).toBe(0);
	});
});

describe('calcDownlinkWebcamVote', () => {
	it('averages substream scores correctly', () => {
		expect(
			calcDownlinkWebcamVote([
				{ substream: 2, off: false },
				{ substream: 2, off: false },
				{ substream: 0, off: false },
				{ substream: 1, off: false }
			])
		).toBe(7.5);
	});

	it('returns 0 when all feeds are off', () => {
		expect(
			calcDownlinkWebcamVote([
				{ substream: 2, off: true },
				{ substream: 1, off: true }
			])
		).toBe(0);
	});
});

describe('calcUplinkAudioVote', () => {
	it('returns 10 for no reported loss', () => {
		expect(calcUplinkAudioVote({ lossRate: 0 })).toBe(10);
	});

	it('returns 9.7 for 3% reported loss', () => {
		expect(calcUplinkAudioVote({ lossRate: 0.03 })).toBe(9.7);
	});

	it('returns 0 for total loss', () => {
		expect(calcUplinkAudioVote({ lossRate: 1 })).toBe(0);
	});
});

describe('calcDownlinkAudioVote', () => {
	it('returns 10 when all inputs are zero (clean connection)', () => {
		expect(calcDownlinkAudioVote({ lossRate: 0, concealmentRatio: 0, jitterMs: 0 })).toBe(10);
	});

	it('returns 2.0 for 80% packet loss', () => {
		expect(calcDownlinkAudioVote({ lossRate: 0.8, concealmentRatio: 0, jitterMs: 0 })).toBe(2);
	});

	it('returns 5.0 for a concealment ratio of 0.5', () => {
		expect(calcDownlinkAudioVote({ lossRate: 0, concealmentRatio: 0.5, jitterMs: 0 })).toBe(5);
	});

	it('returns 0 at 200ms jitter (maximum impairment) and takes the worst input', () => {
		expect(calcDownlinkAudioVote({ lossRate: 0, concealmentRatio: 0, jitterMs: 200 })).toBe(0);
		expect(calcDownlinkAudioVote({ lossRate: 0.1, concealmentRatio: 0, jitterMs: 100 })).toBe(5);
	});
});

describe('calcUplinkScreenVote', () => {
	it('returns 10 for no reported loss', () => {
		expect(calcUplinkScreenVote({ lossRate: 0 })).toBe(10);
	});

	it('returns 0 when loss reaches the threshold (0.15)', () => {
		expect(calcUplinkScreenVote({ lossRate: 0.15 })).toBe(0);
	});

	it('returns 5.0 at half the threshold (0.075)', () => {
		expect(calcUplinkScreenVote({ lossRate: 0.075 })).toBe(5);
	});
});

describe('calcDownlinkScreenVote', () => {
	it('returns 10 for perfect conditions', () => {
		expect(calcDownlinkScreenVote({ lossRate: 0, freezesPerMin: 0 })).toBe(10);
	});

	it('returns 0 when loss reaches the threshold (0.15)', () => {
		expect(calcDownlinkScreenVote({ lossRate: 0.15, freezesPerMin: 0 })).toBe(0);
	});

	it('takes the worst of loss and freezes', () => {
		expect(calcDownlinkScreenVote({ lossRate: 0.075, freezesPerMin: 0 })).toBe(5);
		expect(calcDownlinkScreenVote({ lossRate: 0, freezesPerMin: 3 })).toBe(5);
		expect(calcDownlinkScreenVote({ lossRate: 0, freezesPerMin: 6 })).toBe(0);
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

	it('returns poor for a single downlink-audio vote of 2', () => {
		// wmean=2, wmin=2, score=0.6*2+0.4*2=2.0 -> poor
		expect(aggregateQuality({ downlinkAudio: 2 }, true)).toBe('poor');
	});

	it('keeps the worst direction from being averaged away', () => {
		// weights downlinkAudio=0.2, downlinkWebcam=0.25, uplinkWebcam=0.15, wsum=0.6
		// wmean=(2*0.2+10*0.25+10*0.15)/0.6=7.333, wmin=2, score=0.6*7.333+0.4*2=5.2 -> medium
		expect(aggregateQuality({ downlinkAudio: 2, downlinkWebcam: 10, uplinkWebcam: 10 }, true)).toBe(
			'medium'
		);
	});

	it('returns poor when both audio directions are bad', () => {
		expect(aggregateQuality({ uplinkAudio: 2, downlinkAudio: 2 }, true)).toBe('poor');
	});

	it('returns optimal when all active votes are 10', () => {
		expect(aggregateQuality({ downlinkWebcam: 10, uplinkWebcam: 10, uplinkAudio: 10 }, true)).toBe(
			'optimal'
		);
	});
});
