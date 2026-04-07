/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { act, renderHook } from '@testing-library/react';

import useWebRTCStats, { computeAverageQuality, computeQuality } from './useWebRTCStats';
import useStore from '../store/Store';
import { createMockMeeting, createMockParticipants } from '../tests/createMock';
import { NetworkQualityLevel } from '../types/store/ActiveMeetingTypes';

const meeting = createMockMeeting({ participants: [createMockParticipants({ userId: 'userId' })] });

const makeStatsMock = (reports: RTCStats[]): Promise<RTCStatsReport> =>
	Promise.resolve({
		forEach: (fn: (report: RTCStats) => void) => reports.forEach(fn)
	} as unknown as RTCStatsReport);

describe('computeQuality', () => {
	test('returns UNKNOWN when both rtt and fractionLost are undefined', () => {
		expect(computeQuality(undefined, undefined)).toBe(NetworkQualityLevel.UNKNOWN);
	});

	test('returns GOOD when rtt < 150 ms and fractionLost < 2%', () => {
		expect(computeQuality(100, 0.01)).toBe(NetworkQualityLevel.GOOD);
	});

	test('returns FAIR when rtt < 300 ms and fractionLost < 5%', () => {
		expect(computeQuality(200, 0.04)).toBe(NetworkQualityLevel.FAIR);
	});

	test('returns POOR when rtt is >= 300 ms', () => {
		expect(computeQuality(350, 0.01)).toBe(NetworkQualityLevel.POOR);
	});

	test('returns POOR when fractionLost is >= 5%', () => {
		expect(computeQuality(100, 0.06)).toBe(NetworkQualityLevel.POOR);
	});

	test('returns GOOD when only rtt is provided and below threshold', () => {
		expect(computeQuality(50, undefined)).toBe(NetworkQualityLevel.GOOD);
	});

	test('returns GOOD when only fractionLost is provided and below threshold', () => {
		expect(computeQuality(undefined, 0.01)).toBe(NetworkQualityLevel.GOOD);
	});
});

describe('computeAverageQuality', () => {
	test('returns UNKNOWN for an empty history', () => {
		expect(computeAverageQuality([])).toBe(NetworkQualityLevel.UNKNOWN);
	});

	test('returns GOOD when all samples are good', () => {
		const history = [
			{ rtt: 80, fractionLost: 0.01 },
			{ rtt: 90, fractionLost: 0.01 },
			{ rtt: 100, fractionLost: 0.01 }
		];
		expect(computeAverageQuality(history)).toBe(NetworkQualityLevel.GOOD);
	});

	test('returns POOR when average exceeds POOR thresholds', () => {
		const history = [
			{ rtt: 400, fractionLost: 0.1 },
			{ rtt: 350, fractionLost: 0.08 },
			{ rtt: 500, fractionLost: 0.12 }
		];
		expect(computeAverageQuality(history)).toBe(NetworkQualityLevel.POOR);
	});

	test('smooths out a single spike with 4 good samples', () => {
		const history = [
			{ rtt: 80, fractionLost: 0.01 },
			{ rtt: 80, fractionLost: 0.01 },
			{ rtt: 80, fractionLost: 0.01 },
			{ rtt: 80, fractionLost: 0.01 },
			{ rtt: 500, fractionLost: 0.15 }
		];
		// avg rtt = (80*4+500)/5 = 420/5 = 164, avg loss = (0.01*4+0.15)/5 = 0.038 -> FAIR
		expect(computeAverageQuality(history)).toBe(NetworkQualityLevel.FAIR);
	});

	test('handles samples with undefined rtt or fractionLost gracefully', () => {
		const history = [{ rtt: undefined, fractionLost: undefined }];
		expect(computeAverageQuality(history)).toBe(NetworkQualityLevel.UNKNOWN);
	});
});

describe('useWebRTCStats hook', () => {
	let mockGetStats: ReturnType<typeof vi.fn>;
	let mockSetParameters: ReturnType<typeof vi.fn>;
	let mockGetParameters: ReturnType<typeof vi.fn>;
	let mockAddTrack: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		mockGetStats = vi.fn(() =>
			makeStatsMock([
				{
					type: 'remote-inbound-rtp',
					kind: 'audio',
					roundTripTime: 0.08,
					fractionLost: 0.01,
					id: 'rtp-audio',
					timestamp: Date.now()
				} as unknown as RTCStats
			])
		);

		mockSetParameters = vi.fn(() => Promise.resolve());
		mockGetParameters = vi.fn(() => ({ encodings: [{}] }));
		mockAddTrack = vi.fn(() => ({
			getParameters: mockGetParameters,
			setParameters: mockSetParameters
		}));

		// window.RTCPeerConnection is already a vi.fn() defined in setupTests.ts.
		// We use mockImplementation to inject getStats into every new instance that
		// will be created by the connection classes inside meetingConnection.
		vi.mocked(window.RTCPeerConnection).mockImplementation(function () {
			return {
				ontrack: null,
				onnegotiationneeded: null,
				oniceconnectionstatechange: null,
				addTrack: mockAddTrack,
				createAnswer: vi.fn(() => Promise.resolve({ sdp: '', type: 'answer' })),
				setRemoteDescription: vi.fn(() => Promise.resolve()),
				setLocalDescription: vi.fn(() => Promise.resolve()),
				getStats: mockGetStats
			} as unknown as RTCPeerConnection;
		});

		const store = useStore.getState();
		store.setLoginInfo('userId', 'User');
		store.addMeetings([meeting]);
		store.meetingConnection(meeting.id);
	});

	test('updates networkStats in the store after the first poll interval', async () => {
		renderHook(() => useWebRTCStats(meeting.id));

		await act(async () => {
			await vi.advanceTimersByTimeAsync(4000);
		});

		const stats = useStore.getState().activeMeeting?.networkStats;
		expect(stats).toBeDefined();
		expect(stats?.quality).toBe(NetworkQualityLevel.GOOD);
		expect(stats?.rtt).toBeCloseTo(80); // 0.08 s × 1000
		expect(stats?.fractionLost).toBe(0.01);
	});

	test('polls repeatedly on each interval', async () => {
		renderHook(() => useWebRTCStats(meeting.id));

		await act(async () => {
			await vi.advanceTimersByTimeAsync(4000);
		});
		expect(mockGetStats).toHaveBeenCalledTimes(1);

		await act(async () => {
			await vi.advanceTimersByTimeAsync(4000);
		});
		expect(mockGetStats).toHaveBeenCalledTimes(2);
	});

	test('clears the interval when the hook unmounts', async () => {
		const { unmount } = renderHook(() => useWebRTCStats(meeting.id));
		unmount();

		await act(async () => {
			await vi.advanceTimersByTimeAsync(4000);
		});

		expect(mockGetStats).not.toHaveBeenCalled();
	});

	test('does nothing when there is no active meeting matching the meetingId', async () => {
		renderHook(() => useWebRTCStats('non-existent-meeting-id'));

		await act(async () => {
			await vi.advanceTimersByTimeAsync(4000);
		});

		expect(mockGetStats).not.toHaveBeenCalled();
		expect(useStore.getState().activeMeeting?.networkStats).toBeUndefined();
	});

	test('reports POOR quality when RTT is high', async () => {
		mockGetStats.mockImplementation(() =>
			makeStatsMock([
				{
					type: 'remote-inbound-rtp',
					kind: 'audio',
					roundTripTime: 0.5,
					fractionLost: 0.08,
					id: 'rtp-audio',
					timestamp: Date.now()
				} as unknown as RTCStats
			])
		);

		renderHook(() => useWebRTCStats(meeting.id));

		await act(async () => {
			await vi.advanceTimersByTimeAsync(4000);
		});

		expect(useStore.getState().activeMeeting?.networkStats?.quality).toBe(
			NetworkQualityLevel.POOR
		);
	});

	test('handles getStats rejection gracefully without throwing', async () => {
		mockGetStats.mockImplementation(() => Promise.reject(new Error('Controlled error')));

		renderHook(() => useWebRTCStats(meeting.id));

		await act(async () => {
			await vi.advanceTimersByTimeAsync(4000);
		});

		// No network stats update on failure — existing value (undefined) remains
		expect(useStore.getState().activeMeeting?.networkStats).toBeUndefined();
	});

	test('applies POOR quality settings (maxBitrate 10_000, scaleResolutionDownBy 5 for video) when quality is POOR', async () => {
		mockGetStats.mockImplementation(() =>
			makeStatsMock([
				{
					type: 'remote-inbound-rtp',
					kind: 'audio',
					roundTripTime: 0.5,
					fractionLost: 0.08,
					id: 'rtp-audio',
					timestamp: Date.now()
				} as unknown as RTCStats
			])
		);

		// Initialize with video enabled so the video rtpSender is set up
		const store = useStore.getState();
		store.meetingDisconnection(meeting.id);
		store.meetingConnection(meeting.id, { enabled: false }, { enabled: true });

		// Flush getUserMedia promise so VideoOutConnection.rtpSender is initialized
		await act(async () => {});

		renderHook(() => useWebRTCStats(meeting.id));

		await act(async () => {
			await vi.advanceTimersByTimeAsync(4000);
		});

		expect(mockSetParameters).toHaveBeenCalled();
		const videoCall = mockSetParameters.mock.calls.find(
			([params]) => params.encodings?.[0]?.scaleResolutionDownBy === 5
		);
		expect(videoCall).toBeDefined();
		const audioCall = mockSetParameters.mock.calls.find(
			([params]) => params.encodings?.[0]?.maxBitrate === 10_000
		);
		expect(audioCall).toBeDefined();
	});

	test('applies FAIR quality settings (maxBitrate 20_000, scaleResolutionDownBy 2 for video) when quality is FAIR', async () => {
		mockGetStats.mockImplementation(() =>
			makeStatsMock([
				{
					type: 'remote-inbound-rtp',
					kind: 'audio',
					roundTripTime: 0.25,
					fractionLost: 0.03,
					id: 'rtp-audio',
					timestamp: Date.now()
				} as unknown as RTCStats
			])
		);

		const store = useStore.getState();
		store.meetingDisconnection(meeting.id);
		store.meetingConnection(meeting.id, { enabled: false }, { enabled: true });

		await act(async () => {});

		renderHook(() => useWebRTCStats(meeting.id));

		await act(async () => {
			await vi.advanceTimersByTimeAsync(4000);
		});

		expect(mockSetParameters).toHaveBeenCalled();
		const videoCall = mockSetParameters.mock.calls.find(
			([params]) => params.encodings?.[0]?.scaleResolutionDownBy === 2
		);
		expect(videoCall).toBeDefined();
		const audioCall = mockSetParameters.mock.calls.find(
			([params]) => params.encodings?.[0]?.maxBitrate === 20_000
		);
		expect(audioCall).toBeDefined();
	});

	test('does not call setParameters again when quality stays the same between polls', async () => {
		mockGetStats.mockImplementation(() =>
			makeStatsMock([
				{
					type: 'remote-inbound-rtp',
					kind: 'audio',
					roundTripTime: 0.5,
					fractionLost: 0.08,
					id: 'rtp-audio',
					timestamp: Date.now()
				} as unknown as RTCStats
			])
		);

		renderHook(() => useWebRTCStats(meeting.id));

		await act(async () => {
			await vi.advanceTimersByTimeAsync(4000);
		});

		const callsAfterFirstInterval = mockSetParameters.mock.calls.length;

		await act(async () => {
			await vi.advanceTimersByTimeAsync(4000);
		});

		expect(mockSetParameters.mock.calls.length).toBe(callsAfterFirstInterval);
	});

	test('does not reduce quality when network is GOOD', async () => {
		renderHook(() => useWebRTCStats(meeting.id));

		await act(async () => {
			await vi.advanceTimersByTimeAsync(4000);
		});

		expect(useStore.getState().activeMeeting?.networkStats?.quality).toBe(
			NetworkQualityLevel.GOOD
		);
		expect(mockSetParameters).not.toHaveBeenCalled();
	});

	test('restores original quality settings when quality improves back to GOOD', async () => {
		// First, establish POOR quality
		mockGetStats.mockImplementation(() =>
			makeStatsMock([
				{
					type: 'remote-inbound-rtp',
					kind: 'audio',
					roundTripTime: 0.5,
					fractionLost: 0.08,
					id: 'rtp-audio',
					timestamp: Date.now()
				} as unknown as RTCStats
			])
		);

		const store = useStore.getState();
		store.meetingDisconnection(meeting.id);
		store.meetingConnection(meeting.id, { enabled: false }, { enabled: true });

		await act(async () => {});

		renderHook(() => useWebRTCStats(meeting.id));

		await act(async () => {
			await vi.advanceTimersByTimeAsync(4000);
		});

		const callsAfterPoor = mockSetParameters.mock.calls.length;
		expect(callsAfterPoor).toBeGreaterThan(0);

		// Switch to GOOD quality
		mockGetStats.mockImplementation(() =>
			makeStatsMock([
				{
					type: 'remote-inbound-rtp',
					kind: 'audio',
					roundTripTime: 0.08,
					fractionLost: 0.01,
					id: 'rtp-audio',
					timestamp: Date.now()
				} as unknown as RTCStats
			])
		);

		await act(async () => {
			await vi.advanceTimersByTimeAsync(4000);
		});

		// setParameters should have been called again to restore original settings
		expect(mockSetParameters.mock.calls.length).toBeGreaterThan(callsAfterPoor);
	});

	test('rolling buffer keeps only the last 5 samples', async () => {
		// 4 GOOD samples followed by 1 POOR sample: average should be FAIR (not POOR)
		let callCount = 0;
		mockGetStats.mockImplementation(() => {
			callCount += 1;
			const isPoor = callCount === 5;
			return makeStatsMock([
				{
					type: 'remote-inbound-rtp',
					kind: 'audio',
					roundTripTime: isPoor ? 0.5 : 0.08, // seconds; 500 ms : 80 ms
					fractionLost: isPoor ? 0.08 : 0.01,
					id: 'rtp-audio',
					timestamp: Date.now()
				} as unknown as RTCStats
			]);
		});

		renderHook(() => useWebRTCStats(meeting.id));

		// Advance through 5 poll intervals
		await act(async () => {
			await vi.advanceTimersByTimeAsync(20000);
		});

		// With 4 good + 1 poor sample: avg rtt = (80*4+500)/5=164ms, avg loss = (0.01*4+0.08)/5=0.024
		// 164ms < 300 and 0.024 < 0.05 => FAIR
		const stats = useStore.getState().activeMeeting?.networkStats;
		expect(stats?.quality).toBe(NetworkQualityLevel.FAIR);
	});
});
