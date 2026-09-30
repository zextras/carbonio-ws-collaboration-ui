/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, it } from 'vitest';

import {
	readCandidatePairRttMs,
	readMaxFractionLost,
	readMaxJitterMs,
	sendingSsrcs
} from './networkSignals';

const CANDIDATE_PAIR = 'candidate-pair';
const REMOTE_INBOUND = 'remote-inbound-rtp';
const OUTBOUND_RTP = 'outbound-rtp';
const TRANSPORT = 'transport';

const report = (stats: Array<Record<string, unknown>>): RTCStatsReport =>
	new Map(stats.map((s, i) => [String(s.id ?? i), s])) as unknown as RTCStatsReport;

describe('readCandidatePairRttMs', () => {
	it('resolves the selected pair via transport.selectedCandidatePairId and returns rtt in ms', () => {
		const r = report([
			{ id: 'tr', type: TRANSPORT, selectedCandidatePairId: 'pair1' },
			{
				id: 'pair1',
				type: CANDIDATE_PAIR,
				nominated: true,
				state: 'succeeded',
				currentRoundTripTime: 0.024
			}
		]);
		expect(readCandidatePairRttMs(r)).toBeCloseTo(24, 5);
	});

	it('ignores nominated+succeeded pairs that are NOT the selected pair (Firefox multi-pair bug)', () => {
		// Transport points to pair1 (rtt 0.024); pair2 also nominated+succeeded but rtt=0 (stale).
		// Old max-over-all logic would pick 24ms then overwrite with 0. New identity-based logic picks pair1.
		const r = report([
			{ id: 'tr', type: TRANSPORT, selectedCandidatePairId: 'pair1' },
			{
				id: 'pair1',
				type: CANDIDATE_PAIR,
				nominated: true,
				state: 'succeeded',
				currentRoundTripTime: 0.024
			},
			{
				id: 'pair2',
				type: CANDIDATE_PAIR,
				nominated: true,
				state: 'succeeded',
				currentRoundTripTime: 0
			}
		]);
		expect(readCandidatePairRttMs(r)).toBeCloseTo(24, 5);
	});

	it('returns undefined when the selected pair has currentRoundTripTime === 0 (treat 0 as no reading)', () => {
		const r = report([
			{ id: 'tr', type: TRANSPORT, selectedCandidatePairId: 'pair1' },
			{
				id: 'pair1',
				type: CANDIDATE_PAIR,
				nominated: true,
				state: 'succeeded',
				currentRoundTripTime: 0
			}
		]);
		expect(readCandidatePairRttMs(r)).toBeUndefined();
	});

	it('falls back to the selected===true field when there is no transport report (Firefox non-standard)', () => {
		const r = report([
			{ id: 'pair1', type: CANDIDATE_PAIR, selected: true, currentRoundTripTime: 0.05 }
		]);
		expect(readCandidatePairRttMs(r)).toBeCloseTo(50, 5);
	});

	it('returns undefined when no transport and no selected pair, or null stats', () => {
		expect(
			readCandidatePairRttMs(
				report([
					{ type: CANDIDATE_PAIR, nominated: false, state: 'succeeded', currentRoundTripTime: 0.1 }
				])
			)
		).toBeUndefined();
		expect(readCandidatePairRttMs(null)).toBeUndefined();
	});
});

describe('sendingSsrcs', () => {
	it('marks a video layer active when its encoder is producing frames (fps > 0)', () => {
		const r = report([
			{ id: 'o1', type: OUTBOUND_RTP, ssrc: 10, framesPerSecond: 25 },
			{ id: 'o2', type: OUTBOUND_RTP, ssrc: 20, framesPerSecond: 30 }
		]);
		const active = sendingSsrcs(r);
		expect(active.has(10)).toBe(true);
		expect(active.has(20)).toBe(true);
	});

	it('excludes a parked simulcast layer (fps 0) but keeps the active one', () => {
		const r = report([
			{ id: 'o1', type: OUTBOUND_RTP, ssrc: 10, framesPerSecond: 0 },
			{ id: 'o2', type: OUTBOUND_RTP, ssrc: 20, framesPerSecond: 25 }
		]);
		const active = sendingSsrcs(r);
		expect(active.has(10)).toBe(false);
		expect(active.has(20)).toBe(true);
	});

	it('always marks a non-video sender active (no framesPerSecond, e.g. audio)', () => {
		const r = report([{ id: 'oa', type: OUTBOUND_RTP, ssrc: 1 }]);
		expect(sendingSsrcs(r).has(1)).toBe(true);
	});

	it('returns an empty set for null stats', () => {
		expect(sendingSsrcs(null).size).toBe(0);
	});
});

describe('readMaxJitterMs', () => {
	it('returns the max jitter in ms across all remote-inbound reports when no activeSsrcs given', () => {
		const r = report([
			{ id: 'ri1', type: REMOTE_INBOUND, ssrc: 1, jitter: 0.071 },
			{ id: 'ri2', type: REMOTE_INBOUND, ssrc: 2, jitter: 0.014 }
		]);
		expect(readMaxJitterMs(r)).toBeCloseTo(71, 5);
	});

	it('filters to activeSsrcs only — parked layer (ssrc A, high jitter) is ignored', () => {
		const r = report([
			{ id: 'ri1', type: REMOTE_INBOUND, ssrc: 1, jitter: 0.071 }, // idle layer
			{ id: 'ri2', type: REMOTE_INBOUND, ssrc: 2, jitter: 0.014 } // active layer
		]);
		const active = new Set([2]);
		expect(readMaxJitterMs(r, active)).toBeCloseTo(14, 5);
	});

	it('returns undefined when activeSsrcs is provided but no matching remote-inbound entry', () => {
		const r = report([{ id: 'ri1', type: REMOTE_INBOUND, ssrc: 1, jitter: 0.05 }]);
		expect(readMaxJitterMs(r, new Set([99]))).toBeUndefined();
	});

	it('rejects jitter values above the sanity cap (getStats counter glitch)', () => {
		const r = report([
			{ id: 'ri1', type: REMOTE_INBOUND, ssrc: 1, jitter: 200 } // 200000 ms — absurd
		]);
		expect(readMaxJitterMs(r)).toBeUndefined();
	});

	it('returns undefined for null stats', () => {
		expect(readMaxJitterMs(null)).toBeUndefined();
	});
});

describe('readMaxFractionLost', () => {
	it('returns max fractionLost across all remote-inbound reports when no activeSsrcs given', () => {
		const r = report([
			{ id: 'ri1', type: REMOTE_INBOUND, ssrc: 1, fractionLost: 0.15 },
			{ id: 'ri2', type: REMOTE_INBOUND, ssrc: 2, fractionLost: 0.05 }
		]);
		expect(readMaxFractionLost(r)).toBeCloseTo(0.15, 5);
	});

	it('filters to activeSsrcs only — parked layer (ssrc A, high loss) is ignored', () => {
		const r = report([
			{ id: 'ri1', type: REMOTE_INBOUND, ssrc: 1, fractionLost: 0.15 }, // parked
			{ id: 'ri2', type: REMOTE_INBOUND, ssrc: 2, fractionLost: 0.02 } // active
		]);
		const active = new Set([2]);
		expect(readMaxFractionLost(r, active)).toBeCloseTo(0.02, 5);
	});

	it('returns undefined when activeSsrcs is provided but no matching remote-inbound entry', () => {
		const r = report([{ id: 'ri1', type: REMOTE_INBOUND, ssrc: 1, fractionLost: 0.1 }]);
		expect(readMaxFractionLost(r, new Set([99]))).toBeUndefined();
	});

	it('returns undefined for null stats', () => {
		expect(readMaxFractionLost(null)).toBeUndefined();
	});
});
