/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import ScreenOutConnection from './ScreenOutConnection';
import useStore from '../../store/Store';
import { STREAM_TYPE } from '../../types/store/ActiveMeetingTypes';
import { Version } from '../../types/store/SessionTypes';
import * as UserMediaManager from '../../utils/UserMediaManager';
import * as MeetingsApi from '../apis/MeetingsApi';

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

describe('ScreenOutConnection', () => {
	test('sends the screen offer when a negotiation is needed', async () => {
		const updateMediaOfferSpy = vi
			.spyOn(MeetingsApi, 'updateMediaOffer')
			.mockResolvedValue({} as Response);
		await startScreenShare();

		(peerConnMock.onnegotiationneeded as () => void)();
		await vi.advanceTimersByTimeAsync(0);

		expect(updateMediaOfferSpy).toHaveBeenCalledWith(meetingId, STREAM_TYPE.SCREEN, true, 'sdp');
	});

	test('stopScreenShare closes the connection and notifies the server', async () => {
		const updateMediaOfferSpy = vi
			.spyOn(MeetingsApi, 'updateMediaOffer')
			.mockResolvedValue({} as Response);
		const conn = await startScreenShare();

		conn.stopScreenShare();

		expect(peerConnMock.close).toHaveBeenCalled();
		expect(conn.peerConn).toBeNull();
		expect(updateMediaOfferSpy).toHaveBeenCalledWith(meetingId, STREAM_TYPE.SCREEN, false);
	});
});

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

describe('ScreenOutConnection — ICE restart', () => {
	const shareScreen = async (apiVersion: Version): Promise<void> => {
		useStore.getState().setApiVersion(apiVersion);
		await startScreenShare();
	};

	const failConnection = (): void => {
		peerConnMock.connectionState = 'failed';
		(peerConnMock.onconnectionstatechange as () => void)();
	};

	beforeEach(() => {
		vi.spyOn(console, 'warn').mockImplementation(() => undefined);
	});

	afterEach(() => {
		vi.clearAllTimers();
	});

	test('sends a new ICE restart offer 5 seconds after a failed one', async () => {
		const screenIceRestartSpy = vi
			.spyOn(MeetingsApi, 'screenIceRestart')
			.mockRejectedValueOnce(new Error('status ko'))
			.mockResolvedValue({} as Response);
		await shareScreen('1.6.13');

		failConnection();
		await vi.advanceTimersByTimeAsync(6_000);

		expect(peerConnMock.createOffer).toHaveBeenCalledWith({ iceRestart: true });
		expect(screenIceRestartSpy.mock.calls).toEqual([
			[meetingId, 'sdp'],
			[meetingId, 'sdp']
		]);
	});

	test('does not restart ICE before API 1.6.13', async () => {
		const screenIceRestartSpy = vi.spyOn(MeetingsApi, 'screenIceRestart');
		await shareScreen('1.6.12');

		failConnection();
		await vi.advanceTimersByTimeAsync(6_000);

		expect(peerConnMock.createOffer).not.toHaveBeenCalledWith({ iceRestart: true });
		expect(screenIceRestartSpy).not.toHaveBeenCalled();
	});
});
