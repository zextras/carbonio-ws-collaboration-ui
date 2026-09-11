/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import {
	CentralDownlinkState,
	COOLDOWN_BASE,
	COOLDOWN_MAX,
	decideDownlink,
	EVIDENCE_DOWN_M,
	EVIDENCE_DOWN_N,
	EVIDENCE_UP_M,
	EVIDENCE_UP_N,
	initialCentralState,
	RESET_STABLE,
	TOP_RUNG
} from './inboundQualityController';

// Drive n ticks of a constant dlScore; return the last result.
function driveN(
	state: CentralDownlinkState,
	dlScore: number,
	n: number
): ReturnType<typeof decideDownlink> {
	let r: ReturnType<typeof decideDownlink> = {
		state,
		targetRung: state.targetRung,
		changed: false,
		signal: 'HOLD'
	};
	for (let i = 0; i < n; i += 1) r = decideDownlink(r.state, dlScore);
	return r;
}

// Drive EVIDENCE_DOWN_N ticks of score 0 — enough to trigger DOWN from an empty evidenceBuf.
function driveDown(state: CentralDownlinkState): ReturnType<typeof decideDownlink> {
	return driveN(state, 0, EVIDENCE_DOWN_N);
}

// Drive EVIDENCE_UP_N ticks of score 10 — enough to trigger UP from an empty evidenceBuf.
function driveUp(state: CentralDownlinkState): ReturnType<typeof decideDownlink> {
	return driveN(state, 10, EVIDENCE_UP_N);
}

// Return a state with a specific targetRung (other fields at sensible defaults so no gate fires).
function withRung(rung: number): CentralDownlinkState {
	const s = initialCentralState();
	s.targetRung = rung;
	return s;
}

test('initialCentralState shape: targetRung=TOP_RUNG, tick=0, empty evidence, cooldown at base', () => {
	const s = initialCentralState();
	expect(s.targetRung).toBe(TOP_RUNG);
	expect(s.tick).toBe(0);
	expect(s.evidenceBuf).toEqual([]);
	expect(s.cooldownLen).toBe(COOLDOWN_BASE);
	expect(s.upBlockedFor).toBe(0);
	// ticksSinceUp/Down start high enough that no gate fires immediately.
	expect(s.ticksSinceUp).toBeGreaterThan(COOLDOWN_MAX);
	expect(s.ticksSinceDown).toBeGreaterThan(RESET_STABLE - 1);
});

test('TOP_RUNG is 2', () => {
	expect(TOP_RUNG).toBe(2);
});

test('EVIDENCE thresholds: DOWN 4/5, UP 9/10', () => {
	expect(EVIDENCE_DOWN_N).toBe(4);
	expect(EVIDENCE_DOWN_M).toBe(5);
	expect(EVIDENCE_UP_N).toBe(9);
	expect(EVIDENCE_UP_M).toBe(10);
});

test('COOLDOWN_BASE is 8, COOLDOWN_MAX is 32, RESET_STABLE is 32', () => {
	expect(COOLDOWN_BASE).toBe(8);
	expect(COOLDOWN_MAX).toBe(32);
	expect(RESET_STABLE).toBe(32);
});

test('each call increments tick and does not mutate the previous state', () => {
	const s0 = initialCentralState();
	const before = s0.tick;
	const { state: s1 } = decideDownlink(s0, 0);
	expect(s1.tick).toBe(1);
	expect(s0.tick).toBe(before);
	expect(s0.evidenceBuf).toHaveLength(0);
});

test('DOWN does NOT fire after 3 consecutive low-score (0) ticks — gate requires 4', () => {
	const s = withRung(2);
	const r3 = driveN(s, 0, EVIDENCE_DOWN_N - 1);
	expect(r3.changed).toBe(false);
	expect(r3.signal).toBe('HOLD');
	expect(r3.targetRung).toBe(2);
});

test('DOWN fires on the 4th consecutive low-score tick: targetRung 2->1, signal DOWN, changed true', () => {
	const s = withRung(2);
	const r3 = driveN(s, 0, EVIDENCE_DOWN_N - 1);
	const r4 = decideDownlink(r3.state, 0);
	expect(r4.changed).toBe(true);
	expect(r4.signal).toBe('DOWN');
	expect(r4.targetRung).toBe(1);
	expect(r4.state.targetRung).toBe(1);
});

test('DOWN fires again after 4 more low ticks (evidence reset): targetRung 1->0', () => {
	const s = withRung(2);
	const { state: after1 } = driveDown(s);
	expect(after1.targetRung).toBe(1);
	expect(after1.evidenceBuf).toEqual([]); // reset after the step
	const { state: after2, signal, changed } = driveDown(after1);
	expect(changed).toBe(true);
	expect(signal).toBe('DOWN');
	expect(after2.targetRung).toBe(0);
});

test('at floor (rung 0) further low scores produce HOLD, changed false — no AUTO-OFF, no off rung', () => {
	const s = withRung(0);
	const r = driveDown(s);
	expect(r.changed).toBe(false);
	expect(r.signal).toBe('HOLD');
	expect(r.targetRung).toBe(0);
});

test('evidence resets after DOWN: 3 low ticks right after do not fire another DOWN', () => {
	const s = withRung(2);
	const { state: after1 } = driveDown(s);
	// Only 3 more low ticks — not enough for a second DOWN (needs 4).
	const r = driveN(after1, 0, EVIDENCE_DOWN_N - 1);
	expect(r.changed).toBe(false);
	expect(r.signal).toBe('HOLD');
	expect(r.targetRung).toBe(1);
});

test('UP does NOT fire after 8 consecutive high-score (10) ticks — gate requires 9', () => {
	const s = withRung(1);
	const r8 = driveN(s, 10, EVIDENCE_UP_N - 1);
	expect(r8.changed).toBe(false);
	expect(r8.signal).toBe('HOLD');
	expect(r8.targetRung).toBe(1);
});

test('UP fires on the 9th consecutive high-score tick: targetRung 1->2, signal UP, changed true', () => {
	const s = withRung(1);
	const r8 = driveN(s, 10, EVIDENCE_UP_N - 1);
	const r9 = decideDownlink(r8.state, 10);
	expect(r9.changed).toBe(true);
	expect(r9.signal).toBe('UP');
	expect(r9.targetRung).toBe(2);
});

test('UP fires from rung 0 to rung 1', () => {
	const s = withRung(0);
	const { state, signal, changed, targetRung } = driveUp(s);
	expect(changed).toBe(true);
	expect(signal).toBe('UP');
	expect(targetRung).toBe(1);
	expect(state.targetRung).toBe(1);
});

test('at TOP_RUNG (2) further high scores produce HOLD, changed false', () => {
	const s = withRung(TOP_RUNG);
	const r = driveUp(s);
	expect(r.changed).toBe(false);
	expect(r.signal).toBe('HOLD');
	expect(r.targetRung).toBe(TOP_RUNG);
});

test('neutral score 5 never triggers DOWN (threshold is score < 5)', () => {
	const s = withRung(2);
	const { changed, signal } = driveN(s, 5, 20);
	expect(changed).toBe(false);
	expect(signal).toBe('HOLD');
});

test('neutral scores 6 and 9 never trigger UP (threshold is score > 9)', () => {
	[6, 9].forEach((score) => {
		const s = withRung(1);
		const { changed, signal } = driveN(s, score, 20);
		expect(changed).toBe(false);
		expect(signal).toBe('HOLD');
	});
});

test('DOWN is never blocked by cooldown — fires even when upBlockedFor equals COOLDOWN_MAX', () => {
	const s = withRung(2);
	s.upBlockedFor = COOLDOWN_MAX;
	const { changed, signal, targetRung } = driveDown(s);
	expect(changed).toBe(true);
	expect(signal).toBe('DOWN');
	expect(targetRung).toBe(1);
});

test('UP is blocked while upBlockedFor > 0', () => {
	const s = withRung(1);
	s.upBlockedFor = COOLDOWN_MAX;
	const { changed, signal } = driveUp(s);
	expect(changed).toBe(false);
	expect(signal).toBe('HOLD');
});

test('first failed climb (UP then DOWN inside cooldown window): cooldownLen doubles 8->16, upBlockedFor=16', () => {
	// Start at rung 1 so both UP and subsequent DOWN can happen.
	const { state: afterUp } = driveUp(withRung(1));
	expect(afterUp.ticksSinceUp).toBe(0);
	expect(afterUp.cooldownLen).toBe(COOLDOWN_BASE); // not yet changed

	const { state: afterDown } = driveDown(afterUp); // DOWN within 4 ticks of UP
	expect(afterDown.cooldownLen).toBe(16);
	expect(afterDown.upBlockedFor).toBe(16);
});

test('first failed climb result detail: signal DOWN, changed true', () => {
	const { state: afterUp } = driveUp(withRung(1));
	const result = driveDown(afterUp);
	expect(result.signal).toBe('DOWN');
	expect(result.changed).toBe(true);
});

test('second failed climb doubles cooldownLen 16->32 (capped at COOLDOWN_MAX)', () => {
	// First failed climb → cooldownLen=16, upBlockedFor=16.
	let s = withRung(1);
	({ state: s } = driveUp(s));
	({ state: s } = driveDown(s));
	expect(s.cooldownLen).toBe(16);

	// Drain the block with hold ticks (score=5 → HOLD).
	s = driveN(s, 5, 16).state;
	expect(s.upBlockedFor).toBe(0);

	// Second UP from rung 1 (DOWN lowered us back to 1 from 2).
	expect(s.targetRung).toBe(1);
	({ state: s } = driveUp(s));
	// Second DOWN — second failed climb.
	({ state: s } = driveDown(s));
	expect(s.cooldownLen).toBe(32);
	expect(s.upBlockedFor).toBe(32);
});

test('cooldownLen caps at COOLDOWN_MAX: doubling at cap stays at cap', () => {
	const s = withRung(2);
	s.cooldownLen = COOLDOWN_MAX;
	s.ticksSinceUp = 0; // simulate very recent UP so FAILED CLIMB triggers
	s.ticksSinceDown = 0; // recent DOWN, so stability-reset (needs >= RESET_STABLE) does not fire
	const { state } = driveDown(s);
	expect(state.cooldownLen).toBe(COOLDOWN_MAX);
	expect(state.upBlockedFor).toBe(COOLDOWN_MAX);
});

test('cascade: only the FIRST DOWN after an UP counts as a failed climb (ticksSinceUp reset after first)', () => {
	// Start at rung 1, UP → rung 2, ticksSinceUp=0.
	let s = withRung(1);
	({ state: s } = driveUp(s));
	// First DOWN: failed climb → cooldownLen 8→16, ticksSinceUp reset to COOLDOWN_MAX+1.
	({ state: s } = driveDown(s));
	expect(s.cooldownLen).toBe(16);
	const clAfterFirst = s.cooldownLen;
	// Second DOWN: ticksSinceUp is now COOLDOWN_MAX+1 > cooldownLen → no re-doubling.
	({ state: s } = driveDown(s));
	expect(s.cooldownLen).toBe(clAfterFirst); // still 16, not 32
});

test('cooldownLen resets to COOLDOWN_BASE after RESET_STABLE ticks without DOWN', () => {
	// Trigger a failed climb to raise cooldownLen to 16.
	let s = withRung(1);
	({ state: s } = driveUp(s));
	({ state: s } = driveDown(s));
	expect(s.cooldownLen).toBe(16);

	// Feed RESET_STABLE hold ticks; ticksSinceDown reaches RESET_STABLE and resets cooldown.
	s = driveN(s, 5, RESET_STABLE).state;
	expect(s.cooldownLen).toBe(COOLDOWN_BASE);
	expect(s.upBlockedFor).toBe(0);
});

test('upBlockedFor drains tick by tick and UP resumes once it reaches 0', () => {
	let s = withRung(1);
	({ state: s } = driveUp(s)); // UP → rung 2
	({ state: s } = driveDown(s)); // DOWN → rung 1, upBlockedFor=16
	expect(s.upBlockedFor).toBe(16);

	// Drain 15 hold ticks → upBlockedFor=1.
	s = driveN(s, 5, 15).state;
	expect(s.upBlockedFor).toBe(1);

	// One more hold tick → upBlockedFor=0.
	s = driveN(s, 5, 1).state;
	expect(s.upBlockedFor).toBe(0);

	// UP can now fire.
	const { changed, signal } = driveUp(s);
	expect(changed).toBe(true);
	expect(signal).toBe('UP');
});

test('UP in initial state (upBlockedFor=0 by default) succeeds immediately after enough high ticks', () => {
	const s = withRung(0); // rung 0 so UP has room
	const { changed, signal } = driveUp(s);
	expect(changed).toBe(true);
	expect(signal).toBe('UP');
});

test('evidenceBuf resets to [] after UP', () => {
	const s = withRung(0);
	const { state } = driveUp(s);
	expect(state.evidenceBuf).toEqual([]);
});

test('evidenceBuf resets to [] after DOWN', () => {
	const s = withRung(2);
	const { state } = driveDown(s);
	expect(state.evidenceBuf).toEqual([]);
});

describe('loss-blind ticks (undefined dlScore) — old-browser / masked / thin-video safety', () => {
	it('a single undefined tick HOLDs, does not move the rung, and pushes no evidence', () => {
		const s = initialCentralState();
		const { state, targetRung, changed, signal } = decideDownlink(s, undefined);
		expect(signal).toBe('HOLD');
		expect(changed).toBe(false);
		expect(targetRung).toBe(TOP_RUNG);
		expect(state.evidenceBuf).toEqual([]); // no evidence contributed on a blind tick
		expect(state.tick).toBe(1); // timers still advance
	});

	it('never moves the webcam when downlink loss is permanently unmeasurable (stays at TOP_RUNG)', () => {
		let s = initialCentralState();
		for (let i = 0; i < 100; i += 1) {
			const r = decideDownlink(s, undefined);
			s = r.state;
			expect(r.changed).toBe(false);
		}
		expect(s.targetRung).toBe(TOP_RUNG);
		expect(s.evidenceBuf).toEqual([]);
	});

	it('undefined ticks still advance the backoff timers (cooldown drains after enough quiet ticks)', () => {
		let s: CentralDownlinkState = {
			...initialCentralState(),
			cooldownLen: COOLDOWN_MAX,
			upBlockedFor: COOLDOWN_MAX,
			ticksSinceDown: 0
		};
		for (let i = 0; i < RESET_STABLE + 1; i += 1) s = decideDownlink(s, undefined).state;
		expect(s.cooldownLen).toBe(COOLDOWN_BASE);
		expect(s.upBlockedFor).toBe(0);
	});

	it('an undefined tick between real readings neither resets nor pollutes the evidence window', () => {
		// 3 low readings (not enough for DOWN 4/5), one blind tick (no push), then a 4th low reading:
		// DOWN still fires on the four REAL readings — the blind tick contributed nothing.
		let s = initialCentralState();
		s = decideDownlink(s, 0).state;
		s = decideDownlink(s, 0).state;
		s = decideDownlink(s, 0).state;
		s = decideDownlink(s, undefined).state;
		const r = decideDownlink(s, 0);
		expect(r.signal).toBe('DOWN');
		expect(r.targetRung).toBe(TOP_RUNG - 1);
	});
});
