/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, it } from 'vitest';

import {
	CONFIRM_DOWN,
	CONFIRM_UP,
	computeDegradedSummary,
	initialDownlinkSmState,
	MIN_DWELL,
	tickDownlinkSm,
	TickInput
} from './downlinkStateMachine';

// ---------------------------------------------------------------------------
// computeDegradedSummary helpers
// ---------------------------------------------------------------------------

const noTier = (): number | undefined => undefined;
const tier = (n: number) => (): number => n;

describe('computeDegradedSummary', () => {
	it('returns no degradation when no feeds', () => {
		const s = computeDegradedSummary([], noTier);
		expect(s).toEqual({
			aggregateDegraded: false,
			anyFeedSuppressed: false,
			maxFailCountAtBoundary: 0
		});
	});

	it('consumed==published -> no degradation (no false snackbar)', () => {
		// rung=4 => substream=2, published=2
		const s = computeDegradedSummary(
			[{ userId: 'u1', suppressed: false, rung: 4, failCount: [0, 0, 0, 0, 0] }],
			tier(2)
		);
		expect(s.aggregateDegraded).toBe(false);
	});

	it('published=0 consumed=0 (rung=0 substream=0) -> no degradation', () => {
		const s = computeDegradedSummary(
			[{ userId: 'u1', suppressed: false, rung: 0, failCount: [0, 0, 0, 0, 0] }],
			tier(0)
		);
		expect(s.aggregateDegraded).toBe(false);
	});

	it('consumed(substream=1) < published(2) -> degraded, failCount propagated', () => {
		const failCount = [0, 0, 2, 0, 0];
		// rung=2 => substream=1
		const s = computeDegradedSummary(
			[{ userId: 'u1', suppressed: false, rung: 2, failCount }],
			tier(2)
		);
		expect(s.aggregateDegraded).toBe(true);
		expect(s.anyFeedSuppressed).toBe(false);
		expect(s.maxFailCountAtBoundary).toBe(2);
	});

	it('suppressed feed with defined published tier -> degraded + anyFeedSuppressed', () => {
		const s = computeDegradedSummary([{ userId: 'u1', suppressed: true }], tier(2));
		expect(s.aggregateDegraded).toBe(true);
		expect(s.anyFeedSuppressed).toBe(true);
	});

	it('suppressed feed with undefined published tier -> no degradation', () => {
		const s = computeDegradedSummary([{ userId: 'u1', suppressed: true }], noTier);
		expect(s.aggregateDegraded).toBe(false);
	});

	it('screenshare feed is excluded when not passed (structural guarantee)', () => {
		// Only webcam FeedSnapshots are built from videoReceivers; passing a screen entry
		// would degrade correctly, but the caller never passes screen feeds.
		// Verify: passing only a non-screen (webcam) feed that is not degraded -> no snackbar.
		const s = computeDegradedSummary(
			[{ userId: 'u1', suppressed: false, rung: 5, failCount: [0, 0, 0, 0, 0] }],
			tier(2) // rung5 substream=2 == published=2 -> not degraded
		);
		expect(s.aggregateDegraded).toBe(false);
	});

	it('pruned/off-screen feed excluded when not in feeds array (structural guarantee)', () => {
		// videoReceivers only contains on-screen feeds; pruned feeds are removed from it.
		// An empty feeds list (all pruned) -> no degradation.
		const s = computeDegradedSummary([], tier(2));
		expect(s.aggregateDegraded).toBe(false);
	});
});

// ---------------------------------------------------------------------------
// tickDownlinkSm
// ---------------------------------------------------------------------------

const okInput = (now: number): TickInput => ({
	aggregateDegraded: false,
	anyFeedSuppressed: false,
	maxFailCountAtBoundary: 0,
	now
});

const degradedInput = (
	now: number,
	opts: { suppressed?: boolean; failCount?: number } = {}
): TickInput => ({
	aggregateDegraded: true,
	anyFeedSuppressed: opts.suppressed ?? false,
	maxFailCountAtBoundary: opts.failCount ?? 0,
	now
});

describe('tickDownlinkSm', () => {
	it('starts as ok, no transition on clean tick', () => {
		const s = initialDownlinkSmState();
		const { state, flippedTo } = tickDownlinkSm(s, okInput(1000));
		expect(state.committed).toBe('ok');
		expect(flippedTo).toBeUndefined();
	});

	it('transient degradation shorter than CONFIRM_DOWN does not fire yellow', () => {
		let s = initialDownlinkSmState();
		// Tick degraded for CONFIRM_DOWN - 1 ms (no failCount, no suppression)
		s = tickDownlinkSm(s, degradedInput(1000)).state;
		s = tickDownlinkSm(s, degradedInput(1000 + CONFIRM_DOWN - 1)).state;
		expect(s.committed).toBe('ok');
	});

	it('degradation that clears before CONFIRM_DOWN does not fire yellow', () => {
		let s = initialDownlinkSmState();
		s = tickDownlinkSm(s, degradedInput(1000)).state;
		// recovers within confirm window
		const { state, flippedTo } = tickDownlinkSm(s, okInput(1000 + CONFIRM_DOWN / 2));
		expect(state.committed).toBe('ok');
		expect(flippedTo).toBeUndefined();
	});

	it('sustained degradation >= CONFIRM_DOWN fires yellow (dead-band backstop)', () => {
		let s = initialDownlinkSmState();
		s = tickDownlinkSm(s, degradedInput(1000)).state;
		const { flippedTo } = tickDownlinkSm(s, degradedInput(1000 + CONFIRM_DOWN));
		expect(flippedTo).toBe('compromised');
	});

	it('failCount >= 1 on degraded feed fast-paths to yellow without waiting CONFIRM_DOWN', () => {
		const s = initialDownlinkSmState();
		// failCount >= 1 confirms on the first degraded tick (no CONFIRM_DOWN wait needed)
		const { flippedTo } = tickDownlinkSm(s, degradedInput(1000, { failCount: 1 }));
		expect(flippedTo).toBe('compromised');
	});

	it('suppressed feed fast-paths to yellow without waiting CONFIRM_DOWN', () => {
		const s = initialDownlinkSmState();
		// suppressed feed confirms on the first degraded tick (no CONFIRM_DOWN wait needed)
		const { flippedTo } = tickDownlinkSm(s, degradedInput(1000, { suppressed: true }));
		expect(flippedTo).toBe('compromised');
	});

	it('confirmed degradation respects MIN_DWELL on the first snackbar (initial state clears it)', () => {
		// initialDownlinkSmState sets lastFlipAt=-MIN_DWELL so 0-(-MIN_DWELL)>=MIN_DWELL
		const s = initialDownlinkSmState();
		const { flippedTo } = tickDownlinkSm(s, degradedInput(0, { failCount: 1 }));
		expect(flippedTo).toBe('compromised');
	});

	it('recovery -> green after CONFIRM_UP when MIN_DWELL has elapsed since yellow', () => {
		// Step 1: fire yellow
		let s = initialDownlinkSmState();
		const { state: compromisedState } = tickDownlinkSm(s, degradedInput(0, { suppressed: true }));
		s = compromisedState;
		expect(s.committed).toBe('compromised');

		// Step 2: degradation clears, okSince = MIN_DWELL (= lastFlipAt + MIN_DWELL -> both pass)
		const okAt = MIN_DWELL;
		s = tickDownlinkSm(s, okInput(okAt)).state;
		expect(s.committed).toBe('compromised'); // CONFIRM_UP not elapsed yet

		// Step 3: CONFIRM_UP elapsed, MIN_DWELL also elapsed -> green
		const { flippedTo } = tickDownlinkSm(s, okInput(okAt + CONFIRM_UP));
		expect(flippedTo).toBe('ok');
	});

	it('MIN_DWELL blocks a second snackbar within 64 s of the first', () => {
		// fire yellow at T=0
		let s = initialDownlinkSmState();
		({ state: s } = tickDownlinkSm(s, degradedInput(0, { suppressed: true })));
		expect(s.committed).toBe('compromised');

		// clear degradation at T=1000, CONFIRM_UP=6s so okSince+CONFIRM_UP=7000, MIN_DWELL=64s -> blocked
		s = tickDownlinkSm(s, okInput(1000)).state;
		s = tickDownlinkSm(s, okInput(1000 + CONFIRM_UP + 1)).state;
		// MIN_DWELL not elapsed: still compromised
		expect(s.committed).toBe('compromised');

		// at T=MIN_DWELL + CONFIRM_UP + 1 green fires
		const { flippedTo } = tickDownlinkSm(s, okInput(MIN_DWELL + CONFIRM_UP + 1));
		expect(flippedTo).toBe('ok');
	});

	it('MIN_DWELL blocks a second yellow within 64 s of the green', () => {
		// fire yellow, then green, then try yellow again within MIN_DWELL of green
		let s = initialDownlinkSmState();
		({ state: s } = tickDownlinkSm(s, degradedInput(0, { suppressed: true })));
		// force to ok by advancing past both MIN_DWELL and CONFIRM_UP
		const greenAt = MIN_DWELL + CONFIRM_UP;
		s = tickDownlinkSm(s, okInput(MIN_DWELL)).state;
		({ state: s } = tickDownlinkSm(s, okInput(greenAt)));
		expect(s.committed).toBe('ok');

		// try to trigger yellow again 1ms after green -> MIN_DWELL not elapsed
		s = tickDownlinkSm(s, degradedInput(greenAt + 1, { failCount: 1 })).state;
		expect(s.committed).toBe('ok');

		// at greenAt + MIN_DWELL it goes through
		s = tickDownlinkSm(s, degradedInput(greenAt + MIN_DWELL - 1, { failCount: 1 })).state;
		expect(s.committed).toBe('ok'); // still 1ms short
		const { flippedTo } = tickDownlinkSm(s, degradedInput(greenAt + MIN_DWELL, { failCount: 1 }));
		expect(flippedTo).toBe('compromised');
	});

	it('no transition emitted for intra-compromised changes (degraded stays degraded)', () => {
		let s = initialDownlinkSmState();
		({ state: s } = tickDownlinkSm(s, degradedInput(0, { suppressed: true })));
		expect(s.committed).toBe('compromised');

		// tick again with still-degraded: no flip
		const { flippedTo } = tickDownlinkSm(s, degradedInput(1000));
		expect(flippedTo).toBeUndefined();
	});

	it('degradedSince resets when degradation clears transiently then re-starts', () => {
		let s = initialDownlinkSmState();
		s = tickDownlinkSm(s, degradedInput(1000)).state;
		expect(s.degradedSince).toBe(1000);

		// clear
		s = tickDownlinkSm(s, okInput(2000)).state;
		expect(s.degradedSince).toBe(0);

		// re-degrade
		s = tickDownlinkSm(s, degradedInput(3000)).state;
		expect(s.degradedSince).toBe(3000);
	});
});
