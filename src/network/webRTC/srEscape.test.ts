/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, it } from 'vitest';

import { MIN_EXPECTED_PACKETS, srEscapeLoss, srEscapeStreams } from './srEscape';

const RO = 'remote-outbound-rtp';
const IN = 'inbound-rtp';

const report = (stats: Array<Record<string, unknown>>): RTCStatsReport =>
	new Map(stats.map((s, i) => [String(s.id ?? i), s])) as unknown as RTCStatsReport;

describe('srEscapeStreams', () => {
	it('returns one entry per matched (remoteId, inboundId) pair with cumulative counts', () => {
		const r = report([
			{ id: 'ro1', type: RO, packetsSent: 1000 },
			{ id: 'in1', type: IN, remoteId: 'ro1', packetsReceived: 950 },
			{ id: 'ro2', type: RO, packetsSent: 500 },
			{ id: 'in2', type: IN, remoteId: 'ro2', packetsReceived: 500 }
		]);
		const streams = srEscapeStreams(r);
		expect(streams).toHaveLength(2);
		expect(streams.find((s) => s.key === 'ro1:in1')).toEqual({
			key: 'ro1:in1',
			sent: 1000,
			recv: 950
		});
		expect(streams.find((s) => s.key === 'ro2:in2')).toEqual({
			key: 'ro2:in2',
			sent: 500,
			recv: 500
		});
	});

	it('ignores inbound streams without a paired SR', () => {
		const r = report([{ id: 'in1', type: IN, remoteId: 'missing', packetsReceived: 100 }]);
		expect(srEscapeStreams(r)).toHaveLength(0);
	});

	it('NEVER reads inbound-rtp.packetsLost (immune to the publisher uplink loss)', () => {
		const r = report([
			{ id: 'ro1', type: RO, packetsSent: 1000 },
			{ id: 'in1', type: IN, remoteId: 'ro1', packetsReceived: 1000, packetsLost: 500 }
		]);
		const streams = srEscapeStreams(r);
		expect(streams).toHaveLength(1);
		expect(streams[0]).toEqual({ key: 'ro1:in1', sent: 1000, recv: 1000 });
	});

	it('uses (remoteId:inboundId) as key so two inbound streams paired to the same SR have distinct keys', () => {
		const r = report([
			{ id: 'roX', type: RO, packetsSent: 800 },
			{ id: 'in1', type: IN, remoteId: 'roX', packetsReceived: 800 },
			{ id: 'in2', type: IN, remoteId: 'roX', packetsReceived: 750 }
		]);
		const streams = srEscapeStreams(r);
		expect(streams).toHaveLength(2);
		const keys = streams.map((s) => s.key);
		expect(keys).toContain('roX:in1');
		expect(keys).toContain('roX:in2');
	});
});

describe('srEscapeLoss', () => {
	it('is undefined below MIN_EXPECTED_PACKETS (volume gate suppresses noisy few-packet windows)', () => {
		expect(srEscapeLoss(0, 0)).toBeUndefined();
		expect(srEscapeLoss(MIN_EXPECTED_PACKETS - 1, 0)).toBeUndefined();
	});

	it('computes at/above MIN_EXPECTED_PACKETS — loss fraction is correctly measured', () => {
		expect(srEscapeLoss(MIN_EXPECTED_PACKETS, 0)).toBe(1); // 100% loss at the threshold
		expect(srEscapeLoss(1000, 900)).toBeCloseTo(0.1, 5);
		expect(srEscapeLoss(1000, 1000)).toBe(0); // no loss
		expect(srEscapeLoss(1000, 1100)).toBe(0); // negative -> clamped
	});

	it('does NOT suppress genuinely high loss when >= MIN_EXPECTED_PACKETS packets forwarded', () => {
		// 50% loss with 100 packets — gate must pass and report the real loss
		expect(srEscapeLoss(100, 50)).toBeCloseTo(0.5, 5);
	});
});
