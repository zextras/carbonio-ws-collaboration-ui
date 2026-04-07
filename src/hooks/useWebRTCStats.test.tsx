/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { act, renderHook } from '@testing-library/react';

import useWebRTCStats, { computeQuality } from './useWebRTCStats';
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

describe('useWebRTCStats hook', () => {
let mockGetStats: ReturnType<typeof vi.fn>;

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

// window.RTCPeerConnection is already a vi.fn() defined in setupTests.ts.
// We use mockImplementation to inject getStats into every new instance that
// will be created by the connection classes inside meetingConnection.
vi.mocked(window.RTCPeerConnection).mockImplementation(function () {
return {
ontrack: null,
onnegotiationneeded: null,
oniceconnectionstatechange: null,
addTrack: vi.fn(),
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
});
