/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import VideoOutConnection from './VideoOutConnection';
import useStore from '../../store/Store';
import { STREAM_TYPE } from '../../types/store/ActiveMeetingTypes';
import { RootStore } from '../../types/store/StoreTypes';
import * as UserMediaManager from '../../utils/UserMediaManager';
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
	addTransceiver: vi.fn(() => ({
		sender: { track: null },
		setCodecPreferences: vi.fn()
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
	Object.defineProperty(window, 'RTCPeerConnection', {
		configurable: true,
		writable: true,
		value: vi.fn(function RTCPeerConnectionMock() {
			return peerConnMock;
		})
	});
});

describe('VideoOutConnection', () => {
	test('Does not start video when video stream is disabled', () => {
		const getVideoStreamSpy = vi.spyOn(UserMediaManager, 'getVideoStream');
		const conn = new VideoOutConnection(meetingId, false);
		expect(conn.peerConn).toBeNull();
		expect(getVideoStreamSpy).not.toHaveBeenCalled();
	});

	test('Starts video on construction when enabled and negotiates the offer', async () => {
		vi.spyOn(UserMediaManager, 'getVideoStream').mockResolvedValue(mockVideoStream);
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
		vi.spyOn(UserMediaManager, 'getVideoStream').mockRejectedValue(new Error('Controlled error'));

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
		vi.spyOn(UserMediaManager, 'getVideoStream').mockResolvedValue(mockVideoStream);
		vi.spyOn(MeetingsApi, 'updateMediaOffer').mockResolvedValue({} as Response);

		const conn = new VideoOutConnection(meetingId, true);
		await flushPromises();

		conn.handleRemoteAnswer({ sdp: 'sdp', type: 'answer' });
		expect(peerConnMock.setRemoteDescription).toHaveBeenCalled();
	});
});

describe('VideoOutConnection — simulcast layers after a track change', () => {
	type FakeSender = {
		track: MediaStreamTrack | null;
		encodings: RTCRtpEncodingParameters[];
		replaceTrack: ReturnType<typeof vi.fn>;
		getParameters: ReturnType<typeof vi.fn>;
		setParameters: ReturnType<typeof vi.fn>;
	};

	const cameraStream = (height: number): MediaStream => {
		const track = { getSettings: () => ({ height }), stop: vi.fn() };
		return { getVideoTracks: () => [track] } as unknown as MediaStream;
	};

	const layers = (sender: FakeSender): Record<string, { scale?: number; active?: boolean }> =>
		Object.fromEntries(
			sender.encodings.map((e) => [
				e.rid,
				{ scale: e.scaleResolutionDownBy, active: e.active ?? true }
			])
		);

	const startCamera = async (
		height: number
	): Promise<{ conn: VideoOutConnection; sender: FakeSender }> => {
		const sender: FakeSender = {
			track: null,
			encodings: [],
			replaceTrack: vi.fn(async (track: MediaStreamTrack) => {
				sender.track = track;
			}),
			getParameters: vi.fn(() => ({ encodings: sender.encodings.map((e) => ({ ...e })) })),
			setParameters: vi.fn(async (params: RTCRtpSendParameters) => {
				sender.encodings = params.encodings;
			})
		};
		peerConnMock = createPeerConnMock({
			addTransceiver: vi.fn((track: MediaStreamTrack, init: RTCRtpTransceiverInit) => {
				sender.track = track;
				sender.encodings = (init.sendEncodings ?? []).map((e) => ({ ...e }));
				return { sender, setCodecPreferences: vi.fn() };
			})
		});
		vi.spyOn(UserMediaManager, 'getVideoStream').mockResolvedValue(cameraStream(height));
		vi.spyOn(MeetingsApi, 'updateMediaOffer').mockResolvedValue({} as Response);
		const conn = new VideoOutConnection(meetingId, false);
		await conn.startVideo();
		return { conn, sender };
	};

	beforeEach(() => {
		useStore.setState({
			session: {
				id: 'me',
				attributes: {
					videoSimulcastTiers: [
						{ name: 'low', height: 144 },
						{ name: 'medium', height: 360 },
						{ name: 'high', height: 720 }
					]
				}
			}
		} as unknown as RootStore);
	});

	test('a lower-resolution camera keeps the layers at their tier height and switches off the top one', async () => {
		const { conn, sender } = await startCamera(720);
		expect(layers(sender)).toEqual({
			l: { scale: 5, active: true },
			m: { scale: 2, active: true },
			h: { scale: 1, active: true }
		});

		await conn.updateLocalStreamTrack(cameraStream(360));
		await flushPromises();

		expect(layers(sender)).toEqual({
			l: { scale: 2.5, active: true },
			m: { scale: 1, active: true },
			h: { scale: 1, active: false }
		});
	});

	test('a higher-resolution camera keeps the negotiated layers at their tier height', async () => {
		const { conn, sender } = await startCamera(360);

		await conn.updateLocalStreamTrack(cameraStream(720));
		await flushPromises();

		expect(layers(sender)).toEqual({
			l: { scale: 5, active: true },
			m: { scale: 2, active: true }
		});
	});

	test('a camera shorter than every layer keeps the lowest one active at its own size', async () => {
		const { conn, sender } = await startCamera(720);

		await conn.updateLocalStreamTrack(cameraStream(120));
		await flushPromises();

		expect(layers(sender)).toEqual({
			l: { scale: 1, active: true },
			m: { scale: 1, active: false },
			h: { scale: 1, active: false }
		});
	});

	test('the virtual background track does not rescale the layers', async () => {
		const { conn, sender } = await startCamera(720);

		await conn.updateLocalStreamTrack(cameraStream(150), true);
		await flushPromises();

		expect(sender.setParameters).not.toHaveBeenCalled();
	});

	test('publishes the simulcast layers through a transceiver when tiers are configured', async () => {
		await startCamera(720);

		expect(peerConnMock.addTransceiver).toHaveBeenCalled();
		expect(peerConnMock.addTrack).not.toHaveBeenCalled();
	});

	test.each([
		['no tiers are configured', undefined, 720],
		['the tier list is empty', [], 720],
		['the camera is shorter than every tier', [{ name: 'low', height: 144 }], 120]
	])('publishes a plain track without rid when %s', async (_, tiers, height) => {
		useStore.setState({
			session: { id: 'me', attributes: { videoSimulcastTiers: tiers } }
		} as unknown as RootStore);
		const { conn } = await startCamera(height);

		expect(peerConnMock.addTrack).toHaveBeenCalledTimes(1);
		expect(peerConnMock.addTransceiver).not.toHaveBeenCalled();
		expect(conn.sendTiers).toBeUndefined();
		expect(conn.rtpSender).not.toBeNull();
	});
});
