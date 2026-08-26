/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import {
	CentralDownlinkState,
	decideDownlink,
	FPS_LOG_DELTA,
	initialCentralState,
	isReducedFramerate,
	layersOf,
	TOP_RUNG
} from './inboundQualityController';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const clean = { lossRate: 0, jbdRising: false };
const congested = { lossRate: 0.15, jbdRising: true };
const deadBand = { lossRate: 0.03, jbdRising: false };

function withFeeds(rungs: Record<string, number>): CentralDownlinkState {
	const state = initialCentralState();
	Object.entries(rungs).forEach(([key, rung]) => {
		state.feeds.set(key, { rung, ticksSinceChange: 0 });
	});
	return state;
}

function samples(
	map: Record<string, { lossRate: number; jbdRising: boolean }>
): Map<string, { lossRate: number; jbdRising: boolean }> {
	return new Map(Object.entries(map));
}

function oneTick(
	state: CentralDownlinkState,
	sampleMap: Record<string, { lossRate: number; jbdRising: boolean }>
): ReturnType<typeof decideDownlink> {
	return decideDownlink(state, samples(sampleMap));
}

/** Run n clean ticks over the given keys; returns final state. */
function nClean(state: CentralDownlinkState, keys: string[], n: number): CentralDownlinkState {
	return Array.from({ length: n }).reduce<CentralDownlinkState>((s) => {
		const sampleMap: Record<string, { lossRate: number; jbdRising: boolean }> = {};
		keys.forEach((k) => {
			sampleMap[k] = clean;
		});
		return decideDownlink(s, samples(sampleMap)).state;
	}, state);
}

// ---------------------------------------------------------------------------
// Utility exports
// ---------------------------------------------------------------------------

// rung <-> (substream, temporal) mapping — unchanged from the two-dimensional ladder.
test('layersOf maps rung to (substream, temporal target): resolution before framerate', () => {
	expect(layersOf(5)).toEqual({ substream: 2, temporal: 2 }); // best: 720, full fps
	expect(layersOf(4)).toEqual({ substream: 2, temporal: 0 }); // 720, base fps
	expect(layersOf(3)).toEqual({ substream: 1, temporal: 2 }); // 360, full fps
	expect(layersOf(2)).toEqual({ substream: 1, temporal: 0 }); // 360, base fps
	expect(layersOf(1)).toEqual({ substream: 0, temporal: 2 }); // 144, full fps
	expect(layersOf(0)).toEqual({ substream: 0, temporal: 0 }); // 144, base fps
});

test('isReducedFramerate is true only on the BASE (even) rungs', () => {
	expect(isReducedFramerate(5)).toBe(false);
	expect(isReducedFramerate(4)).toBe(true);
	expect(isReducedFramerate(3)).toBe(false);
	expect(isReducedFramerate(0)).toBe(true);
});

test('FPS_LOG_DELTA is exported as 5', () => {
	expect(FPS_LOG_DELTA).toBe(5);
});

// ---------------------------------------------------------------------------
// initialCentralState
// ---------------------------------------------------------------------------

test('initialCentralState starts with empty feeds and zeroed shared state', () => {
	const s = initialCentralState();
	expect(s.feeds.size).toBe(0);
	expect(s.cleanStreak).toBe(0);
	expect(s.failCount).toEqual([0, 0, 0, 0, 0]);
	expect(s.probing).toBeUndefined();
	expect(s.tick).toBe(0);
});

// ---------------------------------------------------------------------------
// DROP — highest-rung first
// ---------------------------------------------------------------------------

test('drops the HIGHEST-rung congested feed when only one is congested', () => {
	const state = withFeeds({ a: 5, b: 3 });
	const { change } = oneTick(state, { a: congested, b: clean });
	expect(change).toBeDefined();
	expect(change!.key).toBe('a');
	expect(change!.rung).toBe(4);
	expect(change!.fromRung).toBe(5);
});

test('with two congested feeds at different rungs, drops the higher rung', () => {
	const state = withFeeds({ lo: 2, hi: 4 });
	const { change } = oneTick(state, { lo: congested, hi: congested });
	expect(change!.key).toBe('hi');
	expect(change!.rung).toBe(3);
});

test('emits AT MOST ONE change per tick even when all feeds are congested', () => {
	const state = withFeeds({ a: 5, b: 4, c: 3 });
	const { state: next, change } = oneTick(state, {
		a: congested,
		b: congested,
		c: congested
	});
	expect(change).toBeDefined();
	expect(change!.key).toBe('a'); // highest rung dropped first
	// b and c are untouched.
	expect(next.feeds.get('b')!.rung).toBe(4);
	expect(next.feeds.get('c')!.rung).toBe(3);
});

test('congestion drops FRAMERATE first: rung 5 -> 4 stays substream 2, cuts temporal', () => {
	const state = withFeeds({ a: 5 });
	const { change } = oneTick(state, { a: congested });
	expect(change!.rung).toBe(4);
	expect(change!.changeSubstream).toBe(2);
	expect(change!.changeTemporal).toBe(0);
	expect(change!.substreamChanged).toBe(false);
});

test('RESOLUTION drops only after framerate exhausted: rung 4 -> 3 changes substream', () => {
	const state = withFeeds({ a: 4 });
	const { change } = oneTick(state, { a: congested });
	expect(change!.rung).toBe(3);
	expect(change!.changeSubstream).toBe(1);
	expect(change!.changeTemporal).toBe(2); // framerate restored at the lower resolution
	expect(change!.substreamChanged).toBe(true);
});

test('off is set when the lowest-rung feed is still congested', () => {
	const state = withFeeds({ a: 0 });
	const { change } = oneTick(state, { a: congested });
	expect(change!.off).toBe(true);
	expect(change!.rung).toBe(0);
});

// ---------------------------------------------------------------------------
// CLIMB — lowest-rung first, probe-locked
// ---------------------------------------------------------------------------

test('climbs the LOWEST eligible feed after UP_BASE (8) clean ticks', () => {
	const init = withFeeds({ lo: 2, hi: 4 });
	// 7 ticks gets cleanStreak to 7; the 8th tick (oneTick) triggers the climb.
	const state = nClean(init, ['lo', 'hi'], 7);
	const { change } = oneTick(state, { lo: clean, hi: clean });
	// lo (rung 2) should climb before hi (rung 4)
	expect(change!.key).toBe('lo');
	expect(change!.rung).toBe(3);
});

test('no climb while a probe is in flight (OBSERVE not elapsed)', () => {
	const init = withFeeds({ a: 2, b: 2 });
	// 7 ticks → cleanStreak=7; the 8th tick triggers the climb and sets the probe.
	const s0 = nClean(init, ['a', 'b'], 7);
	const { state: s1, change: c1 } = oneTick(s0, { a: clean, b: clean });
	expect(c1).toBeDefined();
	// Next tick: probe still in flight (1 tick < OBSERVE=4) — no new climb
	const { change: c2 } = oneTick(s1, { a: clean, b: clean });
	expect(c2).toBeUndefined();
});

test('probe confirmed after OBSERVE ticks: failCount decays, unlock allows next climb', () => {
	// failCount[2]=1 means boundary 2 needs 8*2^1=16 clean ticks.
	const init = withFeeds({ a: 2 });
	init.failCount[2] = 1;
	// 15 ticks → cleanStreak=15; the 16th tick (oneTick) triggers the climb.
	const s0 = nClean(init, ['a'], 15);
	// Climb happens; probe is set.
	const { state: s1, change: c1 } = oneTick(s0, { a: clean });
	expect(c1!.rung).toBe(3);
	expect(s1.probing).toBeDefined();
	// Tick OBSERVE-1=3 more clean ticks — probe still in flight.
	const s2 = nClean(s1, ['a'], 3);
	// One more clean tick (total OBSERVE=4): probe confirmed, failCount decays.
	const { state: s3, change: c3 } = oneTick(s2, { a: clean });
	expect(c3).toBeUndefined(); // no new climb on the confirming tick
	expect(s3.probing).toBeUndefined(); // probe cleared
	expect(s3.failCount[2]).toBe(0); // decayed from 1 → 0
});

// ---------------------------------------------------------------------------
// SHARED backoff
// ---------------------------------------------------------------------------

test('failed probe increments the SHARED failCount, visible to all feeds next tick', () => {
	// Start a clean streak, trigger a climb on the 8th tick, then drop within OBSERVE.
	const init = withFeeds({ a: 2, b: 3 });
	// 7 ticks → cleanStreak=7; 8th tick (oneTick) → climb 'a' (lowest rung).
	const s0 = nClean(init, ['a', 'b'], 7);
	const { state: s1, change: c1 } = oneTick(s0, { a: clean, b: clean });
	expect(c1!.key).toBe('a');
	const boundary = c1!.fromRung; // = 2
	// Drop within OBSERVE (1 tick after climb)
	const { state: s2 } = oneTick(s1, { a: congested, b: clean });
	// SHARED failCount at boundary 2 must be 1
	expect(s2.failCount[boundary]).toBe(1);
	expect(s2.probing).toBeUndefined();
});

test('shared backoff: after one failed probe, upNeed doubles for ALL feeds at that boundary', () => {
	// failCount[2]=1 means boundary 2 needs 8*2^1=16 clean ticks (instead of 8).
	const init = withFeeds({ a: 2, b: 2 });
	init.failCount[2] = 1;
	// 14 ticks → cleanStreak=14; tick 15 (oneTick) → cleanStreak=15 < 16 → no climb yet.
	const s0 = nClean(init, ['a', 'b'], 14);
	const { state: s15, change: noClimb } = oneTick(s0, { a: clean, b: clean });
	expect(noClimb).toBeUndefined(); // cleanStreak=15 < upNeed=16 → not eligible
	// Tick 16: cleanStreak=16 >= upNeed=16 → climb.
	const { change: climb } = oneTick(s15, { a: clean, b: clean });
	expect(climb).toBeDefined();
	expect(climb!.rung).toBe(3);
});

test('failCount caps at FAIL_MAX (5)', () => {
	const state = withFeeds({ a: 0 });
	state.failCount[0] = 5; // already at cap
	// Force a probe in-flight within OBSERVE so the drop triggers the penalty path.
	state.probing = { key: 'a', boundary: 0, tick: 0 };
	state.tick = 1; // drop at tick 2: tick 2 - probing.tick 0 = 1+1 <=4 within OBSERVE
	const { state: next } = oneTick(state, { a: congested });
	expect(next.failCount[0]).toBe(5); // must not exceed FAIL_MAX
});

// ---------------------------------------------------------------------------
// Dead band
// ---------------------------------------------------------------------------

test('dead band (2-5%) resets cleanStreak', () => {
	const init = withFeeds({ a: 2 });
	const { state: afterDeadBand } = oneTick(init, { a: deadBand });
	expect(afterDeadBand.cleanStreak).toBe(0);
	// 7 clean ticks after dead band: streak = 7 < UP_BASE=8 → no climb
	const s7 = nClean(afterDeadBand, ['a'], 7);
	const { change: noClimb } = oneTick(s7, { a: clean });
	// streak is now 8 on the 8th tick → climbs
	expect(noClimb).toBeDefined();
	expect(noClimb!.rung).toBe(3);
});

test('does not climb while jitter buffer is rising (jbdRising gating)', () => {
	let state = withFeeds({ a: 2 });
	Array.from({ length: 16 }).forEach(() => {
		({ state } = oneTick(state, { a: { lossRate: 0, jbdRising: true } }));
	});
	expect(state.feeds.get('a')!.rung).toBe(2);
});

test('does not rise above the best rung (TOP_RUNG)', () => {
	const init = withFeeds({ a: TOP_RUNG });
	const state = nClean(init, ['a'], 32);
	expect(state.feeds.get('a')!.rung).toBe(TOP_RUNG);
});

// ---------------------------------------------------------------------------
// Tick counter and state isolation
// ---------------------------------------------------------------------------

test('each call increments tick by 1', () => {
	const s0 = initialCentralState();
	const { state: s1 } = oneTick(s0, {});
	const { state: s2 } = oneTick(s1, {});
	expect(s1.tick).toBe(1);
	expect(s2.tick).toBe(2);
});

test('decideDownlink does not mutate the previous state', () => {
	const state = withFeeds({ a: 5 });
	const ticksBefore = state.tick;
	oneTick(state, { a: congested });
	expect(state.tick).toBe(ticksBefore);
	expect(state.feeds.get('a')!.rung).toBe(5);
});
