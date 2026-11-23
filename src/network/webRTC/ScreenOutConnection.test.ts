/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import ScreenOutConnection from './ScreenOutConnection';
import * as UserMediaManager from '../../utils/UserMediaManager';

const meetingId = 'meetingId';

const screenStream = {
	getVideoTracks: (): { stop: () => void }[] => [{ stop: vi.fn() }]
} as unknown as MediaStream;

let peerConnMock: Record<string, unknown>;

beforeEach(() => {
	peerConnMock = {
		addTrack: vi.fn(() => ({ track: { stop: vi.fn() }, replaceTrack: vi.fn() })),
		createOffer: vi.fn(() => Promise.resolve({ sdp: 'sdp', type: 'offer' })),
		setLocalDescription: vi.fn(() => Promise.resolve()),
		setRemoteDescription: vi.fn(() => Promise.resolve()),
		close: vi.fn(),
		signalingState: 'stable',
		connectionState: 'connected',
		localDescription: { sdp: 'sdp' }
	};
	Object.defineProperty(window, 'RTCPeerConnection', {
		configurable: true,
		writable: true,
		value: vi.fn(function RTCPeerConnectionMock() {
			return peerConnMock;
		})
	});
	vi.spyOn(UserMediaManager, 'getScreenStream').mockResolvedValue(screenStream);
});

const startScreenShare = async (): Promise<ScreenOutConnection> => {
	const conn = new ScreenOutConnection(meetingId);
	conn.startScreenShare();
	await vi.advanceTimersByTimeAsync(0);
	return conn;
};

describe('ScreenOutConnection — remote answer', () => {
	test('applies the answer to the pending offer', async () => {
		const conn = await startScreenShare();
		peerConnMock.signalingState = 'have-local-offer';

		conn.handleRemoteAnswer({ sdp: 'sdp', type: 'answer' });

		expect(peerConnMock.setRemoteDescription).toHaveBeenCalled();
	});

	test('ignores an answer when no offer is pending', async () => {
		const conn = await startScreenShare();

		conn.handleRemoteAnswer({ sdp: 'sdp', type: 'answer' });

		expect(peerConnMock.setRemoteDescription).not.toHaveBeenCalled();
	});

	test('ignores an answer once the screen share is closed', async () => {
		const conn = await startScreenShare();
		conn.closePeerConnection();

		conn.handleRemoteAnswer({ sdp: 'sdp', type: 'answer' });

		expect(peerConnMock.setRemoteDescription).not.toHaveBeenCalled();
	});

	test('logs an answer that cannot be applied', async () => {
		const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
		const conn = await startScreenShare();
		peerConnMock.signalingState = 'have-local-offer';
		const error = new Error('InvalidStateError');
		(peerConnMock.setRemoteDescription as ReturnType<typeof vi.fn>).mockRejectedValueOnce(error);

		conn.handleRemoteAnswer({ sdp: 'sdp', type: 'answer' });
		await vi.advanceTimersByTimeAsync(0);

		expect(consoleWarn).toHaveBeenCalledWith('setRemoteDescription failed', error);
	});
});
