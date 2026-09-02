/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import {
	EVIDENCE_DOWN_N,
	EVIDENCE_UP_N,
	initialFeedState,
	TOP_RUNG
} from './inboundQualityController';
import VideoScreenInConnection from './VideoScreenInConnection';
import { QualitySignals } from './voteWindow';
import { STREAM_TYPE } from '../../types/store/ActiveMeetingTypes';
import * as MeetingsApi from '../apis/MeetingsApi';

const MEETING_ID = 'test-meeting';
const USER_ID = 'user1';
const FEED_KEY = `${USER_ID}-${STREAM_TYPE.VIDEO}`;

// In the new design, the controller accumulates evidence from displayBars.
// DOWN fires after EVIDENCE_DOWN_N poor bars (≤2) in the evidenceBuf.
// UP fires after EVIDENCE_UP_N optimal bars (===5) in the evidenceBuf.
const upSignals: QualitySignals = {
	displayBars: 5,
	warnVote: false,
	restoreVote: false
};

const downSignals: QualitySignals = {
	displayBars: 0,
	warnVote: false,
	restoreVote: false
};

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
			activeMeeting: undefined,
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

// Helper: fire onTrack on the connection as if a video stream arrived for userId.
const fireOnTrack = (conn: VideoScreenInConnection, userId: string): void => {
	const fakeStream = { id: `${userId}/video` } as MediaStream;
	const fakeReceiver = {
		getStats: vi.fn(() => Promise.resolve(new Map()))
	} as unknown as RTCRtpReceiver;
	// Call the private handler directly — easier than wiring a full RTCTrackEvent.
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	(conn as any).onTrack({
		streams: [fakeStream],
		receiver: fakeReceiver
	} as unknown as RTCTrackEvent);
};

// Drive N ticks of the given signals through the connection.
const driveN = async (
	conn: VideoScreenInConnection,
	signals: QualitySignals,
	n: number
): Promise<void> => {
	for (let i = 0; i < n; i += 1) {
		// eslint-disable-next-line no-await-in-loop
		await conn.evaluateQualityTick(signals);
	}
};

// Accumulate enough poor bars to trigger a DOWN decision.
const driveDown = (conn: VideoScreenInConnection): Promise<void> =>
	driveN(conn, downSignals, EVIDENCE_DOWN_N);

// Accumulate enough optimal bars to trigger an UP decision.
const driveUp = (conn: VideoScreenInConnection): Promise<void> =>
	driveN(conn, upSignals, EVIDENCE_UP_N);

// Helper: put a feed directly into the AUTO-OFF suppressed state so that
// the UP-vote recovery path can be tested in isolation.
// In the new design, allAutoOff=true and targetRung=0 are required so that
// an UP change actually re-enables the feed.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const suppressFeed = (conn: VideoScreenInConnection, key: string, userId: string): void => {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const c = conn as any;
	c.centralState.feeds.set(key, initialFeedState(0));
	c.centralState.allAutoOff = true;
	c.centralState.targetRung = 0;
	// Reset evidenceBuf so the 7 UP ticks cleanly fire one UP change.
	c.centralState.evidenceBuf = [];
	c.suppressedVideo.set(key, { userId, offAtTick: 0 });
	// videoReceivers has no entry — the feed is off.
};

describe('VideoScreenInConnection — auto-off / re-enable lifecycle', () => {
	let conn: VideoScreenInConnection;

	beforeEach(() => {
		conn = new VideoScreenInConnection(MEETING_ID);
	});

	describe('suppressFeed keeps feed in centralState.feeds at rung 0', () => {
		it('feed remains in centralState.feeds after AUTO-OFF so the UP vote can find it', async () => {
			// Set up an active feed at rung 0 (floor) with targetRung=0 so DOWN at this point
			// triggers AUTO-OFF rather than a normal rung step.
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			(conn as any).centralState.feeds.set(FEED_KEY, initialFeedState(0));
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			(conn as any).centralState.targetRung = 0;
			const fakeReceiver = {
				getStats: vi.fn(() => Promise.resolve(new Map()))
			} as unknown as RTCRtpReceiver;
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			(conn as any).videoReceivers.set(FEED_KEY, { receiver: fakeReceiver, userId: USER_ID });
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			(conn as any).streamsMap[FEED_KEY] = {
				userId: USER_ID,
				type: STREAM_TYPE.VIDEO,
				mid: 'mid1'
			};

			// DOWN fires after EVIDENCE_DOWN_N poor ticks; at targetRung=0 it triggers AUTO-OFF.
			await driveDown(conn);

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const feeds = (conn as any).centralState.feeds as Map<string, any>;
			expect(feeds.has(FEED_KEY)).toBe(true);
			expect(feeds.get(FEED_KEY)?.rung).toBe(0);
		});
	});

	describe('UP vote re-enables a suppressed feed', () => {
		it('calls setAddSubscription with the correct meeting and user', async () => {
			suppressFeed(conn, FEED_KEY, USER_ID);

			await driveUp(conn); // EVIDENCE_UP_N ticks → UP fires → re-enable

			expect(storeMocks.setAddSubscription).toHaveBeenCalledWith(MEETING_ID, {
				userId: USER_ID,
				type: STREAM_TYPE.VIDEO
			});
		});

		it('calls setLocalVideoSuppressed(false) to unmute the feed', async () => {
			suppressFeed(conn, FEED_KEY, USER_ID);

			await driveUp(conn);

			expect(storeMocks.setLocalVideoSuppressed).toHaveBeenCalledWith(MEETING_ID, USER_ID, false);
		});

		it('does NOT remove the feed from suppressedVideo before onTrack fires', async () => {
			suppressFeed(conn, FEED_KEY, USER_ID);

			await driveUp(conn);

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			expect((conn as any).suppressedVideo.has(FEED_KEY)).toBe(true);
		});

		it('advances the rung by exactly 1 on the first UP decision (rung 0 → 1)', async () => {
			suppressFeed(conn, FEED_KEY, USER_ID);

			await driveUp(conn); // UP fires → targetRung 0→1 (from auto-off recovery)

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const feeds = (conn as any).centralState.feeds as Map<string, any>;
			expect(feeds.get(FEED_KEY)?.rung).toBe(1);
		});

		it('retries re-subscription on each UP decision while onTrack has not yet fired', async () => {
			suppressFeed(conn, FEED_KEY, USER_ID);

			// First UP decision at tick EVIDENCE_UP_N: re-subscribe attempt #1.
			await driveUp(conn);
			expect(storeMocks.setAddSubscription).toHaveBeenCalledTimes(1);
			// evidenceBuf was reset after the UP change, so another EVIDENCE_UP_N ticks = attempt #2.
			await driveUp(conn);
			expect(storeMocks.setAddSubscription).toHaveBeenCalledTimes(2);

			// The feed stays in suppressedVideo until onTrack fires.
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			expect((conn as any).suppressedVideo.has(FEED_KEY)).toBe(true);
		});

		it('does NOT call requestVideoQuality for a suppressed feed on an UP decision', async () => {
			suppressFeed(conn, FEED_KEY, USER_ID);

			await driveUp(conn);

			expect(vi.mocked(MeetingsApi.requestVideoQuality)).not.toHaveBeenCalled();
		});

		it('climbs rung by rung — never jumps to TOP_RUNG', async () => {
			suppressFeed(conn, FEED_KEY, USER_ID);
			// Capture feeds freshly after each tick (decideDownlink replaces centralState entirely).
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const getRung = (): number => (conn as any).centralState.feeds.get(FEED_KEY)?.rung;

			// First UP decision while suppressed: rung 0→1 (from auto-off recovery).
			await driveUp(conn);
			expect(getRung()).toBe(1);

			// onTrack fires: track is back, suppressedVideo cleared, rung stays at 1.
			fireOnTrack(conn, USER_ID);
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			expect((conn as any).suppressedVideo.has(FEED_KEY)).toBe(false);
			expect(getRung()).toBe(1);

			// Second UP decision (feed now active): rung 1→2.
			await driveUp(conn);
			expect(getRung()).toBe(2);

			// Third UP decision: rung 2→3.
			await driveUp(conn);
			expect(getRung()).toBe(3);

			// After just three UP decisions the feed is still well below TOP_RUNG (5).
			expect(getRung()).toBeLessThan(TOP_RUNG);
		});
	});

	describe('onTrack for a re-enabling feed', () => {
		it('clears suppressedVideo when the real track arrives', () => {
			suppressFeed(conn, FEED_KEY, USER_ID);
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			(conn as any).centralState.feeds.set(FEED_KEY, initialFeedState(2));

			fireOnTrack(conn, USER_ID);

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			expect((conn as any).suppressedVideo.has(FEED_KEY)).toBe(false);
		});

		it('keeps the current rung (not TOP_RUNG) so the feed climbs gradually', () => {
			suppressFeed(conn, FEED_KEY, USER_ID);
			// Simulate the feed having moved to rung 2 before the track arrived.
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			(conn as any).centralState.feeds.set(FEED_KEY, initialFeedState(2));

			fireOnTrack(conn, USER_ID);

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const feeds = (conn as any).centralState.feeds as Map<string, any>;
			expect(feeds.get(FEED_KEY)?.rung).toBe(2);
			expect(feeds.get(FEED_KEY)?.rung).not.toBe(TOP_RUNG);
		});

		it('adds the feed back to videoReceivers', () => {
			suppressFeed(conn, FEED_KEY, USER_ID);
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			(conn as any).centralState.feeds.set(FEED_KEY, initialFeedState(1));

			fireOnTrack(conn, USER_ID);

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			expect((conn as any).videoReceivers.has(FEED_KEY)).toBe(true);
		});

		it('enters TOP_RUNG for a fresh (never-suppressed) subscribe', () => {
			// No suppressedVideo entry — brand-new subscription.
			fireOnTrack(conn, USER_ID);

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const feeds = (conn as any).centralState.feeds as Map<string, any>;
			expect(feeds.get(FEED_KEY)?.rung).toBe(TOP_RUNG);
		});
	});

	describe('no-orphan invariant', () => {
		it('feed is always tracked (suppressedVideo or videoReceivers) through the full lifecycle', async () => {
			// Phase 1: fresh subscribe → in videoReceivers, NOT suppressed.
			fireOnTrack(conn, USER_ID);
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			expect((conn as any).videoReceivers.has(FEED_KEY)).toBe(true);
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			expect((conn as any).suppressedVideo.has(FEED_KEY)).toBe(false);

			// Phase 2: AUTO-OFF → in suppressedVideo, NOT in videoReceivers.
			suppressFeed(conn, FEED_KEY, USER_ID);
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			(conn as any).videoReceivers.delete(FEED_KEY); // mirrors what suppressFeed() actually does
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			expect((conn as any).suppressedVideo.has(FEED_KEY)).toBe(true);
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			expect((conn as any).videoReceivers.has(FEED_KEY)).toBe(false);

			// Phase 3: UP decision triggers re-subscription — still in suppressedVideo (onTrack pending).
			await driveUp(conn);
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			expect((conn as any).suppressedVideo.has(FEED_KEY)).toBe(true);
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			expect((conn as any).videoReceivers.has(FEED_KEY)).toBe(false);

			// Phase 4: onTrack fires → cleared from suppressedVideo, back in videoReceivers.
			fireOnTrack(conn, USER_ID);
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			expect((conn as any).suppressedVideo.has(FEED_KEY)).toBe(false);
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			expect((conn as any).videoReceivers.has(FEED_KEY)).toBe(true);

			// The feed was in exactly one of the two sets at every phase — never in neither.
		});
	});
});
