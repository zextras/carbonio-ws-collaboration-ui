/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, it, vi } from 'vitest';

import { restartIce, restartIceWithOffer } from './iceRestart';

const RESTART_SDP = 'restart-sdp';

type PeerConnMock = {
	connectionState: RTCPeerConnectionState;
	signalingState: RTCSignalingState;
	localDescription: RTCSessionDescriptionInit | null;
	createOffer: ReturnType<typeof vi.fn>;
	setLocalDescription: ReturnType<typeof vi.fn>;
};

const createPeerConnMock = (): PeerConnMock => {
	const peerConn: PeerConnMock = {
		connectionState: 'failed',
		signalingState: 'stable',
		localDescription: null,
		createOffer: vi.fn(() => Promise.resolve({ sdp: RESTART_SDP, type: 'offer' })),
		setLocalDescription: vi.fn(async (description: RTCSessionDescriptionInit) => {
			const rollback = description.type === 'rollback';
			peerConn.signalingState = rollback ? 'stable' : 'have-local-offer';
			peerConn.localDescription = rollback ? null : description;
		})
	};
	return peerConn;
};

const asPeerConn = (mock: PeerConnMock): RTCPeerConnection => mock as unknown as RTCPeerConnection;

const failure = (): Error => new Error('status ko');

const secondsBetweenCalls = (times: number[]): number[] =>
	times.slice(1).map((time, i) => Math.round((time - times[i]) / 1000));

const timedRestart = (
	times: number[],
	result: () => Promise<unknown>
): ReturnType<typeof vi.fn<() => Promise<unknown>>> =>
	vi.fn(() => {
		times.push(Date.now());
		return result();
	});

const descriptionTypes = (peerConn: PeerConnMock): string[] =>
	peerConn.setLocalDescription.mock.calls.map(([description]) => description.type);

beforeEach(() => {
	vi.spyOn(console, 'warn').mockImplementation(() => undefined);
});

afterEach(() => {
	vi.clearAllTimers();
});

describe('restartIce', () => {
	it('retries a failed restart after 5, 10, 20 and then every 30 seconds', async () => {
		const times: number[] = [];
		const restart = timedRestart(times, () => Promise.reject(failure()));

		restartIce(asPeerConn(createPeerConnMock()), restart);
		await vi.advanceTimersByTimeAsync(96_000);

		expect(secondsBetweenCalls(times)).toEqual([5, 10, 20, 30, 30]);
		expect(console.warn).toHaveBeenCalledWith(
			'ICE restart failed, retrying in 5000 ms',
			expect.any(Error)
		);
	});

	it('waits 5 seconds again once the connection is back', async () => {
		const peerConn = createPeerConnMock();
		const times: number[] = [];
		const restart = timedRestart(times, () => Promise.reject(failure()));
		restartIce(asPeerConn(peerConn), restart);
		await vi.advanceTimersByTimeAsync(16_000);
		peerConn.connectionState = 'connected';
		await vi.advanceTimersByTimeAsync(30_000);

		peerConn.connectionState = 'failed';
		times.length = 0;
		restartIce(asPeerConn(peerConn), restart);
		await vi.advanceTimersByTimeAsync(6_000);

		expect(secondsBetweenCalls(times)).toEqual([5]);
	});

	it('restarts again every 15 seconds while an accepted restart does not bring the connection back', async () => {
		const times: number[] = [];
		const restart = timedRestart(times, () => Promise.resolve());

		restartIce(asPeerConn(createPeerConnMock()), restart);
		await vi.advanceTimersByTimeAsync(31_000);

		expect(secondsBetweenCalls(times)).toEqual([15, 15]);
	});

	test.each([
		['connected', 'failed'],
		['closed', 'failed'],
		['connected', 'succeeded'],
		['closed', 'succeeded']
	] as const)('stops once the connection is %s after a restart that %s', async (state, outcome) => {
		const peerConn = createPeerConnMock();
		const restart = vi.fn(() =>
			outcome === 'failed' ? Promise.reject(failure()) : Promise.resolve()
		);

		restartIce(asPeerConn(peerConn), restart);
		await vi.advanceTimersByTimeAsync(1_000);
		peerConn.connectionState = state;
		await vi.advanceTimersByTimeAsync(120_000);

		expect(restart).toHaveBeenCalledTimes(1);
	});

	it('does not start a restart while another one is in flight or waiting for its answer', async () => {
		const peerConn = createPeerConnMock();
		let accept: () => void = () => undefined;
		const restart = vi.fn(
			() =>
				new Promise<void>((resolve) => {
					accept = resolve;
				})
		);

		restartIce(asPeerConn(peerConn), restart);
		restartIce(asPeerConn(peerConn), restart);
		expect(restart).toHaveBeenCalledTimes(1);

		accept();
		await vi.advanceTimersByTimeAsync(1_000);
		restartIce(asPeerConn(peerConn), restart);
		expect(restart).toHaveBeenCalledTimes(1);

		peerConn.connectionState = 'connected';
		await vi.advanceTimersByTimeAsync(15_000);
		peerConn.connectionState = 'failed';
		restartIce(asPeerConn(peerConn), restart);
		expect(restart).toHaveBeenCalledTimes(2);
	});

	it('does not start a restart while a retry is waiting', async () => {
		const peerConn = asPeerConn(createPeerConnMock());
		const restart = vi.fn().mockRejectedValueOnce(failure()).mockResolvedValue(undefined);

		restartIce(peerConn, restart);
		await vi.advanceTimersByTimeAsync(1_000);
		restartIce(peerConn, restart);
		expect(restart).toHaveBeenCalledTimes(1);

		await vi.advanceTimersByTimeAsync(5_000);
		expect(restart).toHaveBeenCalledTimes(2);
	});
});

describe('restartIceWithOffer', () => {
	it('sends an ICE restart offer', async () => {
		const peerConn = createPeerConnMock();
		const sendOffer = vi.fn().mockResolvedValue(undefined);

		restartIceWithOffer(asPeerConn(peerConn), sendOffer);
		await vi.advanceTimersByTimeAsync(1_000);

		expect(peerConn.createOffer).toHaveBeenCalledWith({ iceRestart: true });
		expect(sendOffer).toHaveBeenCalledWith(RESTART_SDP);
	});

	it('rolls back the offer the server refused and offers again after 5 seconds', async () => {
		const peerConn = createPeerConnMock();
		const sendOffer = vi.fn().mockRejectedValueOnce(failure()).mockResolvedValue(undefined);

		restartIceWithOffer(asPeerConn(peerConn), sendOffer);
		await vi.advanceTimersByTimeAsync(1_000);
		expect(descriptionTypes(peerConn)).toEqual(['offer', 'rollback']);
		expect(peerConn.signalingState).toBe('stable');

		await vi.advanceTimersByTimeAsync(5_000);
		expect(descriptionTypes(peerConn)).toEqual(['offer', 'rollback', 'offer']);
		expect(sendOffer).toHaveBeenCalledTimes(2);
	});

	it('rolls back the offer whose answer never arrived before offering again', async () => {
		const peerConn = createPeerConnMock();
		const sendOffer = vi.fn().mockResolvedValue(undefined);

		restartIceWithOffer(asPeerConn(peerConn), sendOffer);
		await vi.advanceTimersByTimeAsync(16_000);

		expect(descriptionTypes(peerConn)).toEqual(['offer', 'rollback', 'offer']);
		expect(sendOffer).toHaveBeenCalledTimes(2);
	});

	test.each([
		[
			'creating the offer fails',
			(pc: PeerConnMock): unknown => pc.createOffer.mockRejectedValueOnce(failure())
		],
		[
			'setting the offer fails',
			(pc: PeerConnMock): unknown => pc.setLocalDescription.mockRejectedValueOnce(failure())
		],
		[
			'the offer has no sdp',
			(pc: PeerConnMock): unknown => pc.createOffer.mockResolvedValueOnce({ type: 'offer' })
		]
	])('offers again after 5 seconds when %s', async (_, breakOffer) => {
		const peerConn = createPeerConnMock();
		breakOffer(peerConn);
		const sendOffer = vi.fn().mockResolvedValue(undefined);

		restartIceWithOffer(asPeerConn(peerConn), sendOffer);
		await vi.advanceTimersByTimeAsync(1_000);
		expect(sendOffer).not.toHaveBeenCalled();
		expect(peerConn.signalingState).toBe('stable');

		await vi.advanceTimersByTimeAsync(5_000);
		expect(sendOffer).toHaveBeenCalledWith(RESTART_SDP);
	});

	it('stops without an unhandled rejection when the rollback fails on a closed connection', async () => {
		const peerConn = createPeerConnMock();
		const closedError = new Error('InvalidStateError');
		const sendOffer = vi.fn(() => {
			peerConn.connectionState = 'closed';
			peerConn.setLocalDescription.mockRejectedValueOnce(closedError);
			return Promise.reject(failure());
		});

		restartIceWithOffer(asPeerConn(peerConn), sendOffer);
		await vi.advanceTimersByTimeAsync(60_000);

		expect(console.warn).toHaveBeenCalledWith(expect.any(String), closedError);
		expect(peerConn.createOffer).toHaveBeenCalledTimes(1);
	});
});
