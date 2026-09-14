/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import {
	COOLDOWN_BASE,
	EVIDENCE_DOWN_M,
	EVIDENCE_DOWN_N,
	TOP_RUNG
} from './inboundQualityController';
import VideoScreenInConnection from './VideoScreenInConnection';
import { STREAM_TYPE } from '../../types/store/ActiveMeetingTypes';
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
	setDownlinkCompromised: vi.fn(),
	connectionQuality: {} as Record<string, { quality: string; changedAt: number }>
}));

vi.mock('../../store/Store', () => ({
	default: {
		// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
		getState: () => ({
			...storeMocks,
			activeMeeting: {
				meetingId: MEETING_ID,
				connectionQuality: storeMocks.connectionQuality
			},
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

// Build a receiver whose getStats() returns an inbound-rtp report with NO inbound-rtp entry
// (no counters → decoded/recv undefined → score=undefined → HOLD).
const makeNoStatReceiver = (): RTCRtpReceiver =>
	({
		getStats: vi.fn(async () => new Map() as unknown as RTCStatsReport)
	}) as unknown as RTCRtpReceiver;

// Stalled feed: framesDecoded stays 0, packetsReceived grows by pktPerTick each call.
// pktPerTick >= 20 (MIN_PKT) → data is arriving but no new frames → fps=0 → score=0 ≤ DOWN_SCORE.
const makeStalledReceiver = (pktPerTick = 30): RTCRtpReceiver => {
	let totalRecv = 0;
	return {
		getStats: vi.fn(async () => {
			totalRecv += pktPerTick;
			return new Map([
				[
					'inb',
					{
						type: 'inbound-rtp',
						kind: 'video',
						framesDecoded: 0,
						packetsReceived: totalRecv
					}
				]
			]) as unknown as RTCStatsReport;
		})
	} as unknown as RTCRtpReceiver;
};

// Healthy feed: framesDecoded grows by framesPerTick and packetsReceived grows by pktPerTick.
// 30 frames in 2 s → fps=15 = HEALTHY_FPS=15 → score=10 (clean).
const makeHealthyReceiver = (framesPerTick = 30, pktPerTick = 60): RTCRtpReceiver => {
	let totalFrames = 0;
	let totalRecv = 0;
	return {
		getStats: vi.fn(async () => {
			totalFrames += framesPerTick;
			totalRecv += pktPerTick;
			return new Map([
				[
					'inb',
					{
						type: 'inbound-rtp',
						kind: 'video',
						framesDecoded: totalFrames,
						packetsReceived: totalRecv
					}
				]
			]) as unknown as RTCStatsReport;
		})
	} as unknown as RTCRtpReceiver;
};

// Directly wire a video receiver into the connection (no full onTrack / reconcile ceremony).
const seedReceiver = (
	conn: VideoScreenInConnection,
	key: string,
	userId: string,
	mid: string,
	receiver: RTCRtpReceiver,
	lastApplied = TOP_RUNG
): void => {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const c = conn as any;
	c.videoReceivers.set(key, { receiver, userId });
	c.streamsMap[key] = { userId, type: STREAM_TYPE.VIDEO, mid };
	c.lastAppliedRung.set(key, lastApplied);
};

describe('VideoScreenInConnection — downlink quality controller (fps-liveness + badge)', () => {
	let conn: VideoScreenInConnection;
	const requestVideoQuality = vi.mocked(MeetingsApi.requestVideoQuality);

	beforeEach(() => {
		storeMocks.connectionQuality = {};
		conn = new VideoScreenInConnection(MEETING_ID);
		requestVideoQuality.mockClear();
	});

	it('(a) steps DOWN to rung 1 after EVIDENCE_DOWN_N stalled ticks+1 when sender badge is OK', async () => {
		// Stalled receiver: framesDecoded=0, packetsReceived grows by 30/tick (> MIN_PKT=20).
		// Tick 1: prev=null → score=undefined (no-data). HOLD.
		// Ticks 2..4: fps=(0-0)/2=0 → score=0 ≤ DOWN_SCORE; after EVIDENCE_DOWN_N=3 low readings
		// in the last EVIDENCE_DOWN_M=4 ticks → DOWN fires on tick 4: rung 2→1.
		const receiver = makeStalledReceiver();
		seedReceiver(conn, FEED_KEY_1, USER_1, 'mid1', receiver);
		storeMocks.connectionQuality = {};

		await conn.evaluateQualityTick(); // tick 1: no prev → score=undefined, HOLD
		await conn.evaluateQualityTick(); // tick 2: fps=0, score=0, evidenceBuf=[0], HOLD (1 of 4 < 3)
		await conn.evaluateQualityTick(); // tick 3: fps=0, score=0, evidenceBuf=[0,0], HOLD (2 of 4 < 3)
		requestVideoQuality.mockClear();
		await conn.evaluateQualityTick(); // tick 4: fps=0, score=0, evidenceBuf=[0,0,0], 3-of-3 ≥ 3 → DOWN

		expect(requestVideoQuality).toHaveBeenCalledWith(MEETING_ID, USER_1, 'mid1', 1, 2);
	});

	it('(b) holds and does NOT lower rung when sender badge is unstable (their upload is the issue)', async () => {
		const receiver = makeStalledReceiver();
		seedReceiver(conn, FEED_KEY_1, USER_1, 'mid1', receiver);
		storeMocks.connectionQuality = { [USER_1]: { quality: 'poor', changedAt: 0 } };

		for (let i = 0; i < EVIDENCE_DOWN_N + EVIDENCE_DOWN_M + 2; i += 1) {
			// eslint-disable-next-line no-await-in-loop
			await conn.evaluateQualityTick();
		}

		const { calls } = requestVideoQuality.mock;
		const downgradeCalls = calls.filter(([, , , rung]) => (rung as number) < TOP_RUNG);
		expect(downgradeCalls).toHaveLength(0);
	});

	it('(c) does NOT duplicate requestVideoQuality when the target does not move (dedup)', async () => {
		seedReceiver(conn, FEED_KEY_1, USER_1, 'mid1', makeNoStatReceiver(), TOP_RUNG);

		await conn.evaluateQualityTick();

		// No stats → score=undefined → HOLD. target stays at TOP_RUNG=lastApplied → no call.
		expect(requestVideoQuality).not.toHaveBeenCalled();
	});

	it('(d) probes UP one tier after COOLDOWN_BASE clean ticks once rung is below TOP_RUNG', async () => {
		// Start at rung 1. Pre-seed prevStats so tick 1 produces a valid fps reading (not blind).
		// Drive COOLDOWN_BASE=12 clean ticks (framesPerTick=30 → fps=15 → score=10 → cleanStreak reaches 12).
		// Expected: UP fires (1→2), requestVideoQuality called with rung 2.
		const receiver = makeHealthyReceiver();
		seedReceiver(conn, FEED_KEY_1, USER_1, 'mid1', receiver, 1);
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const c = conn as any;
		c.feedStates.set(FEED_KEY_1, {
			targetRung: 1,
			evidenceBuf: [],
			cleanStreak: 0,
			cooldownLen: COOLDOWN_BASE,
			ticksSinceUp: 100,
			ticksSinceDown: 100
		});
		c.prevStats.set(FEED_KEY_1, { decoded: 0, recv: 0 }); // seed prev so tick 1 is not blind

		for (let i = 0; i < COOLDOWN_BASE; i += 1) {
			// eslint-disable-next-line no-await-in-loop
			await conn.evaluateQualityTick();
		}

		const { calls } = requestVideoQuality.mock;
		const upCalls = calls.filter(([, , , rung]) => (rung as number) === 2);
		expect(upCalls.length).toBeGreaterThan(0);
	});

	it('(f) HOLD when packetsReceived delta is below MIN_PKT — no shed even when framesDecoded is flat', async () => {
		// pktPerTick=5 < MIN_PKT=20 → almost no data arriving → score=undefined every tick → no DOWN.
		const receiver = makeStalledReceiver(5);
		seedReceiver(conn, FEED_KEY_1, USER_1, 'mid1', receiver);
		storeMocks.connectionQuality = {};

		for (let i = 0; i < EVIDENCE_DOWN_N + EVIDENCE_DOWN_M + 2; i += 1) {
			// eslint-disable-next-line no-await-in-loop
			await conn.evaluateQualityTick();
		}

		const { calls } = requestVideoQuality.mock;
		const downgradeCalls = calls.filter(([, , , rung]) => (rung as number) < TOP_RUNG);
		expect(downgradeCalls).toHaveLength(0);
	});

	it('(g) healthy growing feed never sheds: growing framesDecoded+packetsReceived → fps high → no DOWN', async () => {
		// 30 frames / 2 s = 15 fps = HEALTHY_FPS=15 → score=10 → always clean → never DOWN.
		const receiver = makeHealthyReceiver();
		seedReceiver(conn, FEED_KEY_1, USER_1, 'mid1', receiver);
		storeMocks.connectionQuality = {};

		for (let i = 0; i < EVIDENCE_DOWN_N + EVIDENCE_DOWN_M + 2; i += 1) {
			// eslint-disable-next-line no-await-in-loop
			await conn.evaluateQualityTick();
		}

		const { calls } = requestVideoQuality.mock;
		const downgradeCalls = calls.filter(([, , , rung]) => (rung as number) < TOP_RUNG);
		expect(downgradeCalls).toHaveLength(0);
	});

	it('(e) a new feed inherits the room floor (lowest targetRung across current feeds)', async () => {
		// Seed feed 1 at rung 1, then a new feed 2 with no feedState gets roomFloor()=1.
		const r1 = makeNoStatReceiver();
		seedReceiver(conn, FEED_KEY_1, USER_1, 'mid1', r1, 1);
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(conn as any).feedStates.set(FEED_KEY_1, {
			targetRung: 1,
			evidenceBuf: [],
			cleanStreak: 0,
			cooldownLen: COOLDOWN_BASE,
			ticksSinceUp: 100,
			ticksSinceDown: 100
		});

		// Add feed 2 with no feedState (it doesn't exist in feedStates yet).
		const r2 = makeNoStatReceiver();
		seedReceiver(conn, FEED_KEY_2, USER_2, 'mid2', r2, TOP_RUNG);

		await conn.evaluateQualityTick();

		// Feed 2 inherits roomFloor()=1 → desired=1 ≠ lastApplied=2 → reconcile with rung 1.
		const { calls } = requestVideoQuality.mock;
		const feed2Calls = calls.filter(([, uid, , rung]) => uid === USER_2 && (rung as number) === 1);
		expect(feed2Calls.length).toBe(1);
	});
});
