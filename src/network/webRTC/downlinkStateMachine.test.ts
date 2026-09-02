/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { DownlinkSmState, initialDownlinkSmState, tickDownlinkSm } from './downlinkStateMachine';

// Inputs — caller derives these from the vote-buffer median windows (not from the local store).
const bad = { degraded: true, recovered: false }; // warnVote true AND quality being reduced
const good = { degraded: false, recovered: true }; // restoreVote true
const hold = { degraded: false, recovered: false }; // warnVote true but quality NOT being reduced, or neutral

// Feed `input` n times; return the LAST result.
function feed(
	state: DownlinkSmState,
	input: { degraded: boolean; recovered: boolean },
	n: number
): ReturnType<typeof tickDownlinkSm> {
	let r: ReturnType<typeof tickDownlinkSm> = { state };
	for (let i = 0; i < n; i += 1) r = tickDownlinkSm(r.state, input);
	return r;
}

describe('tickDownlinkSm (2-state flip — median windows replace streaks)', () => {
	it('starts ok', () => {
		expect(initialDownlinkSmState().committed).toBe('ok');
	});

	it('has no streak fields (they are gone — median windows in the caller provide confirmation)', () => {
		const s = initialDownlinkSmState();
		expect((s as Record<string, unknown>).badStreak).toBeUndefined();
		expect((s as Record<string, unknown>).goodStreak).toBeUndefined();
	});

	it('stays ok on a stable vote', () => {
		const { state, flippedTo } = tickDownlinkSm(initialDownlinkSmState(), good);
		expect(state.committed).toBe('ok');
		expect(flippedTo).toBeUndefined();
	});

	it('warns (yellow) on the FIRST degraded tick — no streak required here', () => {
		const r = tickDownlinkSm(initialDownlinkSmState(), bad);
		expect(r.state.committed).toBe('compromised');
		expect(r.flippedTo).toBe('compromised');
	});

	it('recovers (green) on the FIRST recovered tick after compromised', () => {
		const s = tickDownlinkSm(initialDownlinkSmState(), bad).state;
		expect(s.committed).toBe('compromised');
		const r = tickDownlinkSm(s, good);
		expect(r.flippedTo).toBe('ok');
		expect(r.state.committed).toBe('ok');
	});

	it('stays compromised as long as degraded keeps firing', () => {
		let s = tickDownlinkSm(initialDownlinkSmState(), bad).state;
		// Repeat bad — stays compromised, no redundant flip
		s = tickDownlinkSm(s, bad).state;
		s = tickDownlinkSm(s, bad).state;
		expect(s.committed).toBe('compromised');
	});

	it('stays ok as long as good keeps firing', () => {
		let s = initialDownlinkSmState();
		s = tickDownlinkSm(s, good).state;
		s = tickDownlinkSm(s, good).state;
		expect(s.committed).toBe('ok');
	});

	it('a hold tick (warnVote true but not floored) neither warns nor restores', () => {
		// while ok: hold does not warn
		let s = feed(initialDownlinkSmState(), hold, 10).state;
		expect(s.committed).toBe('ok');
		// while compromised: hold does not restore
		s = tickDownlinkSm(initialDownlinkSmState(), bad).state;
		s = feed(s, hold, 10).state;
		expect(s.committed).toBe('compromised');
	});

	it('flippedTo is only set on a transition, not on a repeat call in the same state', () => {
		// ok -> compromised on first bad
		const r1 = tickDownlinkSm(initialDownlinkSmState(), bad);
		expect(r1.flippedTo).toBe('compromised');
		// compromised + bad again -> no flip
		const r2 = tickDownlinkSm(r1.state, bad);
		expect(r2.flippedTo).toBeUndefined();
		// compromised -> ok on first good
		const r3 = tickDownlinkSm(r1.state, good);
		expect(r3.flippedTo).toBe('ok');
		// ok + good again -> no flip
		const r4 = tickDownlinkSm(r3.state, good);
		expect(r4.flippedTo).toBeUndefined();
	});

	it('oscillates correctly between ok and compromised on alternating ticks', () => {
		let s = initialDownlinkSmState();
		s = tickDownlinkSm(s, bad).state;
		expect(s.committed).toBe('compromised');
		s = tickDownlinkSm(s, good).state;
		expect(s.committed).toBe('ok');
		s = tickDownlinkSm(s, bad).state;
		expect(s.committed).toBe('compromised');
	});

	it('does not mutate the previous state', () => {
		const prev = initialDownlinkSmState();
		tickDownlinkSm(prev, bad);
		expect(prev.committed).toBe('ok');
	});
});
