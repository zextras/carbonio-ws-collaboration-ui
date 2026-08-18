/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { decideSubstream, initialQualityState, QualityState } from './inboundQualityController';

const congested = { lossRate: 0.15, jbdRising: true };
const randomLoss = { lossRate: 0.15, jbdRising: false }; // high loss but jitter buffer flat = Wi-Fi
const catastrophic = { lossRate: 0.3, jbdRising: false };
const clean = { lossRate: 0, jbdRising: false };
const deadBand = { lossRate: 0.05, jbdRising: false };

const climb = (s: QualityState, n: number): QualityState => {
	let st = s;
	for (let i = 0; i < n; i += 1) st = decideSubstream(st, clean);
	return st;
};

test('two consecutive congested samples drop one layer', () => {
	let s = initialQualityState(2);
	s = decideSubstream(s, congested);
	expect(s.change).toBeUndefined();
	s = decideSubstream(s, congested);
	expect(s.change).toBe(1);
	expect(s.substream).toBe(1);
});

test('Wi-Fi guard: a SHORT high-loss burst with a flat jitter buffer does NOT drop', () => {
	let s = initialQualityState(2);
	for (let i = 0; i < 3; i += 1) s = decideSubstream(s, randomLoss);
	expect(s.substream).toBe(2);
	expect(s.change).toBeUndefined();
});

test('steady-state escape: SUSTAINED high loss with a flat jitter buffer eventually drops', () => {
	const steady = { lossRate: 0.15, jbdRising: false };
	let s = initialQualityState(2);
	for (let i = 0; i < 4; i += 1) s = decideSubstream(s, steady); // build highLossStreak, no drop yet
	expect(s.substream).toBe(2);
	s = decideSubstream(s, steady); // FORCE_DROP_TICKS reached -> drop even without jbdRising
	expect(s.change).toBe(1);
});

test('catastrophic loss drops even without the jitter-buffer confirmer', () => {
	let s = initialQualityState(2);
	s = decideSubstream(s, catastrophic);
	s = decideSubstream(s, catastrophic);
	expect(s.change).toBe(1);
});

test('climbs one layer after UP_BASE (4) clean samples', () => {
	let s = { ...initialQualityState(0) };
	s = decideSubstream(s, clean); // 1
	s = decideSubstream(s, clean); // 2
	s = decideSubstream(s, clean); // 3
	expect(s.change).toBeUndefined();
	s = decideSubstream(s, clean); // 4 -> climb
	expect(s.change).toBe(1);
	expect(s.substream).toBe(1);
});

test('does not climb while the jitter buffer is rising', () => {
	let s = { ...initialQualityState(0) };
	for (let i = 0; i < 10; i += 1) s = decideSubstream(s, { lossRate: 0, jbdRising: true });
	expect(s.substream).toBe(0);
});

test('escalating patience: a failed climb doubles the streak needed next time', () => {
	// climb 0 -> 1 (4 clean), then congestion immediately (within OBSERVE) fails the climb
	let s = { ...initialQualityState(0) };
	s = climb(s, 4);
	expect(s.substream).toBe(1);
	s = decideSubstream(s, congested);
	s = decideSubstream(s, congested); // drop back to 0, failCount[0] -> 1
	expect(s.substream).toBe(0);
	expect(s.failCount[0]).toBe(1);
	// now 4 clean is NOT enough (needs 8); 7 clean still at 0
	s = climb(s, 7);
	expect(s.substream).toBe(0);
	// 8th clean climbs
	s = decideSubstream(s, clean);
	expect(s.change).toBe(1);
});

test('a survived climb decays the boundary failCount (fires on >= OBSERVE, not exact tick)', () => {
	let s = { ...initialQualityState(0) };
	s = climb(s, 4); // 0 -> 1
	s = decideSubstream(s, congested);
	s = decideSubstream(s, congested); // drop 1 -> 0, failCount[0] -> 1
	expect(s.failCount[0]).toBe(1);
	// climb again (needs 8 now) and stay clean well past OBSERVE: the survived climb decays failCount[0]
	s = climb(s, 12);
	expect(s.failCount[0]).toBe(0);
});

test('dead band (2-10%) holds and resets the clean streak', () => {
	let s = { ...initialQualityState(0) };
	s = decideSubstream(s, clean);
	s = decideSubstream(s, clean);
	s = decideSubstream(s, deadBand); // resets goodStreak
	s = decideSubstream(s, clean);
	s = decideSubstream(s, clean);
	s = decideSubstream(s, clean);
	expect(s.substream).toBe(0); // only 3 clean since the reset, < 4
	s = decideSubstream(s, clean);
	expect(s.change).toBe(1);
});

test('does not drop below 0 (turns off) or rise above 2', () => {
	let s = { ...initialQualityState(0) };
	s = decideSubstream(s, congested);
	s = decideSubstream(s, congested);
	expect(s.substream).toBe(0);
	expect(s.off).toBe(true);
	// climb hard past the top
	s = { ...initialQualityState(2) };
	s = climb(s, 20);
	expect(s.substream).toBe(2);
});

test('two congested samples at substream 0 set off=true, substream stays 0', () => {
	let s = initialQualityState(0);
	s = decideSubstream(s, congested);
	expect(s.off).toBeUndefined();
	s = decideSubstream(s, congested);
	expect(s.off).toBe(true);
	expect(s.substream).toBe(0);
});
