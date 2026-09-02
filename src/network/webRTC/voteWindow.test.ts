/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, it } from 'vitest';

import { atLeast, OFFICIAL_HISTORY_CAPACITY, OfficialVoteWindow } from './officialVoteWindow';
import { DISPLAY_WINDOW, VoteWindow } from './voteWindow';

describe('VoteWindow — constants', () => {
	it('DISPLAY_WINDOW is 7', () => {
		expect(DISPLAY_WINDOW).toBe(7);
	});

	it('OFFICIAL_HISTORY_CAPACITY is 13', () => {
		expect(OFFICIAL_HISTORY_CAPACITY).toBe(13);
	});
});

describe('VoteWindow — optimistic seed', () => {
	it('is seeded optimistic (bars 5) so a fresh connection reads optimal', () => {
		const w = new VoteWindow();
		expect(w.medianLast(11)).toBe(5);
	});

	it('medianLast on a fresh window does not throw for any valid n', () => {
		const w = new VoteWindow();
		[1, 3, 5, 7, 11].forEach((n) => expect(w.medianLast(n)).toBe(5));
	});
});

describe('VoteWindow — median-7 smoothing an isolated spike', () => {
	it('a single bad-vote spike does NOT move medianLast(DISPLAY_WINDOW) — lone glitch is absorbed', () => {
		// 10 optimal (bars 5), then one spike (bars 0): median-7 = 5 (spike is minority).
		const w = new VoteWindow();
		for (let i = 0; i < 10; i += 1) w.push(5);
		w.push(0);
		expect(w.medianLast(DISPLAY_WINDOW)).toBe(5);
	});

	it('a sustained 6-tick loss does move medianLast(DISPLAY_WINDOW) to 0', () => {
		// 6 zeros comfortably own the majority of the 7-slot window (≥4 of 7 reach median position 3).
		const w = new VoteWindow();
		for (let i = 0; i < 6; i += 1) w.push(0);
		expect(w.medianLast(DISPLAY_WINDOW)).toBe(0);
	});
});

describe('VoteWindow — push and medianLast (capacity = DISPLAY_WINDOW = 7)', () => {
	it('four consecutive bad votes (bars 0) make medianLast(7) drop to 0', () => {
		const w = new VoteWindow();
		// Seed has 7 fives. Need 4 zeros to own the median position (index 3 of 7 sorted).
		// After 3 zeros: [5×4, 0×3] → median index 3 = 5. After 4 zeros: [5×3, 0×4] → median index 3 = 0.
		for (let i = 0; i < 3; i += 1) w.push(0);
		expect(w.medianLast(7)).toBe(5);
		w.push(0);
		expect(w.medianLast(7)).toBe(0);
	});

	it('old entries are evicted after DISPLAY_WINDOW (7) pushes (capacity = 7)', () => {
		const w = new VoteWindow();
		// Flood with 7 zeros to displace the seed entirely.
		for (let i = 0; i < 7; i += 1) w.push(0);
		expect(w.medianLast(7)).toBe(0);
		// Push 7 fives — all zeros gone.
		for (let i = 0; i < 7; i += 1) w.push(5);
		expect(w.medianLast(7)).toBe(5);
	});
});

describe('VoteWindow — ICE-down handling (documented rule, pinned)', () => {
	it('a fresh window + one push(0) is still optimistic (seed dominates median-7)', () => {
		const w = new VoteWindow();
		w.push(0);
		// last 7 = [5,5,5,5,5,5,0] -> median index 3 = 5
		expect(w.medianLast(11)).toBe(5);
	});

	it('subsequent lost ticks (push 0, no reset on ICE loss) pull the median down after enough zeros', () => {
		const w = new VoteWindow();
		// capacity is 7: after 6 pushes of 0 the window is [5, 0×6] -> median index 3 = 0
		for (let i = 0; i < 6; i += 1) w.push(0);
		expect(w.medianLast(11)).toBe(0);
	});
});

describe('atLeast helper', () => {
	it('returns true when exactly n entries satisfy pred (>=n/m)', () => {
		// buf=[0,0,0,5], last 4: [0,0,0,5] — 3 of 4 satisfy <=2
		expect(atLeast([0, 0, 0, 5], 3, 4, (b) => b <= 2)).toBe(true);
	});

	it('returns false when fewer than n satisfy', () => {
		// buf=[0,0,5,5], last 4: 2 of 4 satisfy <=2 — need 3
		expect(atLeast([0, 0, 5, 5], 3, 4, (b) => b <= 2)).toBe(false);
	});

	it('uses at most the last m entries (ignores older entries)', () => {
		// buf=[0,0,0,0,0,5,5,5] — last 4 = [0,5,5,5]: only 1 satisfies <=2 — need 3
		expect(atLeast([0, 0, 0, 0, 0, 5, 5, 5], 3, 4, (b) => b <= 2)).toBe(false);
		// last 8 = all 8: 5 of 8 satisfy <=2 (the five zeros)
		expect(atLeast([0, 0, 0, 0, 0, 5, 5, 5], 5, 8, (b) => b <= 2)).toBe(true);
	});

	it('caps m at buf.length when buf is shorter than m', () => {
		// buf=[0,0]: only 2 entries, m=4, pred<=2 — 2 of 2 satisfy — n=2 → true
		expect(atLeast([0, 0], 2, 4, (b) => b <= 2)).toBe(true);
		// n=3 → false (only 2 available)
		expect(atLeast([0, 0], 3, 4, (b) => b <= 2)).toBe(false);
	});

	it('returns true when n=0 (trivially satisfied)', () => {
		expect(atLeast([], 0, 4, (b) => b <= 2)).toBe(true);
	});
});

describe('OfficialVoteWindow — seeded optimistic', () => {
	it('starts with all 13 slots at bars 5 (optimal)', () => {
		const w = new OfficialVoteWindow();
		// All 13 seeds are 5 >= 3 → atLeast(13,13,>=3) = true
		expect(w.atLeast(13, 13, (b) => b >= 3)).toBe(true);
		// All 13 seeds are 5 >= 4 → atLeast(13,13,>=4) = true
		expect(w.atLeast(13, 13, (b) => b >= 4)).toBe(true);
	});

	it('does not fire downVote (3/4 <=2) on a fresh window', () => {
		const w = new OfficialVoteWindow();
		expect(w.atLeast(3, 4, (b) => b <= 2)).toBe(false);
	});
});

describe('OfficialVoteWindow — DOWN signal threshold: atLeast(3,4, b<=2)', () => {
	it('fires after exactly 3 poor bars in the last 4', () => {
		const w = new OfficialVoteWindow();
		// Push 3 bars <= 2 — last 4 = [seed=5, 0, 0, 0] => 3 match
		w.push(0);
		w.push(0);
		w.push(0);
		expect(w.atLeast(3, 4, (b) => b <= 2)).toBe(true);
	});

	it('does NOT fire with only 2 poor bars in the last 4', () => {
		const w = new OfficialVoteWindow();
		w.push(0);
		w.push(0);
		// last 4 = [5, 5, 0, 0] — 2 of 4 satisfy <=2, need 3
		expect(w.atLeast(3, 4, (b) => b <= 2)).toBe(false);
	});

	it('fires when all 4 of the last 4 are poor', () => {
		const w = new OfficialVoteWindow();
		w.push(0);
		w.push(0);
		w.push(0);
		w.push(0);
		expect(w.atLeast(3, 4, (b) => b <= 2)).toBe(true);
	});

	it('stops firing once enough good votes displace the bad ones', () => {
		const w = new OfficialVoteWindow();
		w.push(0);
		w.push(0);
		w.push(0);
		expect(w.atLeast(3, 4, (b) => b <= 2)).toBe(true);
		w.push(5); // last 4 = [5, 0, 0, 0] — still 3 bad: still fires
		expect(w.atLeast(3, 4, (b) => b <= 2)).toBe(true);
		w.push(5); // last 4 = [0, 0, 5, 5] — 2 bad: no longer fires
		expect(w.atLeast(3, 4, (b) => b <= 2)).toBe(false);
	});
});

describe('OfficialVoteWindow — UP signal threshold: atLeast(7,8, b===5) — OPTIMAL only', () => {
	it('fires immediately on a fresh window (all 8 seeds are bars=5 optimal)', () => {
		const w = new OfficialVoteWindow();
		expect(w.atLeast(7, 8, (b) => b === 5)).toBe(true);
	});

	it('does NOT fire for bars=4 (high but not optimal): 7/8 must be bars 5', () => {
		const w = new OfficialVoteWindow();
		// Replace 2 of the last 8 seeds with bars=4 (high, not optimal) — only 6 bars===5, need 7.
		w.push(4);
		w.push(4);
		expect(w.atLeast(7, 8, (b) => b === 5)).toBe(false);
	});

	it('stops firing after 2 non-optimal bars in the last 8', () => {
		const w = new OfficialVoteWindow();
		w.push(0);
		w.push(0);
		// last 8 = [5,5,5,5,5,5,0,0] — 6 satisfy ===5, need 7
		expect(w.atLeast(7, 8, (b) => b === 5)).toBe(false);
	});

	it('fires again once the bad entries leave the window', () => {
		const w = new OfficialVoteWindow();
		w.push(0);
		w.push(0);
		// Fill 8 optimal votes to push both bad ones out of the last-8 window
		for (let i = 0; i < 8; i += 1) w.push(5);
		expect(w.atLeast(7, 8, (b) => b === 5)).toBe(true);
	});
});

describe('OfficialVoteWindow — WARN signal threshold: atLeast(8,10, b<=2)', () => {
	it('does NOT fire on a fresh window', () => {
		const w = new OfficialVoteWindow();
		expect(w.atLeast(8, 10, (b) => b <= 2)).toBe(false);
	});

	it('fires after 8 consecutive poor bars', () => {
		const w = new OfficialVoteWindow();
		for (let i = 0; i < 8; i += 1) w.push(0);
		// last 10 = [5,5,0,0,0,0,0,0,0,0] — 8 of 10 satisfy <=2
		expect(w.atLeast(8, 10, (b) => b <= 2)).toBe(true);
	});

	it('does NOT fire with only 7 poor bars in the last 10', () => {
		const w = new OfficialVoteWindow();
		for (let i = 0; i < 7; i += 1) w.push(0);
		// last 10 = [5,5,5,0,0,0,0,0,0,0] — 7 of 10, need 8
		expect(w.atLeast(8, 10, (b) => b <= 2)).toBe(false);
	});
});

describe('OfficialVoteWindow — RESTORE signal threshold: atLeast(10,13, b>=3)', () => {
	it('fires immediately on a fresh window (all 13 seeds are 5 >= 3)', () => {
		const w = new OfficialVoteWindow();
		expect(w.atLeast(10, 13, (b) => b >= 3)).toBe(true);
	});

	it('stops firing after 4 bad bars in the last 13', () => {
		const w = new OfficialVoteWindow();
		for (let i = 0; i < 4; i += 1) w.push(0);
		// last 13 = [5x9, 0x4] — 9 satisfy >=3, need 10
		expect(w.atLeast(10, 13, (b) => b >= 3)).toBe(false);
	});

	it('fires after exactly 10 good bars among the last 13', () => {
		const w = new OfficialVoteWindow();
		// Fill 13 with 10 good (5) and 3 bad (0): push in order so last 13 = [5x10, 0x3]
		for (let i = 0; i < 10; i += 1) w.push(5);
		for (let i = 0; i < 3; i += 1) w.push(0);
		// last 13: 10 satisfy >=3
		expect(w.atLeast(10, 13, (b) => b >= 3)).toBe(true);
	});
});
