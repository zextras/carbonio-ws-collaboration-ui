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
	FPS_FLOOR,
	initialCentralState,
	initialFeedState,
	layersOf,
	RESET_STABLE,
	TOP_RUNG
} from './inboundQualityController';

// Build a state with the given global targetRung and per-feed initial rungs.
// feedRungs maps key → initial effective rung (for bootstrapping test states).
function withFeeds(targetRung: number, feedRungs: Record<string, number>): CentralDownlinkState {
	const state = initialCentralState();
	state.targetRung = targetRung;
	Object.entries(feedRungs).forEach(([key, rung]) => {
		state.feeds.set(key, initialFeedState(rung));
	});
	return state;
}

// senderMax map helper.
function senderMax(map: Record<string, number>): Map<string, number> {
	return new Map(Object.entries(map));
}

// fps map helper: default all feeds to 30 (framerate step lands at 15 >= FPS_FLOOR).
function fps(map: Record<string, number>): Map<string, number> {
	return new Map(Object.entries(map));
}

function tick(
	state: CentralDownlinkState,
	bars: number,
	fpsMap: Record<string, number> = {},
	senderMaxMap: Record<string, number> = {}
): ReturnType<typeof decideDownlink> {
	const keys = Array.from(state.feeds.keys());
	const full: Record<string, number> = {};
	keys.forEach((k) => {
		full[k] = fpsMap[k] ?? 30;
	});
	return decideDownlink(state, fps(full), bars, senderMax(senderMaxMap));
}

// Feed `bars` n times; return the LAST result.
function repeat(
	state: CentralDownlinkState,
	bars: number,
	n: number,
	fpsMap: Record<string, number> = {},
	senderMaxMap: Record<string, number> = {}
): ReturnType<typeof decideDownlink> {
	let r: ReturnType<typeof decideDownlink> = { state, changes: [] };
	for (let i = 0; i < n; i += 1) r = tick(r.state, bars, fpsMap, senderMaxMap);
	return r;
}

// Drive enough poor ticks to trigger DOWN (EVIDENCE_DOWN_N poor in last EVIDENCE_DOWN_M).
// With an empty evidenceBuf, EVIDENCE_DOWN_N consecutive poor bars suffices.
function driveDown(
	state: CentralDownlinkState,
	fpsMap: Record<string, number> = {},
	senderMaxMap: Record<string, number> = {}
): ReturnType<typeof decideDownlink> {
	return repeat(state, 0, EVIDENCE_DOWN_N, fpsMap, senderMaxMap);
}

// Drive enough optimal ticks to trigger UP (EVIDENCE_UP_N optimal in last EVIDENCE_UP_M).
// With an empty evidenceBuf, EVIDENCE_UP_N consecutive optimal bars suffices.
function driveUp(
	state: CentralDownlinkState,
	senderMaxMap: Record<string, number> = {}
): ReturnType<typeof decideDownlink> {
	return repeat(state, 5, EVIDENCE_UP_N, {}, senderMaxMap);
}

test('layersOf maps rung to (substream, temporal target): base = mid temporal layer, never quarter', () => {
	expect(layersOf(5)).toEqual({ substream: 2, temporal: 2 }); // 720 full
	expect(layersOf(4)).toEqual({ substream: 2, temporal: 1 }); // 720 ~half
	expect(layersOf(3)).toEqual({ substream: 1, temporal: 2 }); // 360 full
	expect(layersOf(2)).toEqual({ substream: 1, temporal: 1 }); // 360 ~half
	expect(layersOf(1)).toEqual({ substream: 0, temporal: 2 }); // 144 full
	expect(layersOf(0)).toEqual({ substream: 0, temporal: 1 }); // 144 ~half
	[0, 1, 2, 3, 4, 5].forEach((r) => expect(layersOf(r).temporal).not.toBe(0));
});

test('FPS_FLOOR is 14', () => {
	expect(FPS_FLOOR).toBe(14);
});

test('EVIDENCE thresholds: DOWN 3/4, UP 7/8', () => {
	expect(EVIDENCE_DOWN_N).toBe(3);
	expect(EVIDENCE_DOWN_M).toBe(4);
	expect(EVIDENCE_UP_N).toBe(7);
	expect(EVIDENCE_UP_M).toBe(8);
});

test('initialCentralState starts with targetRung=TOP_RUNG, allAutoOff=false, empty evidence', () => {
	const s = initialCentralState();
	expect(s.feeds.size).toBe(0);
	expect(s.tick).toBe(0);
	expect(s.targetRung).toBe(TOP_RUNG);
	expect(s.allAutoOff).toBe(false);
	expect(s.evidenceBuf).toEqual([]);
	expect(s.cooldownLen).toBe(COOLDOWN_BASE);
	expect(s.upBlockedFor).toBe(0);
	// Old streak fields are gone — median windows + evidence tracker replace them.
	expect((s as Record<string, unknown>).badVoteStreak).toBeUndefined();
	expect((s as Record<string, unknown>).goodVoteStreak).toBeUndefined();
});

test('DOWN fires after 3 consecutive poor bars, NOT before (evidence gate)', () => {
	const s = withFeeds(TOP_RUNG, { a: TOP_RUNG });
	// 2 poor bars: evidenceBuf=[0,0] — atLeast(3,4,b<=2) checks 2 entries → 2<3 → no fire
	const r2 = repeat(s, 0, 2);
	expect(r2.changes).toHaveLength(0);
	// 3rd poor bar: evidenceBuf=[0,0,0] → 3 of 3 satisfy ≤2 → DOWN fires
	const r3 = tick(r2.state, 0);
	expect(r3.changes.length).toBeGreaterThan(0);
	expect(r3.changes[0].key).toBe('a');
	expect(r3.changes[0].fromRung).toBe(TOP_RUNG);
	expect(r3.changes[0].rung).toBe(TOP_RUNG - 1);
});

test('DOWN lowers the global targetRung, applying to ALL feeds at once', () => {
	// Two feeds at targetRung=5. DOWN fires → both step to 4.
	const s = withFeeds(5, { a: 5, b: 5 });
	const { state, changes } = driveDown(s);
	expect(state.targetRung).toBe(4);
	expect(changes).toHaveLength(2);
	const keys = changes.map((c) => c.key).sort();
	expect(keys).toEqual(['a', 'b']);
	changes.forEach((c) => {
		expect(c.fromRung).toBe(5);
		expect(c.rung).toBe(4);
	});
});

test('(b) global-tier lowering: senderCapped feed stays when effective rung does not change', () => {
	// Feed 'a': no senderMax → effectiveRung = targetRung. Rung 5 → 4 on DOWN.
	// Feed 'b': senderMax=2 → effectiveRung = min(targetRung, 2). min(5,2)=2 → min(4,2)=2 → no change.
	const s = withFeeds(5, { a: 5, b: 2 });
	const { state, changes } = driveDown(s, {}, { b: 2 });
	expect(state.targetRung).toBe(4);
	// Only feed 'a' changed (5→4); feed 'b' stayed at 2.
	expect(changes).toHaveLength(1);
	expect(changes[0].key).toBe('a');
	expect(changes[0].fromRung).toBe(5);
	expect(changes[0].rung).toBe(4);
	// Feed b's effective rung is still 2 in the state.
	expect(s.feeds.get('b')!.rung).toBe(2);
});

test('(c) rung-evidence reset prevents cascade: second DOWN requires fresh post-change poor votes', () => {
	// After DOWN fires, evidenceBuf is reset. The next DOWN needs a fresh 3-poor-of-4 window.
	// This ensures stale pre-change votes cannot cascade to over-shoot.
	const s = withFeeds(5, { a: 5 });

	// First DOWN: 3 poor ticks → targetRung 5→4, evidenceBuf reset.
	const r1 = driveDown(s);
	expect(r1.state.targetRung).toBe(4);
	expect(r1.changes).toHaveLength(1);
	expect(r1.state.evidenceBuf).toEqual([]); // reset after change

	// Only 2 more poor ticks (evidenceBuf=[0,0]) → DOWN should NOT fire yet.
	const r2 = repeat(r1.state, 0, 2);
	expect(r2.changes).toHaveLength(0); // still at targetRung 4
	expect(r2.state.targetRung).toBe(4);

	// 3rd poor tick → evidenceBuf=[0,0,0] → atLeast(3,4,b<=2) = true → DOWN fires again.
	const r3 = tick(r2.state, 0);
	expect(r3.changes).toHaveLength(1);
	expect(r3.state.targetRung).toBe(3);
});

test('a hold tick (bars=3) after a down-evidence accumulation resets nothing', () => {
	// 2 poor ticks + 1 hold tick: evidenceBuf=[0,0,3] — last 4 has 2 poor, DOWN should not fire.
	const s = withFeeds(5, { a: 5 });
	const r = repeat(s, 0, 2);
	expect(r.changes).toHaveLength(0);
	const r2 = tick(r.state, 3);
	expect(r2.changes).toHaveLength(0);
});

test('congestion drops FRAMERATE first: rung 5 -> 4 keeps substream 2, cuts temporal', () => {
	const s = withFeeds(5, { a: 5 });
	const { changes } = driveDown(s);
	expect(changes[0].changeSubstream).toBe(2);
	expect(changes[0].changeTemporal).toBe(1);
	expect(changes[0].substreamChanged).toBe(false);
});

test('RESOLUTION drops only after framerate exhausted: rung 4 -> 3 changes substream', () => {
	const s = withFeeds(4, { a: 4 });
	const { changes } = driveDown(s);
	expect(changes[0].rung).toBe(3);
	expect(changes[0].changeSubstream).toBe(1);
	expect(changes[0].changeTemporal).toBe(2);
	expect(changes[0].substreamChanged).toBe(true);
});

test('FPS floor: a global framerate step whose result < FPS_FLOOR skips to a resolution step', () => {
	// targetRung=5, fps=24 -> base would be 12 fps (< 14) -> global step goes to rung 3 (360 full).
	const s = withFeeds(5, { a: 5 });
	const { changes, state } = driveDown(s, { a: 24 });
	expect(state.targetRung).toBe(3);
	expect(changes[0].rung).toBe(3);
	expect(changes[0].substreamChanged).toBe(true);
	expect(changes[0].changeTemporal).toBe(2);
});

test('at floor (targetRung=0) + DOWN → AUTO-OFF all feeds', () => {
	const s = withFeeds(0, { a: 0 });
	const { state, changes } = driveDown(s);
	expect(state.allAutoOff).toBe(true);
	expect(state.targetRung).toBe(0);
	expect(changes).toHaveLength(1);
	expect(changes[0].off).toBe(true);
	expect(changes[0].key).toBe('a');
});

test('while allAutoOff=true, DOWN fires no additional change', () => {
	const s = withFeeds(0, { a: 0 });
	const { state: afterOff } = driveDown(s);
	expect(afterOff.allAutoOff).toBe(true);
	// Another 3 poor ticks while auto-off: no change emitted (already off).
	const { changes } = driveDown(afterOff);
	expect(changes).toHaveLength(0);
});

test('UP fires after 7 consecutive optimal bars, NOT before', () => {
	const s = withFeeds(2, { a: 2 });
	// 6 optimal bars: atLeast(7,8,...) checks 6 entries → 6<7 → no fire
	const r6 = repeat(s, 5, 6);
	expect(r6.changes).toHaveLength(0);
	// 7th optimal bar → fires
	const r7 = tick(r6.state, 5);
	expect(r7.changes.length).toBeGreaterThan(0);
	expect(r7.changes[0].key).toBe('a');
	expect(r7.changes[0].rung).toBe(3);
});

test('UP climbs ALL feeds one rung at once', () => {
	const s = withFeeds(2, { a: 2, b: 2 });
	const { state, changes } = driveUp(s);
	expect(state.targetRung).toBe(3);
	expect(changes).toHaveLength(2);
	changes.forEach((c) => expect(c.rung).toBe(3));
});

test('UP from AUTO-OFF: re-enables all feeds at rung 1 (targetRung goes from 0 to 1)', () => {
	const s = withFeeds(0, { a: 0 });
	const { state: offState } = driveDown(s);
	expect(offState.allAutoOff).toBe(true);
	const { state: onState, changes } = driveUp(offState);
	expect(onState.allAutoOff).toBe(false);
	expect(onState.targetRung).toBe(1);
	expect(changes).toHaveLength(1);
	expect(changes[0].rung).toBe(1);
});

test('does not climb above TOP_RUNG', () => {
	const s = withFeeds(TOP_RUNG, { a: TOP_RUNG });
	// Even after 7 optimal bars, UP cannot go above TOP_RUNG (no feeds below it).
	const { changes } = driveUp(s);
	expect(changes).toHaveLength(0);
});

test('UP blocked by cooldown: no change while upBlockedFor > 0', () => {
	const s = withFeeds(2, { a: 2 });
	// Trigger a failed climb to raise upBlockedFor.
	const { state: afterUp } = driveUp(s);
	const { state: blocked } = driveDown(afterUp);
	expect(blocked.upBlockedFor).toBeGreaterThan(0);
	// Now try UP again: blocked → no change.
	const { changes } = driveUp(blocked);
	expect(changes).toHaveLength(0);
});

test('hold (bars=3, medium) accumulates no DOWN or UP evidence that fires', () => {
	const s = withFeeds(3, { a: 3 });
	// 20 hold ticks: evidenceBuf fills with 3s — atLeast(3,4,b<=2) fails (3>2), atLeast(7,8,b===5) fails.
	const { changes } = repeat(s, 3, 20);
	expect(changes).toHaveLength(0);
});

test('each call increments tick and does not mutate the previous state', () => {
	const s0 = withFeeds(5, { a: 5 });
	const before = s0.tick;
	const { state: s1 } = tick(s0, 0);
	expect(s1.tick).toBe(1);
	expect(s0.tick).toBe(before);
	expect(s0.feeds.get('a')!.rung).toBe(5); // original untouched
});

test('COOLDOWN_BASE is 8, COOLDOWN_MAX is 32, RESET_STABLE is 32', () => {
	expect(COOLDOWN_BASE).toBe(8);
	expect(COOLDOWN_MAX).toBe(32);
	expect(RESET_STABLE).toBe(32);
});

test('first UP is allowed immediately: upBlockedFor starts at 0 in initialState', () => {
	const { state } = driveUp(withFeeds(2, { a: 2 }));
	// UP fired and did not set a block (no failed climb yet).
	expect(state.upBlockedFor).toBe(0);
});

test('DOWN is never blocked by the cooldown — fires even when upBlockedFor is at max', () => {
	const s = withFeeds(5, { a: 5 });
	s.upBlockedFor = COOLDOWN_MAX;
	const { changes } = driveDown(s);
	expect(changes.length).toBeGreaterThan(0);
	expect(changes[0].rung).toBe(4);
});

test('UP-then-DOWN-soon (first failed climb): cooldownLen doubles 8->16, upBlockedFor=16', () => {
	// After UP fires (ticksSinceUp=0), drive 3 more poor ticks (DOWN fires at ticksSinceUp=3 ≤ 8).
	const s = withFeeds(2, { a: 2 });
	const { state: afterUp } = driveUp(s);
	expect(afterUp.ticksSinceUp).toBe(0);
	const { state: afterDown } = driveDown(afterUp);
	expect(afterDown.cooldownLen).toBe(16);
	expect(afterDown.upBlockedFor).toBe(16);
});

test('second failed climb doubles cooldownLen 16->32 (capped at COOLDOWN_MAX)', () => {
	let s = withFeeds(2, { a: 2 });
	// First failed climb → cooldownLen=16, upBlockedFor=16.
	({ state: s } = driveUp(s));
	({ state: s } = driveDown(s));
	expect(s.cooldownLen).toBe(16);
	// Drain the block (16 hold ticks).
	s = repeat(s, 3, 16).state;
	expect(s.upBlockedFor).toBe(0);
	// Second UP fires (feed must still be below TOP_RUNG).
	({ state: s } = driveUp(s));
	// DOWN soon after → second FAILED CLIMB.
	({ state: s } = driveDown(s));
	expect(s.cooldownLen).toBe(32);
	expect(s.upBlockedFor).toBe(32);
});

test('cooldownLen caps at COOLDOWN_MAX: doubling at cap stays at cap', () => {
	const s = withFeeds(5, { a: 5 });
	s.cooldownLen = COOLDOWN_MAX;
	s.ticksSinceUp = 0; // simulate a very recent UP so FAILED CLIMB fires
	s.ticksSinceDown = 0; // prevent RESET
	const { state } = driveDown(s);
	expect(state.cooldownLen).toBe(COOLDOWN_MAX);
	expect(state.upBlockedFor).toBe(COOLDOWN_MAX);
});

test('a cascade (multi-step DOWN after one UP) doubles cooldownLen EXACTLY ONCE, not per down-step', () => {
	// Each DOWN step resets evidenceBuf, so the next DOWN needs 3 MORE poor ticks.
	// Only the FIRST post-UP DOWN event sees ticksSinceUp <= cooldownLen and doubles.
	let s = withFeeds(4, { a: 4 });
	// UP fires: ticksSinceUp=0, evidenceBuf reset.
	({ state: s } = driveUp(s));
	expect(s.ticksSinceUp).toBe(0);
	// First DOWN: FAILED CLIMB fires → cooldownLen 8→16.
	({ state: s } = driveDown(s));
	expect(s.cooldownLen).toBe(16);
	expect(s.upBlockedFor).toBe(16);
	// ticksSinceUp was reset to COOLDOWN_MAX+1 after first doubling.
	// Second DOWN: ticksSinceUp = COOLDOWN_MAX+1+EVIDENCE_DOWN_N > cooldownLen → no re-doubling.
	({ state: s } = driveDown(s)); // another 3 poor ticks → next step
	expect(s.cooldownLen).toBe(16); // still 16, NOT jumped to cap
});

test('cooldown resets to COOLDOWN_BASE after RESET_STABLE ticks without DOWN', () => {
	let s = withFeeds(2, { a: 2 });
	// Trigger a failed climb to raise cooldownLen to 16.
	({ state: s } = driveUp(s));
	({ state: s } = driveDown(s));
	expect(s.cooldownLen).toBe(16);
	// Feed RESET_STABLE hold ticks (no DOWN) — block drains AND RESET fires.
	s = repeat(s, 3, RESET_STABLE).state;
	expect(s.cooldownLen).toBe(COOLDOWN_BASE);
	expect(s.upBlockedFor).toBe(0);
});

test('UP resumes once upBlockedFor reaches 0 (block drains tick by tick)', () => {
	let s = withFeeds(2, { a: 2 });
	({ state: s } = driveUp(s));
	({ state: s } = driveDown(s)); // upBlockedFor=16
	// Drain 15 hold ticks.
	s = repeat(s, 3, 15).state;
	expect(s.upBlockedFor).toBe(1);
	// 16th drain tick.
	s = repeat(s, 3, 1).state;
	expect(s.upBlockedFor).toBe(0);
	// Now UP can fire.
	const { changes } = driveUp(s);
	expect(changes.length).toBeGreaterThan(0);
});
