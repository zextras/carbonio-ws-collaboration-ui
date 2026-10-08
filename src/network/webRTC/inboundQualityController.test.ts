/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, it, test } from 'vitest';

import {
	COOLDOWN_BASE,
	COOLDOWN_MAX,
	decideFeedDownlink,
	DOWN_SCORE,
	EVIDENCE_DOWN_M,
	EVIDENCE_DOWN_N,
	FeedDownlinkState,
	initialFeedState,
	TOP_RUNG,
	UP_SCORE
} from './inboundQualityController';

// Drive n ticks of a constant fps score+senderOK; return the last state.
function driveN(
	state: FeedDownlinkState,
	score: number,
	senderOK: boolean,
	n: number
): FeedDownlinkState {
	let s = state;
	for (let i = 0; i < n; i += 1) s = decideFeedDownlink(s, score, senderOK);
	return s;
}

// Drive n ticks of undefined (no-data) score; return the last state.
function driveNUndef(state: FeedDownlinkState, n: number): FeedDownlinkState {
	let s = state;
	for (let i = 0; i < n; i += 1) s = decideFeedDownlink(s, undefined, true);
	return s;
}

// Drive enough ticks of score 0 + senderOK=true to trigger DOWN from empty evidenceBuf.
// With EVIDENCE_DOWN_N=3 of last EVIDENCE_DOWN_M=4, 3 consecutive ticks of score 0 suffice.
function driveDown(state: FeedDownlinkState): FeedDownlinkState {
	return driveN(state, DOWN_SCORE, true, EVIDENCE_DOWN_N);
}

// Drive COOLDOWN_BASE ticks of score 10 + senderOK=true to trigger UP from empty evidenceBuf.
function driveUp(state: FeedDownlinkState): FeedDownlinkState {
	return driveN(state, UP_SCORE + 1, true, COOLDOWN_BASE);
}

function withRung(rung: number): FeedDownlinkState {
	const s = initialFeedState(TOP_RUNG);
	return { ...s, targetRung: rung };
}

test('initialFeedState defaults: targetRung=TOP_RUNG, empty evidence, cooldown at base', () => {
	const s = initialFeedState();
	expect(s.targetRung).toBe(TOP_RUNG);
	expect(s.evidenceBuf).toEqual([]);
	expect(s.cleanStreak).toBe(0);
	expect(s.cooldownLen).toBe(COOLDOWN_BASE);
	expect(s.ticksSinceUp).toBeGreaterThan(COOLDOWN_MAX);
});

test('initialFeedState accepts an explicit rung', () => {
	expect(initialFeedState(1).targetRung).toBe(1);
	expect(initialFeedState(0).targetRung).toBe(0);
});

test('TOP_RUNG is 2', () => {
	expect(TOP_RUNG).toBe(2);
});

test('constants: DOWN_SCORE=2.7, UP_SCORE=9, EVIDENCE_DOWN_N=3, EVIDENCE_DOWN_M=4, COOLDOWN_BASE=12, COOLDOWN_MAX=32', () => {
	expect(DOWN_SCORE).toBe(2.7);
	expect(UP_SCORE).toBe(9);
	expect(EVIDENCE_DOWN_N).toBe(3);
	expect(EVIDENCE_DOWN_M).toBe(4);
	expect(COOLDOWN_BASE).toBe(12);
	expect(COOLDOWN_MAX).toBe(32);
});

test('does not mutate prev state', () => {
	const s0 = initialFeedState();
	const before = { ...s0, evidenceBuf: [...s0.evidenceBuf] };
	decideFeedDownlink(s0, 0, true);
	expect(s0.evidenceBuf).toEqual(before.evidenceBuf);
	expect(s0.targetRung).toBe(before.targetRung);
});

describe('DOWN — low fps ticks with senderOK=true', () => {
	it('does NOT fire after 2 low fps ticks (need N=3 of M=4)', () => {
		expect(driveN(withRung(2), 0, true, 2).targetRung).toBe(2);
	});

	it('fires on the 3rd consecutive low fps tick: targetRung 2->1', () => {
		expect(driveN(withRung(2), 0, true, 3).targetRung).toBe(1);
	});

	it('fires again after evidence reset: steps from rung 1 to rung 0', () => {
		const after1 = driveDown(withRung(2));
		expect(after1.targetRung).toBe(1);
		expect(after1.evidenceBuf).toEqual([]);
		expect(driveDown(after1).targetRung).toBe(0);
	});

	it('floors at rung 0: further frozen ticks never go below 0', () => {
		expect(driveDown(withRung(0)).targetRung).toBe(0);
	});

	it('evidenceBuf resets to [] after DOWN', () => {
		expect(driveDown(withRung(2)).evidenceBuf).toEqual([]);
	});
});

describe('DOWN — low fps ticks with senderOK=false', () => {
	it('holds and does NOT change the rung (sender is responsible)', () => {
		expect(driveN(withRung(2), 0, false, 10).targetRung).toBe(2);
	});

	it('does NOT reset evidenceBuf on HOLD (accumulated freeze persists for when badge flips)', () => {
		const state = driveN(withRung(2), 0, false, EVIDENCE_DOWN_N);
		// evidenceBuf should have entries from the frozen ticks
		expect(state.evidenceBuf.length).toBeGreaterThan(0);
	});

	it('fires DOWN when badge flips to OK after accumulated freeze evidence', () => {
		// Accumulate enough freeze with senderOK=false (no DOWN fires, evidenceBuf fills).
		const afterHold = driveN(withRung(2), 0, false, EVIDENCE_DOWN_N);
		// Now sender is OK: the accumulated freeze triggers DOWN immediately.
		expect(decideFeedDownlink(afterHold, 0, true).targetRung).toBe(1);
	});
});

describe('UP — clean ticks probe one tier at a time', () => {
	it('does NOT fire before cleanStreak reaches cooldownLen (base=8)', () => {
		expect(driveN(withRung(1), 10, true, COOLDOWN_BASE - 1).targetRung).toBe(1);
	});

	it('fires on the COOLDOWN_BASE-th clean tick: targetRung 1->2', () => {
		expect(driveUp(withRung(1)).targetRung).toBe(2);
	});

	it('raises one tier at a time: rung 0 -> 1, then needs another cooldownLen ticks for 1 -> 2', () => {
		const at1 = driveUp(withRung(0));
		expect(at1.targetRung).toBe(1);
		expect(driveUp(at1).targetRung).toBe(2);
	});

	it('at TOP_RUNG (2) further clean ticks keep the rung', () => {
		expect(driveUp(withRung(TOP_RUNG)).targetRung).toBe(TOP_RUNG);
	});

	it('evidenceBuf resets to [] after UP', () => {
		expect(driveUp(withRung(0)).evidenceBuf).toEqual([]);
	});

	it('cleanStreak resets to 0 after UP', () => {
		expect(driveUp(withRung(0)).cleanStreak).toBe(0);
	});

	it('ticksSinceUp resets to 0 after UP', () => {
		expect(driveUp(withRung(0)).ticksSinceUp).toBe(0);
	});
});

describe('failed climb — UP then DOWN within cooldownLen doubles cooldownLen', () => {
	it('first failed climb: cooldownLen doubles from base (12->24)', () => {
		const afterUp = driveUp(withRung(1));
		expect(afterUp.ticksSinceUp).toBe(0);
		expect(afterUp.cooldownLen).toBe(COOLDOWN_BASE);

		const afterDown = driveDown(afterUp);
		expect(afterDown.cooldownLen).toBe(24);
		expect(afterDown.targetRung).toBe(1);
	});

	it('second failed climb: cooldownLen doubles again 24->32 (capped at COOLDOWN_MAX)', () => {
		let s = withRung(1);
		s = driveUp(s); // UP: rung 1→2, ticksSinceUp=0, cooldownLen=12
		s = driveDown(s); // DOWN within cooldown: rung 2→1, cooldownLen 12→24
		expect(s.cooldownLen).toBe(24);

		// Drive 24 clean ticks — UP fires automatically when cleanStreak reaches cooldownLen=24.
		// After the UP: rung 1→2 (targetRung=2), ticksSinceUp=0, cooldownLen stays 24
		// (backoff is monotonic; no stability reset).
		s = driveN(s, UP_SCORE + 1, true, 24);
		expect(s.targetRung).toBe(2); // UP fired during those 24 ticks

		// Second DOWN within the new cooldown window (ticksSinceUp ≤ cooldownLen=24) → double again.
		s = driveDown(s);
		expect(s.cooldownLen).toBe(32);
	});

	it('cooldownLen caps at COOLDOWN_MAX on doubling', () => {
		const s: FeedDownlinkState = {
			...withRung(2),
			cooldownLen: COOLDOWN_MAX,
			ticksSinceUp: 0
		};
		expect(driveDown(s).cooldownLen).toBe(COOLDOWN_MAX);
	});

	it('steps the rung down on a failed climb', () => {
		const afterUp = driveUp(withRung(1));
		expect(driveDown(afterUp).targetRung).toBe(1);
	});
});

describe('high fps (healthy) — never goes DOWN', () => {
	it('never moves the rung below TOP_RUNG when fps score is always 10 (clean)', () => {
		let s = initialFeedState();
		for (let i = 0; i < 100; i += 1) {
			s = decideFeedDownlink(s, 10, true);
			expect(s.targetRung).toBe(TOP_RUNG);
		}
		// UP may fire after enough clean ticks, but the rung never drops below TOP_RUNG on clean data.
		expect(s.targetRung).toBe(TOP_RUNG);
	});
});

describe('undefined (no-data) ticks — HOLD with no evidence pushed', () => {
	it('pushes NO evidence: evidenceBuf stays empty after a run of undefined ticks', () => {
		expect(driveNUndef(initialFeedState(), 10).evidenceBuf).toEqual([]);
	});

	it('causes no rung change', () => {
		expect(driveNUndef(initialFeedState(), 10).targetRung).toBe(TOP_RUNG);
	});

	it('cleanStreak is preserved across undefined ticks', () => {
		let s = initialFeedState();
		// Drive 5 clean ticks so cleanStreak=5.
		s = driveN(s, UP_SCORE + 1, true, 5);
		expect(s.cleanStreak).toBe(5);
		// Drive 3 undefined ticks — cleanStreak must remain 5.
		s = driveNUndef(s, 3);
		expect(s.cleanStreak).toBe(5);
	});

	it('a long run of undefined ticks never sheds and never climbs when starting at rung 1', () => {
		const s0: FeedDownlinkState = { ...initialFeedState(), targetRung: 1 };
		expect(driveNUndef(s0, 100).targetRung).toBe(1);
	});
});
