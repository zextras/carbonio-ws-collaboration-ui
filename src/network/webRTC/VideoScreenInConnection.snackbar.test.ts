/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/**
 * Pins the evaluateDownlinkSnackbar FLOORED gate (SPEC2 §Snackbar):
 *   degraded = signals.warnVote AND FLOORED
 *   recovered = signals.restoreVote  (NOT gated on floored)
 *
 * FLOORED = every received feed at rung 0 (or no feeds) AND uplink maxTier null/0.
 */

import { initialFeedState, TOP_RUNG } from './inboundQualityController';
import VideoScreenInConnection from './VideoScreenInConnection';
import { QualitySignals } from './voteWindow';
import { STREAM_TYPE } from '../../types/store/ActiveMeetingTypes';

const MEETING_ID = 'snackbar-meeting';
const USER_ID = 'userA';
const FEED_KEY = `${USER_ID}-${STREAM_TYPE.VIDEO}`;
const MY_USER_ID = 'me';

type ActiveMeetingStub = {
	meetingId: string;
	connectionQuality: Record<string, { maxTier?: number | null } | undefined>;
};

// Mutable store state — each test can override activeMeeting / session before firing a tick.
const storeState = {
	setDownlinkCompromised: vi.fn(),
	setAddSubscription: vi.fn(),
	setRemoveSubscription: vi.fn(),
	setLocalVideoSuppressed: vi.fn(),
	setSubscribedTracks: vi.fn(),
	activeMeeting: undefined as ActiveMeetingStub | undefined,
	session: { id: MY_USER_ID, apiVersion: undefined as string | undefined }
};

vi.mock('../../store/Store', () => ({
	default: {
		// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
		getState: () => storeState
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

// Signals presets — displayBars=5 (optimal) so a single tick never triggers DOWN or UP.
const warnOnly: QualitySignals = {
	displayBars: 5,
	warnVote: true,
	restoreVote: false
};

const restoreOnly: QualitySignals = {
	displayBars: 5,
	warnVote: false,
	restoreVote: true
};

const allClear: QualitySignals = {
	displayBars: 5,
	warnVote: false,
	restoreVote: false
};

// Helper: inject an active feed with the given rung directly into the connection.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const injectFeed = (conn: VideoScreenInConnection, key: string, rung: number): void => {
	const c = conn as unknown as {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		centralState: { feeds: Map<string, any> };
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		videoReceivers: Map<string, any>;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		streamsMap: Record<string, any>;
	};
	c.centralState.feeds.set(key, initialFeedState(rung));
	const fakeReceiver = {
		getStats: vi.fn(() => Promise.resolve(new Map()))
	} as unknown as RTCRtpReceiver;
	c.videoReceivers.set(key, { receiver: fakeReceiver, userId: USER_ID });
	c.streamsMap[key] = { userId: USER_ID, type: STREAM_TYPE.VIDEO, mid: 'mid1' };
};

describe('VideoScreenInConnection — evaluateDownlinkSnackbar FLOORED gate', () => {
	let conn: VideoScreenInConnection;

	beforeEach(() => {
		vi.clearAllMocks();
		conn = new VideoScreenInConnection(MEETING_ID);
		// Default: activeMeeting is set for this meetingId, uplink at max (maxTier=2 = not at min).
		storeState.activeMeeting = {
			meetingId: MEETING_ID,
			connectionQuality: {
				[MY_USER_ID]: { maxTier: 2 }
			}
		};
	});

	it('does NOT warn when activeMeeting is undefined (guard path)', async () => {
		storeState.activeMeeting = undefined;
		await conn.evaluateQualityTick(warnOnly);
		expect(storeState.setDownlinkCompromised).not.toHaveBeenCalled();
	});

	it('does NOT warn when warnVote=true but NOT floored (feed above rung 0)', async () => {
		// Feed at rung 3 (above floor) — FLOORED = false.
		injectFeed(conn, FEED_KEY, 3);
		// Even with uplink at min, a feed above floor means NOT fully floored.
		storeState.activeMeeting!.connectionQuality[MY_USER_ID] = { maxTier: null };
		await conn.evaluateQualityTick(warnOnly);
		expect(storeState.setDownlinkCompromised).not.toHaveBeenCalled();
	});

	it('does NOT warn when warnVote=true but uplink NOT at min (maxTier=2 = high)', async () => {
		// All feeds at rung 0 (downlink floored) but uplink is high.
		injectFeed(conn, FEED_KEY, 0);
		storeState.activeMeeting!.connectionQuality[MY_USER_ID] = { maxTier: 2 };
		await conn.evaluateQualityTick(warnOnly);
		expect(storeState.setDownlinkCompromised).not.toHaveBeenCalled();
	});

	it('WARNS when warnVote=true AND fully floored (all feeds rung 0, uplink maxTier null)', async () => {
		injectFeed(conn, FEED_KEY, 0);
		storeState.activeMeeting!.connectionQuality[MY_USER_ID] = { maxTier: null };
		await conn.evaluateQualityTick(warnOnly);
		expect(storeState.setDownlinkCompromised).toHaveBeenCalledWith(MEETING_ID, true);
	});

	it('WARNS when warnVote=true AND fully floored (all feeds rung 0, uplink maxTier 0)', async () => {
		injectFeed(conn, FEED_KEY, 0);
		storeState.activeMeeting!.connectionQuality[MY_USER_ID] = { maxTier: 0 };
		await conn.evaluateQualityTick(warnOnly);
		expect(storeState.setDownlinkCompromised).toHaveBeenCalledWith(MEETING_ID, true);
	});

	it('WARNS when warnVote=true AND no active feeds AND uplink at min (vacuously floored)', async () => {
		// No active feeds — allFeedsAtFloor = true vacuously.
		storeState.activeMeeting!.connectionQuality[MY_USER_ID] = { maxTier: 0 };
		await conn.evaluateQualityTick(warnOnly);
		expect(storeState.setDownlinkCompromised).toHaveBeenCalledWith(MEETING_ID, true);
	});

	it('does NOT warn when warnVote=false even when fully floored', async () => {
		injectFeed(conn, FEED_KEY, 0);
		storeState.activeMeeting!.connectionQuality[MY_USER_ID] = { maxTier: null };
		await conn.evaluateQualityTick(allClear);
		expect(storeState.setDownlinkCompromised).not.toHaveBeenCalled();
	});

	it('RESTORES (recovered) on restoreVote=true regardless of floored state', async () => {
		// First: put SM into compromised state via a WARN with FLOORED.
		injectFeed(conn, FEED_KEY, 0);
		storeState.activeMeeting!.connectionQuality[MY_USER_ID] = { maxTier: null };
		await conn.evaluateQualityTick(warnOnly); // → compromised
		vi.clearAllMocks();

		// Now: restore with uplink at max (not floored) — RESTORE is vote-based only.
		injectFeed(conn, FEED_KEY, TOP_RUNG);
		storeState.activeMeeting!.connectionQuality[MY_USER_ID] = { maxTier: 2 };
		await conn.evaluateQualityTick(restoreOnly);
		expect(storeState.setDownlinkCompromised).toHaveBeenCalledWith(MEETING_ID, false);
	});

	it('does NOT WARN when a second feed is above rung 0 (not fully floored)', async () => {
		const feedKey2 = `user2-${STREAM_TYPE.VIDEO}`;
		injectFeed(conn, FEED_KEY, 0); // feed 1 at floor
		injectFeed(conn, feedKey2, 3); // feed 2 above floor → NOT fully floored
		storeState.activeMeeting!.connectionQuality[MY_USER_ID] = { maxTier: null };
		await conn.evaluateQualityTick(warnOnly);
		expect(storeState.setDownlinkCompromised).not.toHaveBeenCalled();
	});
});
