/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, it } from 'vitest';

import {
	aggregateQuality,
	audioVote,
	screenshareVote,
	scoreToLevel,
	webcamDownVote,
	webcamUpVote
} from './connectionQualityScore';

describe('webcamUpVote', () => {
	it('returns 10 when not limited regardless of rung', () => {
		expect(webcamUpVote({ producibleRungs: 3, topActiveRung: 2, limited: false })).toBe(10);
	});

	it('returns 10 when not limited even with lower rung', () => {
		expect(webcamUpVote({ producibleRungs: 2, topActiveRung: 1, limited: false })).toBe(10);
	});

	it('returns partial score when limited and rung 1 of 3', () => {
		expect(webcamUpVote({ producibleRungs: 3, topActiveRung: 1, limited: true })).toBe(6.7);
	});

	it('returns 0 when limited and no active rung', () => {
		expect(webcamUpVote({ producibleRungs: 3, topActiveRung: -1, limited: true })).toBe(0);
	});
});

describe('webcamDownVote', () => {
	it('returns 10 for empty feed list', () => {
		expect(webcamDownVote([])).toBe(10);
	});

	it('averages substream scores correctly', () => {
		expect(
			webcamDownVote([
				{ substream: 2, off: false },
				{ substream: 2, off: false },
				{ substream: 0, off: false },
				{ substream: 1, off: false }
			])
		).toBe(7.5);
	});

	it('returns 0 when all feeds are off', () => {
		expect(
			webcamDownVote([
				{ substream: 2, off: true },
				{ substream: 1, off: true }
			])
		).toBe(0);
	});
});

describe('audioVote', () => {
	it('returns 10 when all inputs are zero (clean connection)', () => {
		expect(audioVote({ downLossRate: 0, concealmentRatio: 0, jitterMs: 0, upLossRate: 0 })).toBe(
			10
		);
	});

	it('returns 2.0 when downLossRate is 0.8 (80% packet loss)', () => {
		// NOTE: spec said 0.08 but (1-0.08)*10 = 9.2; corrected to 0.8 => (1-0.8)*10 = 2.0
		expect(audioVote({ downLossRate: 0.8, concealmentRatio: 0, jitterMs: 0, upLossRate: 0 })).toBe(
			2
		);
	});

	it('returns 5.0 when concealmentRatio is 0.5', () => {
		expect(audioVote({ downLossRate: 0, concealmentRatio: 0.5, jitterMs: 0, upLossRate: 0 })).toBe(
			5
		);
	});

	it('returns 0 when jitterMs is 200 (maximum impairment)', () => {
		expect(audioVote({ downLossRate: 0, concealmentRatio: 0, jitterMs: 200, upLossRate: 0 })).toBe(
			0
		);
	});
});

describe('screenshareVote', () => {
	it('returns 10 for perfect conditions', () => {
		expect(screenshareVote({ lossRate: 0, freezesPerMin: 0 })).toBe(10);
	});

	it('returns 0 when lossRate equals threshold (0.15)', () => {
		expect(screenshareVote({ lossRate: 0.15, freezesPerMin: 0 })).toBe(0);
	});

	it('returns 5.0 when lossRate is half of threshold (0.075)', () => {
		expect(screenshareVote({ lossRate: 0.075, freezesPerMin: 0 })).toBe(5);
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
		expect(aggregateQuality({ audio: 8 }, false)).toBe('lost');
	});

	it('returns optimal when no votes are present but ICE is connected', () => {
		expect(aggregateQuality({}, true)).toBe('optimal');
	});

	it('returns poor for audio-only vote of 2', () => {
		// wsum=0.4, wmean=2, wmin=2, score=0.6*2+0.4*2=2.0 → poor
		expect(aggregateQuality({ audio: 2 }, true)).toBe('poor');
	});

	it('returns poor when audio is 2 and webcam streams are 10', () => {
		// weights: audio=0.4, webcamDown=0.25, webcamUp=0.15, wsum=0.8
		// wmean = (2*0.4 + 10*0.25 + 10*0.15) / 0.8 = 4.8/0.8 = 6.0
		// NOTE: spec's wmean (4.75) and score (3.65) are incorrect; correct score = 0.6*6+0.4*2 = 4.4 → poor
		expect(aggregateQuality({ audio: 2, webcamDown: 10, webcamUp: 10 }, true)).toBe('poor');
	});

	it('returns optimal when all active votes are 10', () => {
		expect(aggregateQuality({ webcamDown: 10, webcamUp: 10, audio: 10 }, true)).toBe('optimal');
	});
});
