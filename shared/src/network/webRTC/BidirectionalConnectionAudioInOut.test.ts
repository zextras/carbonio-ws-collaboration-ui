/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import BidirectionalConnectionAudioInOut from './BidirectionalConnectionAudioInOut';
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
	localDescription: { sdp: 'sdp' }
});

const mockAudioStream = {
	getAudioTracks: (): { stop: () => void }[] => [{ stop: vi.fn() }]
} as unknown as MediaStream;

let peerConnMock: Record<string, unknown>;

const setPeerConnMock = (overrides: Partial<Record<string, unknown>> = {}): void => {
	peerConnMock = { ...createPeerConnMock(), ...overrides };
	Object.defineProperty(globalThis, 'RTCPeerConnection', {
		configurable: true,
		writable: true,
		value: vi.fn(function RTCPeerConnectionMock() {
			return peerConnMock;
		})
	});
};

beforeEach(() => {
	setPeerConnMock();
});

describe('BidirectionalConnectionAudioInOut', () => {
	test('Negotiates the audio offer on construction when audio is disabled', async () => {
		const createAudioOfferSpy = vi
			.spyOn(MeetingsApi, 'createAudioOffer')
			.mockResolvedValue({} as Response);
		const updateAudioStreamStatusSpy = vi
			.spyOn(MeetingsApi, 'updateAudioStreamStatus')
			.mockResolvedValue({} as Response);

		// eslint-disable-next-line no-new
		new BidirectionalConnectionAudioInOut(meetingId, false);
		await flushPromises();

		expect(createAudioOfferSpy).toHaveBeenCalledWith(meetingId, 'sdp');
		expect(updateAudioStreamStatusSpy).toHaveBeenCalledWith(meetingId, false);
		expect(mockGetStream).not.toHaveBeenCalled();
	});

	test('Acquires the audio stream on construction when audio is enabled', async () => {
		vi.spyOn(MeetingsApi, 'createAudioOffer').mockResolvedValue({} as Response);
		const updateAudioStreamStatusSpy = vi
			.spyOn(MeetingsApi, 'updateAudioStreamStatus')
			.mockResolvedValue({} as Response);
		mockGetStream.mockResolvedValue(mockAudioStream);

		// eslint-disable-next-line no-new
		new BidirectionalConnectionAudioInOut(meetingId, true, 'deviceId');
		await flushPromises();

		expect(mockGetStream).toHaveBeenCalledWith(STREAM_TYPE.AUDIO, 'deviceId');
		expect(updateAudioStreamStatusSpy).toHaveBeenCalledWith(meetingId, true);
	});

	test('Skips negotiation when the signaling state is not stable', async () => {
		setPeerConnMock({ signalingState: 'have-local-offer' });
		const createAudioOfferSpy = vi
			.spyOn(MeetingsApi, 'createAudioOffer')
			.mockResolvedValue({} as Response);

		// eslint-disable-next-line no-new
		new BidirectionalConnectionAudioInOut(meetingId, false);
		await flushPromises();

		expect(peerConnMock.createOffer).toHaveBeenCalled();
		expect(createAudioOfferSpy).not.toHaveBeenCalled();
	});

	test('Skips negotiation when the offer has no sdp', async () => {
		setPeerConnMock({ createOffer: vi.fn(() => Promise.resolve({ type: 'offer' })) });
		const createAudioOfferSpy = vi
			.spyOn(MeetingsApi, 'createAudioOffer')
			.mockResolvedValue({} as Response);

		// eslint-disable-next-line no-new
		new BidirectionalConnectionAudioInOut(meetingId, false);
		await flushPromises();

		expect(peerConnMock.setLocalDescription).toHaveBeenCalled();
		expect(createAudioOfferSpy).not.toHaveBeenCalled();
	});

	test('handleRemoteAnswer sets the remote description when not in have-remote-offer state', async () => {
		vi.spyOn(MeetingsApi, 'createAudioOffer').mockResolvedValue({} as Response);
		vi.spyOn(MeetingsApi, 'updateAudioStreamStatus').mockResolvedValue({} as Response);

		const conn = new BidirectionalConnectionAudioInOut(meetingId, false);
		await flushPromises();

		conn.handleRemoteAnswer({ sdp: 'sdp', type: 'answer' });
		expect(peerConnMock.setRemoteDescription).toHaveBeenCalled();
	});
});
