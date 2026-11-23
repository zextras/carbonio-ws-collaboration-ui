/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ICE_RESTART_RETRY_MS, restartIce, restartIceWithOffer } from './iceRestart';

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
		createOffer: vi.fn(() => Promise.resolve({ sdp: 'restart-sdp', type: 'offer' })),
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

beforeEach(() => {
	vi.spyOn(console, 'warn').mockImplementation(() => undefined);
});

describe('restartIce', () => {
	test('retries a failed restart after 5 seconds', async () => {
		const restart = vi.fn().mockRejectedValueOnce(failure()).mockResolvedValue(undefined);

		restartIce(asPeerConn(createPeerConnMock()), restart);
		await vi.advanceTimersByTimeAsync(ICE_RESTART_RETRY_MS - 1);
		expect(restart).toHaveBeenCalledTimes(1);

		await vi.advanceTimersByTimeAsync(1);
		expect(restart).toHaveBeenCalledTimes(2);
		expect(console.warn).toHaveBeenCalledWith('ICE restart failed, retrying', expect.any(Error));
	});

	test('keeps retrying every 5 seconds while the restart fails', async () => {
		const restart = vi.fn().mockRejectedValue(failure());

		restartIce(asPeerConn(createPeerConnMock()), restart);
		await vi.advanceTimersByTimeAsync(ICE_RESTART_RETRY_MS * 3);

		expect(restart).toHaveBeenCalledTimes(4);
	});

	test.each(['connected', 'closed'] as const)(
		'stops retrying once the connection is %s',
		async (state) => {
			const peerConn = createPeerConnMock();
			const restart = vi.fn().mockRejectedValue(failure());

			restartIce(asPeerConn(peerConn), restart);
			await vi.advanceTimersByTimeAsync(0);
			peerConn.connectionState = state;
			await vi.advanceTimersByTimeAsync(ICE_RESTART_RETRY_MS * 3);

			expect(restart).toHaveBeenCalledTimes(1);
		}
	);

	test('does not start a restart while another one is in flight', async () => {
		const peerConn = asPeerConn(createPeerConnMock());
		let answer: () => void = () => undefined;
		const restart = vi.fn(
			() =>
				new Promise<void>((resolve) => {
					answer = resolve;
				})
		);

		restartIce(peerConn, restart);
		restartIce(peerConn, restart);
		expect(restart).toHaveBeenCalledTimes(1);

		answer();
		await vi.advanceTimersByTimeAsync(0);
		restartIce(peerConn, restart);
		expect(restart).toHaveBeenCalledTimes(2);
	});

	test('does not start a restart while a retry is waiting', async () => {
		const peerConn = asPeerConn(createPeerConnMock());
		const restart = vi.fn().mockRejectedValueOnce(failure()).mockResolvedValue(undefined);

		restartIce(peerConn, restart);
		await vi.advanceTimersByTimeAsync(0);
		restartIce(peerConn, restart);
		expect(restart).toHaveBeenCalledTimes(1);

		await vi.advanceTimersByTimeAsync(ICE_RESTART_RETRY_MS);
		expect(restart).toHaveBeenCalledTimes(2);
	});
});

describe('restartIceWithOffer', () => {
	test('sends an ICE restart offer', async () => {
		const peerConn = createPeerConnMock();
		const sendOffer = vi.fn().mockResolvedValue(undefined);

		restartIceWithOffer(asPeerConn(peerConn), sendOffer);
		await vi.advanceTimersByTimeAsync(0);

		expect(peerConn.createOffer).toHaveBeenCalledWith({ iceRestart: true });
		expect(sendOffer).toHaveBeenCalledWith('restart-sdp');
	});

	test('rolls back the unanswered offer and sends a new one after 5 seconds', async () => {
		const peerConn = createPeerConnMock();
		const sendOffer = vi.fn().mockRejectedValueOnce(failure()).mockResolvedValue(undefined);

		restartIceWithOffer(asPeerConn(peerConn), sendOffer);
		await vi.advanceTimersByTimeAsync(0);
		expect(peerConn.setLocalDescription).toHaveBeenLastCalledWith({ type: 'rollback' });
		expect(peerConn.signalingState).toBe('stable');

		await vi.advanceTimersByTimeAsync(ICE_RESTART_RETRY_MS);
		expect(peerConn.createOffer).toHaveBeenCalledTimes(2);
		expect(sendOffer).toHaveBeenCalledTimes(2);
		expect(peerConn.signalingState).toBe('have-local-offer');
	});
});
