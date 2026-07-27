/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import BidirectionalConnectionAudioInOut from './BidirectionalConnectionAudioInOut';
import * as UserMediaManager from '../../utils/UserMediaManager';
import * as MeetingsApi from '../apis/MeetingsApi';

const meetingId = 'meetingId';

const flushPromises = async (): Promise<void> => {
	for (let i = 0; i < 15; i += 1) {
		// eslint-disable-next-line no-await-in-loop
		await Promise.resolve();
	}
};

type MockAudioTrack = {
	stop: ReturnType<typeof vi.fn>;
	enabled: boolean;
	readyState: MediaStreamTrackState;
};

type MockSender = {
	track: unknown;
	replaceTrack: ReturnType<typeof vi.fn>;
};

const createMockAudioTrack = (readyState: MediaStreamTrackState = 'live'): MockAudioTrack => ({
	stop: vi.fn(),
	enabled: true,
	readyState
});

const createMockAudioStream = (track: MockAudioTrack): MediaStream =>
	({ getAudioTracks: (): Array<MockAudioTrack> => [track] }) as unknown as MediaStream;

let senderMock: MockSender;

// The sender keeps track of the last track passed to addTrack/replaceTrack
// so tests can assert on the identity and enabled state of the sender track
const createPeerConnMock = (): Record<string, unknown> => ({
	addTrack: vi.fn((track: unknown) => {
		senderMock.track = track;
		return senderMock;
	}),
	createOffer: vi.fn(() => Promise.resolve({ sdp: 'sdp', type: 'offer' })),
	setLocalDescription: vi.fn(() => Promise.resolve()),
	setRemoteDescription: vi.fn(() => Promise.resolve()),
	close: vi.fn(),
	signalingState: 'stable',
	connectionState: 'connected',
	localDescription: { sdp: 'sdp' }
});

let peerConnMock: Record<string, unknown>;

const setPeerConnMock = (overrides: Partial<Record<string, unknown>> = {}): void => {
	senderMock = {
		track: null,
		replaceTrack: vi.fn((track: unknown) => {
			senderMock.track = track;
			return Promise.resolve();
		})
	};
	peerConnMock = { ...createPeerConnMock(), ...overrides };
	Object.defineProperty(window, 'RTCPeerConnection', {
		configurable: true,
		writable: true,
		value: vi.fn(function RTCPeerConnectionMock() {
			return peerConnMock;
		})
	});
};

// In the test environment the oscillator placeholder track resolves to the
// window.MediaStream mock function itself (see setupTests): glue on it the
// track API the connection uses when replacing the placeholder
const placeholderTrack = window.MediaStream as unknown as MockAudioTrack;

beforeEach(() => {
	Object.assign(window.MediaStream, { stop: vi.fn(), readyState: 'live' });
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
		const getAudioStreamSpy = vi
			.spyOn(UserMediaManager, 'getAudioStream')
			.mockResolvedValue(createMockAudioStream(createMockAudioTrack()));

		// eslint-disable-next-line no-new
		new BidirectionalConnectionAudioInOut(meetingId, false);
		await flushPromises();

		expect(createAudioOfferSpy).toHaveBeenCalledWith(meetingId, 'sdp');
		expect(updateAudioStreamStatusSpy).toHaveBeenCalledWith(meetingId, false);
		// Audio stream is always acquired to keep Bluetooth HFP profile active
		expect(getAudioStreamSpy).toHaveBeenCalled();
	});

	test('Acquires the audio stream on construction when audio is enabled', async () => {
		vi.spyOn(MeetingsApi, 'createAudioOffer').mockResolvedValue({} as Response);
		const updateAudioStreamStatusSpy = vi
			.spyOn(MeetingsApi, 'updateAudioStreamStatus')
			.mockResolvedValue({} as Response);
		const getAudioStreamSpy = vi
			.spyOn(UserMediaManager, 'getAudioStream')
			.mockResolvedValue(createMockAudioStream(createMockAudioTrack()));

		// eslint-disable-next-line no-new
		new BidirectionalConnectionAudioInOut(meetingId, true, 'deviceId');
		await flushPromises();

		expect(getAudioStreamSpy).toHaveBeenCalledWith('deviceId');
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

	test('Acquires the audio stream but keeps the track disabled when joining muted', async () => {
		vi.spyOn(MeetingsApi, 'createAudioOffer').mockResolvedValue({} as Response);
		vi.spyOn(MeetingsApi, 'updateAudioStreamStatus').mockResolvedValue({} as Response);
		const track = createMockAudioTrack();
		vi.spyOn(UserMediaManager, 'getAudioStream').mockResolvedValue(createMockAudioStream(track));

		// eslint-disable-next-line no-new
		new BidirectionalConnectionAudioInOut(meetingId, false);
		await flushPromises();

		expect(senderMock.track).toBe(track);
		expect(track.enabled).toBe(false);
	});

	test('muteAudioTrack disables the sender track without stopping it', async () => {
		vi.spyOn(MeetingsApi, 'createAudioOffer').mockResolvedValue({} as Response);
		vi.spyOn(MeetingsApi, 'updateAudioStreamStatus').mockResolvedValue({} as Response);
		const track = createMockAudioTrack();
		vi.spyOn(UserMediaManager, 'getAudioStream').mockResolvedValue(createMockAudioStream(track));

		const conn = new BidirectionalConnectionAudioInOut(meetingId, true);
		await flushPromises();
		expect(track.enabled).toBe(true);

		conn.muteAudioTrack();

		expect(track.enabled).toBe(false);
		expect(track.stop).not.toHaveBeenCalled();
	});

	test('unmuteAudioTrack re-enables the live microphone track without a new acquisition', async () => {
		vi.spyOn(MeetingsApi, 'createAudioOffer').mockResolvedValue({} as Response);
		vi.spyOn(MeetingsApi, 'updateAudioStreamStatus').mockResolvedValue({} as Response);
		const track = createMockAudioTrack();
		const getAudioStreamSpy = vi
			.spyOn(UserMediaManager, 'getAudioStream')
			.mockResolvedValue(createMockAudioStream(track));

		const conn = new BidirectionalConnectionAudioInOut(meetingId, true);
		await flushPromises();
		conn.muteAudioTrack();

		await conn.unmuteAudioTrack();

		expect(track.enabled).toBe(true);
		// Only the acquisition done by init(), none on unmute
		expect(getAudioStreamSpy).toHaveBeenCalledTimes(1);
	});

	test('unmuteAudioTrack acquires a new stream when the sender track has ended', async () => {
		vi.spyOn(MeetingsApi, 'createAudioOffer').mockResolvedValue({} as Response);
		vi.spyOn(MeetingsApi, 'updateAudioStreamStatus').mockResolvedValue({} as Response);
		const initTrack = createMockAudioTrack();
		const newTrack = createMockAudioTrack();
		const getAudioStreamSpy = vi
			.spyOn(UserMediaManager, 'getAudioStream')
			.mockResolvedValueOnce(createMockAudioStream(initTrack))
			.mockResolvedValueOnce(createMockAudioStream(newTrack));

		const conn = new BidirectionalConnectionAudioInOut(meetingId, true);
		await flushPromises();
		conn.muteAudioTrack();
		initTrack.readyState = 'ended';

		await conn.unmuteAudioTrack();

		expect(getAudioStreamSpy).toHaveBeenCalledTimes(2);
		expect(senderMock.track).toBe(newTrack);
		expect(newTrack.enabled).toBe(true);
	});

	test('unmuteAudioTrack acquires the microphone instead of enabling the oscillator placeholder', async () => {
		// init() logs the failed acquisition
		const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});
		vi.spyOn(MeetingsApi, 'createAudioOffer').mockResolvedValue({} as Response);
		vi.spyOn(MeetingsApi, 'updateAudioStreamStatus').mockResolvedValue({} as Response);
		const micTrack = createMockAudioTrack();
		const getAudioStreamSpy = vi
			.spyOn(UserMediaManager, 'getAudioStream')
			.mockRejectedValueOnce(new Error('Permission denied'))
			.mockResolvedValueOnce(createMockAudioStream(micTrack));

		// init() fails to acquire the microphone: the sender track is still the placeholder
		const conn = new BidirectionalConnectionAudioInOut(meetingId, false);
		await flushPromises();
		expect(consoleWarn).toHaveBeenCalled();
		expect(senderMock.track).toBe(placeholderTrack);

		await conn.unmuteAudioTrack();

		expect(getAudioStreamSpy).toHaveBeenCalledTimes(2);
		expect(senderMock.track).toBe(micTrack);
		expect(micTrack.enabled).toBe(true);
		// The oscillator placeholder must never be enabled
		expect(placeholderTrack.enabled).toBe(false);
	});

	test('Unmute requested while init is still acquiring the microphone ends with an enabled track', async () => {
		vi.spyOn(MeetingsApi, 'createAudioOffer').mockResolvedValue({} as Response);
		vi.spyOn(MeetingsApi, 'updateAudioStreamStatus').mockResolvedValue({} as Response);
		const initTrack = createMockAudioTrack();
		const unmuteTrack = createMockAudioTrack();
		let resolveInitStream: ((stream: MediaStream) => void) | undefined;
		vi.spyOn(UserMediaManager, 'getAudioStream')
			.mockImplementationOnce(
				() =>
					new Promise((resolve) => {
						resolveInitStream = resolve;
					})
			)
			.mockResolvedValueOnce(createMockAudioStream(unmuteTrack));

		const conn = new BidirectionalConnectionAudioInOut(meetingId, false);
		await flushPromises();

		// The user unmutes while init() is still acquiring the microphone
		const unmutePromise = conn.unmuteAudioTrack();
		resolveInitStream?.(createMockAudioStream(initTrack));
		await unmutePromise;
		await flushPromises();

		// Whichever acquisition wins, the sender track must end up enabled
		expect((senderMock.track as MockAudioTrack).enabled).toBe(true);
	});
});
