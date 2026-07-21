/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import VideoOutConnection from './VideoOutConnection';
import { mockGetStream } from '../../tests/setupTests';
import { STREAM_TYPE } from '../../types/store/ActiveMeetingTypes';
import * as MeetingsApi from '../apis/MeetingsApi';

const meetingId = 'meetingId';

const flushPromises = async (): Promise<void> => {
	for (let i = 0; i < 15; i += 1) {
		// eslint-disable-next-line no-await-in-loop
		await Promise.resolve();
	}
};

const createPeerConnMock = (
	overrides: Partial<Record<string, unknown>> = {}
): Record<string, unknown> => ({
	addTrack: vi.fn(() => ({
		track: { stop: vi.fn() },
		replaceTrack: vi.fn(() => Promise.resolve())
	})),
	createOffer: vi.fn(() => Promise.resolve({ sdp: 'sdp', type: 'offer' })),
	setLocalDescription: vi.fn(() => Promise.resolve()),
	setRemoteDescription: vi.fn(() => Promise.resolve()),
	close: vi.fn(),
	signalingState: 'stable',
	connectionState: 'connected',
	localDescription: { sdp: 'sdp' },
	...overrides
});

const mockVideoStream = {
	getVideoTracks: (): { stop: () => void }[] => [{ stop: vi.fn() }]
} as unknown as MediaStream;

let peerConnMock: Record<string, unknown>;

beforeEach(() => {
	peerConnMock = createPeerConnMock();
	Object.defineProperty(globalThis, 'RTCPeerConnection', {
		configurable: true,
		writable: true,
		value: vi.fn(function RTCPeerConnectionMock() {
			return peerConnMock;
		})
	});
});

describe('VideoOutConnection', () => {
	test('Does not start video when video stream is disabled', () => {
		const conn = new VideoOutConnection(meetingId, false);
		expect(conn.peerConn).toBeNull();
		expect(mockGetStream).not.toHaveBeenCalled();
	});

	test('Starts video on construction when enabled and negotiates the offer', async () => {
		mockGetStream.mockResolvedValue(mockVideoStream);
		const updateMediaOfferSpy = vi
			.spyOn(MeetingsApi, 'updateMediaOffer')
			.mockResolvedValue({} as Response);

		const conn = new VideoOutConnection(meetingId, true, 'deviceId');
		await flushPromises();

		expect(conn.peerConn).not.toBeNull();
		expect(peerConnMock.createOffer).toHaveBeenCalled();
		expect(peerConnMock.setLocalDescription).toHaveBeenCalled();
		expect(updateMediaOfferSpy).toHaveBeenCalledWith(meetingId, STREAM_TYPE.VIDEO, true, 'sdp');
	});

	test('startVideo rejects and closes the peer connection when getVideoStream fails', async () => {
		mockGetStream.mockRejectedValue(new Error('Controlled error'));

		const conn = new VideoOutConnection(meetingId, false);
		await expect(conn.startVideo('deviceId')).rejects.toThrow('Error while starting video');
		expect(conn.peerConn).toBeNull();
	});

	test('stopVideo closes the connection and notifies the server', async () => {
		const updateMediaOfferSpy = vi
			.spyOn(MeetingsApi, 'updateMediaOffer')
			.mockResolvedValue({} as Response);

		const conn = new VideoOutConnection(meetingId, false);
		await conn.stopVideo();

		expect(conn.peerConn).toBeNull();
		expect(updateMediaOfferSpy).toHaveBeenCalledWith(meetingId, STREAM_TYPE.VIDEO, false);
	});

	test('handleRemoteAnswer sets the remote description', async () => {
		mockGetStream.mockResolvedValue(mockVideoStream);
		vi.spyOn(MeetingsApi, 'updateMediaOffer').mockResolvedValue({} as Response);

		const conn = new VideoOutConnection(meetingId, true);
		await flushPromises();

		conn.handleRemoteAnswer({ sdp: 'sdp', type: 'answer' });
		expect(peerConnMock.setRemoteDescription).toHaveBeenCalled();
	});
});
