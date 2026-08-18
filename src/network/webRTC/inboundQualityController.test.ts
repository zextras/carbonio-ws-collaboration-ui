/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { decideSubstream, QualityState, initialQualityState } from './inboundQualityController';

test('2 consecutive bad samples drop one layer', () => {
	let s = initialQualityState(2);
	s = decideSubstream(s, { lossRate: 0.08 });
	expect(s.change).toBeUndefined();
	s = decideSubstream(s, { lossRate: 0.08 });
	expect(s.change).toBe(1);
});

test('10 consecutive good samples raise one layer', () => {
	let s = { ...initialQualityState(2), substream: 0 } as QualityState;
	for (let i = 0; i < 9; i += 1) s = decideSubstream(s, { lossRate: 0 });
	expect(s.change).toBeUndefined();
	s = decideSubstream(s, { lossRate: 0 });
	expect(s.change).toBe(1);
});

test('does not drop below 0 or rise above 2', () => {
	let s = { ...initialQualityState(0), substream: 0 } as QualityState;
	for (let i = 0; i < 5; i += 1) s = decideSubstream(s, { lossRate: 0.5 });
	expect(s.substream).toBe(0);
});

test('two bad samples at substream 0 set off=true and keep substream at 0', () => {
	let s = initialQualityState(0);
	s = decideSubstream(s, { lossRate: 0.08 });
	expect(s.off).toBeUndefined();
	s = decideSubstream(s, { lossRate: 0.08 });
	expect(s.off).toBe(true);
	expect(s.substream).toBe(0);
});

test('drops from substream 2 to 0 via bad samples without ever setting off', () => {
	let s = initialQualityState(2);
	// Two bad → drop to 1, no off
	s = decideSubstream(s, { lossRate: 0.08 });
	s = decideSubstream(s, { lossRate: 0.08 });
	expect(s.substream).toBe(1);
	expect(s.off).toBeUndefined();
	// Two more bad → drop to 0, no off
	s = decideSubstream(s, { lossRate: 0.08 });
	s = decideSubstream(s, { lossRate: 0.08 });
	expect(s.substream).toBe(0);
	expect(s.off).toBeUndefined();
});

test('one bad sample at substream 0 does not set off; the second does', () => {
	let s = initialQualityState(0);
	s = decideSubstream(s, { lossRate: 0.08 });
	expect(s.off).toBeUndefined();
	s = decideSubstream(s, { lossRate: 0.08 });
	expect(s.off).toBe(true);
});
