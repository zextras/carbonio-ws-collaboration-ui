/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { EVIDENCE_DOWN_N, EVIDENCE_UP_N, TOP_RUNG } from './inboundQualityController';
import VideoScreenInConnection from './VideoScreenInConnection';
import { STREAM_TYPE } from '../../types/store/ActiveMeetingTypes';
import { clearStreamCaps, setDownloadCap } from '../../utils/debugStreamCaps';
import * as MeetingsApi from '../apis/MeetingsApi';

const MEETING_ID = 'test-meeting';
const USER_1 = 'user1';
const USER_2 = 'user2';
const FEED_KEY_1 = `${USER_1}-${STREAM_TYPE.VIDEO}`;
const FEED_KEY_2 = `${USER_2}-${STREAM_TYPE.VIDEO}`;

// Hoisted so they are accessible inside vi.mock factory closures (which are hoisted too).
const storeMocks = vi.hoisted(() => ({
	setAddSubscription: vi.fn(),
	setRemoveSubscription: vi.fn(),
	setLocalVideoSuppressed: vi.fn(),
	setSubscribedTracks: vi.fn(),
	setDownlinkCompromised: vi.fn()
}));

vi.mock('../../store/Store', () => ({
	default: {
		// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
		getState: () => ({
			...storeMocks,
			activeMeeting: { meetingId: MEETING_ID },
			session: { id: 'me', apiVersion: undefined }
		})
	}
}));

vi.mock('../../store/selectors/UsersSelectors', () => ({
	getUserName: vi.fn(() => 'Test User')
}));

vi.mock('../apis/MeetingsApi', () => ({
	createMediaAnswer: vi.fn(),
	requestVideoQuality: vi.fn(() => Promise.resolve()),
	videoIceRestart: vi.fn(),
	subscribeToMedia: vi.fn(() => Promise.resolve())
}));

// Fire a simulated onTrack for userId/video on the connection.
const fireOnTrack = (conn: VideoScreenInConnection, userId: string): void => {
	const fakeStream = { id: `${userId}/video` } as MediaStream;
	const fakeReceiver = {
		getStats: vi.fn(() => Promise.resolve(new Map()))
	} as unknown as RTCRtpReceiver;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	(conn as any).onTrack({
		streams: [fakeStream],
		receiver: fakeReceiver
	} as unknown as RTCTrackEvent);
};

// Set up two active feeds via handleParticipantsSubscribed + onTrack.
const setupTwoFeeds = (conn: VideoScreenInConnection): void => {
	conn.handleParticipantsSubscribed([
		{ userId: USER_1, type: STREAM_TYPE.VIDEO, mid: 'mid1' },
		{ userId: USER_2, type: STREAM_TYPE.VIDEO, mid: 'mid2' }
	]);
	fireOnTrack(conn, USER_1);
	fireOnTrack(conn, USER_2);
};

// Drive N ticks of the given dlScore through the connection.
const driveN = async (conn: VideoScreenInConnection, dlScore: number, n: number): Promise<void> => {
	for (let i = 0; i < n; i += 1) {
		// eslint-disable-next-line no-await-in-loop
		await conn.evaluateQualityTick(dlScore);
	}
};

// Wire an active feed directly (videoReceivers + streamsMap + lastAppliedRung) at a given rung.
// This avoids the initial-reconcile call, isolating cap-related assertions.
const setupActiveFeed = (
	conn: VideoScreenInConnection,
	key: string,
	userId: string,
	lastApplied: number,
	mid: string
): void => {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const c = conn as any;
	const fakeReceiver = {
		getStats: vi.fn(() => Promise.resolve(new Map()))
	} as unknown as RTCRtpReceiver;
	c.videoReceivers.set(key, { receiver: fakeReceiver, userId });
	c.streamsMap[key] = { userId, type: STREAM_TYPE.VIDEO, mid };
	c.lastAppliedRung.set(key, lastApplied);
};

describe('VideoScreenInConnection — downlink quality controller', () => {
	let conn: VideoScreenInConnection;
	const requestVideoQuality = vi.mocked(MeetingsApi.requestVideoQuality);

	beforeEach(() => {
		conn = new VideoScreenInConnection(MEETING_ID);
		setupTwoFeeds(conn);
		requestVideoQuality.mockClear();
	});

	it('(a) drops to rung 1 for every active feed after EVIDENCE_DOWN_N poor dlScore readings', async () => {
		// EVIDENCE_DOWN_N = 4 ticks with dlScore=0 (< DOWN_SCORE=5):
		//   tick 1: initial reconcile — calls requestVideoQuality with rung 2 for each feed.
		//   tick 4: atLeast condition met (4 of last 4 < 5) → DOWN fires, targetRung 2→1.
		//           requestVideoQuality called with rung 1 for each feed.
		await driveN(conn, 0, EVIDENCE_DOWN_N);

		expect(requestVideoQuality).toHaveBeenCalledWith(MEETING_ID, USER_1, 'mid1', 1, 2);
		expect(requestVideoQuality).toHaveBeenCalledWith(MEETING_ID, USER_2, 'mid2', 1, 2);
	});

	it('(b) does not re-issue requestVideoQuality when the global target is unchanged (dedup)', async () => {
		// Drive DOWN first so targetRung=1 and lastAppliedRung is set to 1 for each feed.
		await driveN(conn, 0, EVIDENCE_DOWN_N);
		requestVideoQuality.mockClear();

		// Another tick: dlScore still 0, but evidenceBuf has only 1 element after reset,
		// so the DOWN condition is not yet met again. targetRung stays at 1 = lastApplied.
		await conn.evaluateQualityTick(0);

		expect(requestVideoQuality).not.toHaveBeenCalled();
	});

	it('(c) climbs back to rung 2 for every feed after EVIDENCE_UP_N good dlScore readings', async () => {
		// Drive DOWN first (evidenceBuf resets on the rung change).
		await driveN(conn, 0, EVIDENCE_DOWN_N);
		requestVideoQuality.mockClear();

		// After DOWN, evidenceBuf=[]. EVIDENCE_UP_N=9 ticks with dlScore=10 (>UP_SCORE=9):
		// atLeast([10x9], 9, 10, s>9) → 9 of last 9 elements pass (≥9 required) → UP fires.
		// targetRung 1→2; requestVideoQuality called with rung 2 for each feed.
		await driveN(conn, 10, EVIDENCE_UP_N);

		expect(requestVideoQuality).toHaveBeenCalledWith(MEETING_ID, USER_1, 'mid1', 2, 2);
		expect(requestVideoQuality).toHaveBeenCalledWith(MEETING_ID, USER_2, 'mid2', 2, 2);
	});
});

// dlScore in [5..9] satisfies neither DOWN (<5) nor UP (>9): the controller HOLDs, isolating cap logic.
const HOLD_SCORE = 7;

describe('VideoScreenInConnection — debug download cap', () => {
	let conn: VideoScreenInConnection;
	const requestVideoQuality = vi.mocked(MeetingsApi.requestVideoQuality);

	beforeEach(() => {
		conn = new VideoScreenInConnection(MEETING_ID);
		requestVideoQuality.mockClear();
	});

	afterEach(() => {
		clearStreamCaps();
	});

	it('does NOTHING extra when no cap is set (regression: feed at TOP holds silent)', async () => {
		// lastAppliedRung=TOP_RUNG=2 so dedup fires immediately with no cap.
		setupActiveFeed(conn, FEED_KEY_1, USER_1, TOP_RUNG, 'mid1');

		await conn.evaluateQualityTick(HOLD_SCORE);

		expect(requestVideoQuality).not.toHaveBeenCalled();
	});

	it('MEDIUM cap clamps a TOP-rung feed down to substream 1 (360p)', async () => {
		setupActiveFeed(conn, FEED_KEY_1, USER_1, TOP_RUNG, 'mid1');
		setDownloadCap('MEDIUM'); // cap=1

		await conn.evaluateQualityTick(HOLD_SCORE);

		// desired = min(targetRung=2, cap=1) = 1; lastApplied was 2 → call once.
		expect(requestVideoQuality).toHaveBeenCalledWith(MEETING_ID, USER_1, 'mid1', 1, 2);
	});

	it('LOW cap clamps to substream 0 (144p) and does not re-request while unchanged', async () => {
		setupActiveFeed(conn, FEED_KEY_1, USER_1, TOP_RUNG, 'mid1');
		setDownloadCap('LOW'); // cap=0

		await conn.evaluateQualityTick(HOLD_SCORE); // desired=0 ≠ lastApplied=2 → call
		await conn.evaluateQualityTick(HOLD_SCORE); // desired=0 = lastApplied=0 → skip

		expect(requestVideoQuality).toHaveBeenCalledTimes(1);
		expect(requestVideoQuality).toHaveBeenCalledWith(MEETING_ID, USER_1, 'mid1', 0, 2);
	});

	it('reconciles back to the controller rung (TOP_RUNG) when the cap is cleared', async () => {
		// Pretend LOW cap was previously applied (lastApplied=0).
		setupActiveFeed(conn, FEED_KEY_1, USER_1, 0, 'mid1');

		setDownloadCap('AUTO'); // clears the cap

		await conn.evaluateQualityTick(HOLD_SCORE);

		// desired = targetRung = TOP_RUNG = 2; lastApplied was 0 → reconcile.
		expect(requestVideoQuality).toHaveBeenCalledWith(MEETING_ID, USER_1, 'mid1', 2, 2);
	});

	it('cap clamps all active feeds, not just one', async () => {
		setupActiveFeed(conn, FEED_KEY_1, USER_1, TOP_RUNG, 'mid1');
		setupActiveFeed(conn, FEED_KEY_2, USER_2, TOP_RUNG, 'mid2');
		setDownloadCap('LOW'); // cap=0

		await conn.evaluateQualityTick(HOLD_SCORE);

		expect(requestVideoQuality).toHaveBeenCalledWith(MEETING_ID, USER_1, 'mid1', 0, 2);
		expect(requestVideoQuality).toHaveBeenCalledWith(MEETING_ID, USER_2, 'mid2', 0, 2);
		expect(requestVideoQuality).toHaveBeenCalledTimes(2);
	});
});
