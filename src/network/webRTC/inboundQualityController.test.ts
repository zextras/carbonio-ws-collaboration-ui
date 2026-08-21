/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import {
	decideQuality,
	initialQualityState,
	isReducedFramerate,
	layersOf,
	QualityState
} from './inboundQualityController';

const congested = { lossRate: 0.15, jbdRising: true };
const randomLoss = { lossRate: 0.15, jbdRising: false }; // high loss but jitter buffer flat = Wi-Fi
const catastrophic = { lossRate: 0.3, jbdRising: false };
const clean = { lossRate: 0, jbdRising: false };
const deadBand = { lossRate: 0.05, jbdRising: false };

const step = (s: QualityState, sample: typeof clean, n: number): QualityState => {
	let st = s;
	for (let i = 0; i < n; i += 1) st = decideQuality(st, sample);
	return st;
};
const climb = (s: QualityState, n: number): QualityState => step(s, clean, n);
const drop = (s: QualityState, n: number): QualityState => step(s, congested, n);

// rung <-> (substream, temporal) mapping. rung 5 = best (sub2, full fps); each substream has a
// FULL and a BASE (framerate-reduced) rung; temporal target 2 = all layers, 0 = base only.
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

test('initialQualityState starts at the best rung (5) by default', () => {
	expect(initialQualityState().rung).toBe(5);
	expect(initialQualityState(0).rung).toBe(0);
});

test('congestion drops FRAMERATE first: rung 5 -> 4 keeps the substream, cuts temporal', () => {
	let s = initialQualityState();
	s = decideQuality(s, congested);
	expect(s.changeSubstream).toBeUndefined(); // one congested tick: no change yet
	s = decideQuality(s, congested);
	expect(s.rung).toBe(4);
	expect(s.changeSubstream).toBe(2); // same resolution
	expect(s.changeTemporal).toBe(0); // base framerate
	expect(s.substreamChanged).toBe(false); // no keyframe / no freeze
});

test('RESOLUTION drops only after framerate is exhausted: rung 4 -> 3 changes the substream', () => {
	let s = initialQualityState(4); // sub2, base fps
	s = drop(s, 2);
	expect(s.rung).toBe(3);
	expect(s.changeSubstream).toBe(1); // resolution down
	expect(s.changeTemporal).toBe(2); // framerate restored to full at the new (lower) resolution
	expect(s.substreamChanged).toBe(true); // keyframe -> the caller must mask
});

test('a framerate step then a resolution step (two full drops from the top)', () => {
	let s = initialQualityState(5);
	s = drop(s, 2);
	expect(s.rung).toBe(4);
	expect(s.substreamChanged).toBe(false); // framerate only
	s = drop(s, 2);
	expect(s.rung).toBe(3);
	expect(s.substreamChanged).toBe(true); // resolution
});

test('turns OFF only at the very bottom (sub0, base) after DOWN_TICKS', () => {
	let s = initialQualityState(0);
	s = decideQuality(s, congested);
	expect(s.off).toBeUndefined();
	s = decideQuality(s, congested);
	expect(s.off).toBe(true);
	expect(s.rung).toBe(0);
});

test('climb restores FRAMERATE first: rung 0 -> 1 keeps the substream, restores temporal', () => {
	let s = initialQualityState(0);
	s = climb(s, 4);
	expect(s.rung).toBe(1);
	expect(s.changeSubstream).toBe(0);
	expect(s.changeTemporal).toBe(2);
	expect(s.substreamChanged).toBe(false);
});

test('climb into a higher RESOLUTION enters at base framerate: rung 1 -> 2', () => {
	let s = initialQualityState(1); // sub0, full
	s = climb(s, 4);
	expect(s.rung).toBe(2);
	expect(s.changeSubstream).toBe(1);
	expect(s.changeTemporal).toBe(0);
	expect(s.substreamChanged).toBe(true);
});

test('Wi-Fi guard: a SHORT high-loss burst with a flat jitter buffer does NOT drop', () => {
	let s = initialQualityState(5);
	s = step(s, randomLoss, 3);
	expect(s.rung).toBe(5);
	expect(s.changeSubstream).toBeUndefined();
});

test('steady-state escape: SUSTAINED high loss with a flat jitter buffer eventually drops', () => {
	const steady = { lossRate: 0.15, jbdRising: false };
	let s = initialQualityState(5);
	s = step(s, steady, 4); // build highLossStreak, first congested tick only
	expect(s.rung).toBe(5);
	s = decideQuality(s, steady); // FORCE_DROP_TICKS reached -> drop
	expect(s.rung).toBe(4);
});

test('catastrophic loss drops even without the jitter-buffer confirmer', () => {
	let s = initialQualityState(5);
	s = decideQuality(s, catastrophic);
	s = decideQuality(s, catastrophic);
	expect(s.rung).toBe(4);
});

test('does not climb while the jitter buffer is rising', () => {
	let s = initialQualityState(0);
	s = step(s, { lossRate: 0, jbdRising: true }, 10);
	expect(s.rung).toBe(0);
});

test('escalating patience: a failed climb doubles the streak needed at that boundary', () => {
	let s = initialQualityState(0);
	s = climb(s, 4); // rung 0 -> 1 (boundary 0)
	expect(s.rung).toBe(1);
	s = decideQuality(s, congested);
	s = decideQuality(s, congested); // drop 1 -> 0, failCount[0] -> 1
	expect(s.rung).toBe(0);
	expect(s.failCount[0]).toBe(1);
	// now 4 clean is NOT enough (needs 8); 7 clean still at 0
	s = climb(s, 7);
	expect(s.rung).toBe(0);
	s = decideQuality(s, clean); // 8th
	expect(s.rung).toBe(1);
});

test('a survived climb decays the boundary failCount', () => {
	let s = initialQualityState(0);
	s = climb(s, 4); // 0 -> 1
	s = decideQuality(s, congested);
	s = decideQuality(s, congested); // drop 1 -> 0, failCount[0] -> 1
	expect(s.failCount[0]).toBe(1);
	s = climb(s, 12); // climb (needs 8) then stay clean past OBSERVE -> decays failCount[0]
	expect(s.failCount[0]).toBe(0);
});

test('dead band (2-10%) holds and resets the clean streak', () => {
	let s = initialQualityState(0);
	s = climb(s, 2);
	s = decideQuality(s, deadBand); // resets goodStreak
	s = climb(s, 3);
	expect(s.rung).toBe(0); // only 3 clean since the reset, < 4
	s = decideQuality(s, clean);
	expect(s.rung).toBe(1);
});

test('does not rise above the best rung (5)', () => {
	let s = initialQualityState(5);
	s = climb(s, 20);
	expect(s.rung).toBe(5);
});
