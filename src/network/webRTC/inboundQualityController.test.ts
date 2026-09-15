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

// Drive n ticks of a constant fps score+senderOK; return the last decision.
function driveN(
	state: FeedDownlinkState,
	score: number,
	senderOK: boolean,
	n: number
): ReturnType<typeof decideFeedDownlink> {
	let r: ReturnType<typeof decideFeedDownlink> = {
		state,
		targetRung: state.targetRung,
		changed: false,
		signal: 'HOLD'
	};
	for (let i = 0; i < n; i += 1) r = decideFeedDownlink(r.state, score, senderOK);
	return r;
}

// Drive n ticks of undefined (no-data) score; return the last decision.
function driveNUndef(state: FeedDownlinkState, n: number): ReturnType<typeof decideFeedDownlink> {
	let r: ReturnType<typeof decideFeedDownlink> = {
		state,
		targetRung: state.targetRung,
		changed: false,
		signal: 'HOLD'
	};
	for (let i = 0; i < n; i += 1) r = decideFeedDownlink(r.state, undefined, true);
	return r;
}

// Drive enough ticks of score 0 + senderOK=true to trigger DOWN from empty evidenceBuf.
// With EVIDENCE_DOWN_N=3 of last EVIDENCE_DOWN_M=4, 3 consecutive ticks of score 0 suffice.
function driveDown(state: FeedDownlinkState): ReturnType<typeof decideFeedDownlink> {
	return driveN(state, DOWN_SCORE, true, EVIDENCE_DOWN_N);
}

// Drive COOLDOWN_BASE ticks of score 10 + senderOK=true to trigger UP from empty evidenceBuf.
function driveUp(state: FeedDownlinkState): ReturnType<typeof decideFeedDownlink> {
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
		const r = driveN(withRung(2), 0, true, 2);
		expect(r.changed).toBe(false);
		expect(r.signal).toBe('HOLD');
		expect(r.targetRung).toBe(2);
	});

	it('fires on the 3rd consecutive low fps tick: targetRung 2->1, signal DOWN, changed true', () => {
		const r = driveN(withRung(2), 0, true, 3);
		expect(r.changed).toBe(true);
		expect(r.signal).toBe('DOWN');
		expect(r.targetRung).toBe(1);
		expect(r.state.targetRung).toBe(1);
	});

	it('fires again after evidence reset: steps from rung 1 to rung 0', () => {
		const { state: after1 } = driveDown(withRung(2));
		expect(after1.targetRung).toBe(1);
		expect(after1.evidenceBuf).toEqual([]);
		const { state: after2, changed, signal } = driveDown(after1);
		expect(changed).toBe(true);
		expect(signal).toBe('DOWN');
		expect(after2.targetRung).toBe(0);
	});

	it('floors at rung 0 — further frozen ticks produce HOLD, never goes below 0', () => {
		const r = driveDown(withRung(0));
		expect(r.changed).toBe(false);
		expect(r.signal).toBe('HOLD');
		expect(r.targetRung).toBe(0);
	});

	it('evidenceBuf resets to [] after DOWN', () => {
		const { state } = driveDown(withRung(2));
		expect(state.evidenceBuf).toEqual([]);
	});
});

describe('DOWN — low fps ticks with senderOK=false', () => {
	it('holds and does NOT change the rung (sender is responsible)', () => {
		const r = driveN(withRung(2), 0, false, 10);
		expect(r.changed).toBe(false);
		expect(r.signal).toBe('HOLD');
		expect(r.targetRung).toBe(2);
	});

	it('does NOT reset evidenceBuf on HOLD (accumulated freeze persists for when badge flips)', () => {
		const r = driveN(withRung(2), 0, false, EVIDENCE_DOWN_N);
		// evidenceBuf should have entries from the frozen ticks
		expect(r.state.evidenceBuf.length).toBeGreaterThan(0);
	});

	it('fires DOWN when badge flips to OK after accumulated freeze evidence', () => {
		// Accumulate enough freeze with senderOK=false (no DOWN fires, evidenceBuf fills).
		const { state: afterHold } = driveN(withRung(2), 0, false, EVIDENCE_DOWN_N);
		// Now sender is OK: the accumulated freeze triggers DOWN immediately.
		const r = decideFeedDownlink(afterHold, 0, true);
		expect(r.changed).toBe(true);
		expect(r.signal).toBe('DOWN');
	});
});

describe('UP — clean ticks probe one tier at a time', () => {
	it('does NOT fire before cleanStreak reaches cooldownLen (base=8)', () => {
		const r = driveN(withRung(1), 10, true, COOLDOWN_BASE - 1);
		expect(r.changed).toBe(false);
		expect(r.signal).toBe('HOLD');
	});

	it('fires on the COOLDOWN_BASE-th clean tick: targetRung 1->2, signal UP, changed true', () => {
		const r = driveUp(withRung(1));
		expect(r.changed).toBe(true);
		expect(r.signal).toBe('UP');
		expect(r.targetRung).toBe(2);
	});

	it('raises one tier at a time: rung 0 -> 1, then needs another cooldownLen ticks for 1 -> 2', () => {
		const { state: at1 } = driveUp(withRung(0));
		expect(at1.targetRung).toBe(1);
		const { state: at2 } = driveUp(at1);
		expect(at2.targetRung).toBe(2);
	});

	it('at TOP_RUNG (2) further clean ticks produce HOLD', () => {
		const r = driveUp(withRung(TOP_RUNG));
		expect(r.changed).toBe(false);
		expect(r.signal).toBe('HOLD');
		expect(r.targetRung).toBe(TOP_RUNG);
	});

	it('evidenceBuf resets to [] after UP', () => {
		const { state } = driveUp(withRung(0));
		expect(state.evidenceBuf).toEqual([]);
	});

	it('cleanStreak resets to 0 after UP', () => {
		const { state } = driveUp(withRung(0));
		expect(state.cleanStreak).toBe(0);
	});

	it('ticksSinceUp resets to 0 after UP', () => {
		const { state } = driveUp(withRung(0));
		expect(state.ticksSinceUp).toBe(0);
	});
});

describe('failed climb — UP then DOWN within cooldownLen doubles cooldownLen', () => {
	it('first failed climb: cooldownLen doubles from base (12->24)', () => {
		const { state: afterUp } = driveUp(withRung(1));
		expect(afterUp.ticksSinceUp).toBe(0);
		expect(afterUp.cooldownLen).toBe(COOLDOWN_BASE);

		const resultDown = driveDown(afterUp);
		expect(resultDown.state.cooldownLen).toBe(24);
		expect(resultDown.signal).toBe('DOWN');
	});

	it('second failed climb: cooldownLen doubles again 24->32 (capped at COOLDOWN_MAX)', () => {
		let s = withRung(1);
		({ state: s } = driveUp(s)); // UP: rung 1→2, ticksSinceUp=0, cooldownLen=12
		({ state: s } = driveDown(s)); // DOWN within cooldown: rung 2→1, cooldownLen 12→24
		expect(s.cooldownLen).toBe(24);

		// Drive 24 clean ticks — UP fires automatically when cleanStreak reaches cooldownLen=24.
		// After the UP: rung 1→2 (targetRung=2), ticksSinceUp=0, cooldownLen stays 24
		// (backoff is monotonic; no stability reset).
		s = driveN(s, UP_SCORE + 1, true, 24).state;
		expect(s.targetRung).toBe(2); // UP fired during those 24 ticks

		// Second DOWN within the new cooldown window (ticksSinceUp ≤ cooldownLen=24) → double again.
		({ state: s } = driveDown(s));
		expect(s.cooldownLen).toBe(32);
	});

	it('cooldownLen caps at COOLDOWN_MAX on doubling', () => {
		const s: FeedDownlinkState = {
			...withRung(2),
			cooldownLen: COOLDOWN_MAX,
			ticksSinceUp: 0
		};
		const { state } = driveDown(s);
		expect(state.cooldownLen).toBe(COOLDOWN_MAX);
	});

	it('signal is DOWN and changed=true on a failed climb', () => {
		const { state: afterUp } = driveUp(withRung(1));
		const result = driveDown(afterUp);
		expect(result.signal).toBe('DOWN');
		expect(result.changed).toBe(true);
	});
});

describe('high fps (healthy) — never goes DOWN', () => {
	it('never moves the rung below TOP_RUNG when fps score is always 10 (clean)', () => {
		let s = initialFeedState();
		for (let i = 0; i < 100; i += 1) {
			const r = decideFeedDownlink(s, 10, true);
			s = r.state;
			expect(r.signal).not.toBe('DOWN');
		}
		// UP may fire after enough clean ticks, but the rung never drops below TOP_RUNG on clean data.
		expect(s.targetRung).toBe(TOP_RUNG);
	});
});

describe('undefined (no-data) ticks — HOLD with no evidence pushed', () => {
	it('pushes NO evidence: evidenceBuf stays empty after a run of undefined ticks', () => {
		const { state } = driveNUndef(initialFeedState(), 10);
		expect(state.evidenceBuf).toEqual([]);
	});

	it('causes no rung change: changed=false, signal=HOLD, targetRung unchanged', () => {
		const { changed, signal, targetRung } = driveNUndef(initialFeedState(), 10);
		expect(changed).toBe(false);
		expect(signal).toBe('HOLD');
		expect(targetRung).toBe(TOP_RUNG);
	});

	it('cleanStreak is preserved across undefined ticks', () => {
		let s = initialFeedState();
		// Drive 5 clean ticks so cleanStreak=5.
		s = driveN(s, UP_SCORE + 1, true, 5).state;
		expect(s.cleanStreak).toBe(5);
		// Drive 3 undefined ticks — cleanStreak must remain 5.
		s = driveNUndef(s, 3).state;
		expect(s.cleanStreak).toBe(5);
	});

	it('a long run of undefined ticks never sheds and never climbs when starting at rung 1', () => {
		const s0: FeedDownlinkState = { ...initialFeedState(), targetRung: 1 };
		const { state } = driveNUndef(s0, 100);
		expect(state.targetRung).toBe(1);
	});
});

// Drive n ticks of a constant score+senderOK under a maxRung ceiling; return the last decision.
function driveNMax(
	state: FeedDownlinkState,
	score: number,
	senderOK: boolean,
	n: number,
	maxRung: number
): ReturnType<typeof decideFeedDownlink> {
	let r: ReturnType<typeof decideFeedDownlink> = {
		state,
		targetRung: state.targetRung,
		changed: false,
		signal: 'HOLD'
	};
	for (let i = 0; i < n; i += 1) r = decideFeedDownlink(r.state, score, senderOK, maxRung);
	return r;
}

describe('maxRung — externally-decided hard ceiling (tile size / CPU)', () => {
	it('defaults to TOP_RUNG: passing no maxRung matches the 3-arg behavior (never caps)', () => {
		const withArg = decideFeedDownlink(withRung(2), 10, true, TOP_RUNG);
		const withoutArg = decideFeedDownlink(withRung(2), 10, true);
		expect(withArg.targetRung).toBe(withoutArg.targetRung);
		expect(withArg.signal).toBe(withoutArg.signal);
		expect(withArg.changed).toBe(withoutArg.changed);
	});

	describe('immediate clamp-down when targetRung > cap', () => {
		it('clamps to the cap, signals CAP, changed=true (score present)', () => {
			const r = decideFeedDownlink(withRung(2), 10, true, 0);
			expect(r.signal).toBe('CAP');
			expect(r.changed).toBe(true);
			expect(r.targetRung).toBe(0);
			expect(r.state.targetRung).toBe(0);
		});

		it('clamps even on an undefined (no-data) tick — a resize is not a network event', () => {
			const r = decideFeedDownlink(withRung(2), undefined, true, 1);
			expect(r.signal).toBe('CAP');
			expect(r.targetRung).toBe(1);
		});

		it('does NOT mutate cooldown/backoff/evidence on a ceiling clamp', () => {
			const before = withRung(2);
			const r = decideFeedDownlink(before, 10, true, 0);
			expect(r.state.cooldownLen).toBe(before.cooldownLen);
			expect(r.state.evidenceBuf).toEqual([]); // this tick's score was NOT pushed
			expect(r.state.cleanStreak).toBe(before.cleanStreak);
		});

		it('caps maxRung to TOP_RUNG: a maxRung above TOP_RUNG never lifts the ceiling', () => {
			const r = decideFeedDownlink(withRung(2), 10, true, 5);
			expect(r.signal).not.toBe('CAP');
			expect(r.targetRung).toBe(2);
		});
	});

	describe('UP is guarded by the cap', () => {
		it('never climbs above the cap no matter how many clean ticks', () => {
			// Start at rung 0, cap at 1: UP fires 0->1 once, then holds at 1 forever.
			const r = driveNMax(withRung(0), UP_SCORE + 1, true, COOLDOWN_MAX * 4, 1);
			expect(r.targetRung).toBe(1);
		});

		it('reaches the cap exactly (0 -> 1 with cap 1)', () => {
			const r = driveNMax(withRung(0), UP_SCORE + 1, true, COOLDOWN_BASE, 1);
			expect(r.targetRung).toBe(1);
			expect(r.signal).toBe('UP');
		});
	});

	describe('DOWN still works within the cap', () => {
		it('sheds below the cap on sustained freeze (rung 1, cap 1 -> rung 0)', () => {
			const r = driveNMax(withRung(1), 0, true, EVIDENCE_DOWN_N, 1);
			expect(r.signal).toBe('DOWN');
			expect(r.targetRung).toBe(0);
		});
	});
});
