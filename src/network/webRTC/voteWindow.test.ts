/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, it } from 'vitest';

import { atLeast } from './officialVoteWindow';
import { DISPLAY_WINDOW, VoteWindow } from './voteWindow';

describe('VoteWindow — constants', () => {
	it('DISPLAY_WINDOW is 7', () => {
		expect(DISPLAY_WINDOW).toBe(7);
	});
});

describe('VoteWindow — seeded-optimistic start', () => {
	it('a fresh window reads medianLast(DISPLAY_WINDOW)=5 (optimal)', () => {
		const w = new VoteWindow();
		expect(w.medianLast(DISPLAY_WINDOW)).toBe(5);
	});

	it('medianLast returns 5 for any n on a fresh window', () => {
		const w = new VoteWindow();
		[1, 3, 5, 7, 11, 15].forEach((n) => expect(w.medianLast(n)).toBe(5));
	});
});

describe('VoteWindow — lone glitch absorbed by median-7', () => {
	it('a single push(0) on a fresh window does NOT move medianLast(DISPLAY_WINDOW)', () => {
		const w = new VoteWindow();
		w.push(0);
		// last 7 = [5,5,5,5,5,5,0] → sorted median(index 3) = 5
		expect(w.medianLast(DISPLAY_WINDOW)).toBe(5);
	});

	it('three consecutive zeros still do not move the median (minority in last-7)', () => {
		const w = new VoteWindow();
		for (let i = 0; i < 3; i += 1) w.push(0);
		// last 7 = [5,5,5,5,0,0,0] → sorted median = 5
		expect(w.medianLast(DISPLAY_WINDOW)).toBe(5);
	});
});

describe('VoteWindow — sustained shift reaches median after enough ticks', () => {
	it('four consecutive push(0) move medianLast(DISPLAY_WINDOW) to 0', () => {
		const w = new VoteWindow();
		for (let i = 0; i < 4; i += 1) w.push(0);
		// last 7 = [5,5,5,0,0,0,0] → sorted median(index 3) = 0
		expect(w.medianLast(DISPLAY_WINDOW)).toBe(0);
	});

	it('push(0) × 3 is still not enough; push(0) × 4 tips the median', () => {
		const w = new VoteWindow();
		for (let i = 0; i < 3; i += 1) w.push(0);
		expect(w.medianLast(DISPLAY_WINDOW)).toBe(5);
		w.push(0);
		expect(w.medianLast(DISPLAY_WINDOW)).toBe(0);
	});

	it('recovery: after 4 zeros, four fives restore the median to 5', () => {
		const w = new VoteWindow();
		for (let i = 0; i < 4; i += 1) w.push(0);
		expect(w.medianLast(DISPLAY_WINDOW)).toBe(0);
		for (let i = 0; i < 4; i += 1) w.push(5);
		// last 7 = [0,0,0,0,5,5,5] ... wait: last 7 after 8 total pushes into a 15-seed buf:
		// push history (oldest→newest in last-7 slot): [5,5,5, 0,0,0,0,5,5,5,5]
		// actual last 7 = [0,0,0,5,5,5,5] → sorted median = 5
		expect(w.medianLast(DISPLAY_WINDOW)).toBe(5);
	});
});

describe('VoteWindow — medianLast(n) capping at buffer length', () => {
	it('medianLast with n larger than the internal buffer length uses the full buffer', () => {
		const w = new VoteWindow();
		// Buffer is always at capacity (15 seeds). n=100 caps to 15 — same result as medianLast(15).
		expect(w.medianLast(100)).toBe(w.medianLast(15));
	});

	it('medianLast(15) and medianLast(16) agree on a fresh window', () => {
		const w = new VoteWindow();
		expect(w.medianLast(15)).toBe(5);
		expect(w.medianLast(16)).toBe(5);
	});

	it('old entries are evicted once capacity (15) is exceeded', () => {
		const w = new VoteWindow();
		// Push 15 zeros — completely replaces the 15-seed buffer.
		for (let i = 0; i < 15; i += 1) w.push(0);
		expect(w.medianLast(15)).toBe(0);
		// Push 15 fives — zeros gone.
		for (let i = 0; i < 15; i += 1) w.push(5);
		expect(w.medianLast(15)).toBe(5);
	});
});

describe('atLeast helper (from officialVoteWindow)', () => {
	it('returns true when exactly n entries in the last m satisfy pred', () => {
		expect(atLeast([0, 0, 0, 5], 3, 4, (b) => b <= 2)).toBe(true);
	});

	it('returns false when fewer than n satisfy', () => {
		expect(atLeast([0, 0, 5, 5], 3, 4, (b) => b <= 2)).toBe(false);
	});

	it('caps m at buf.length when buf is shorter than m', () => {
		expect(atLeast([0, 0], 2, 4, (b) => b <= 2)).toBe(true);
		expect(atLeast([0, 0], 3, 4, (b) => b <= 2)).toBe(false);
	});

	it('considers only the LAST m entries, ignoring older ones', () => {
		// last 4 of [0,0,0,0,0,5,5,5] = [0,5,5,5] — only 1 satisfies <=2, need 3
		expect(atLeast([0, 0, 0, 0, 0, 5, 5, 5], 3, 4, (b) => b <= 2)).toBe(false);
	});

	it('returns true when n=0 (trivially satisfied)', () => {
		expect(atLeast([], 0, 4, (b) => b <= 2)).toBe(true);
	});
});
