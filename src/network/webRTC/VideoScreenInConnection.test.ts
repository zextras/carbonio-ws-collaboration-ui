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
import { rtcDownlinkDebug } from '../../utils/debug';
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
	connectionQuality: {} as Record<
		string,
		{
			networkScore: number | null;
			changedAt: number;
			maxUplinkTier?: number | null;
			maxHardwareTier?: number | null;
		}
	>,
	tileCeilings: {} as Record<string, number>
}));

vi.mock('../../store/Store', () => ({
	default: {
		// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
		getState: () => ({
			...storeMocks,
			activeMeeting: {
				meetingId: MEETING_ID,
				connectionQuality: storeMocks.connectionQuality,
				tileCeilings: storeMocks.tileCeilings
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

vi.mock('../../utils/debug', () => ({
	rtcDownlinkDebug: vi.fn(),
	rtcUplinkDebug: vi.fn()
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
// lastApplied=null models a never-served feed (fresh entry, no request emitted yet).
const seedReceiver = (
	conn: VideoScreenInConnection,
	key: string,
	userId: string,
	mid: string,
	receiver: RTCRtpReceiver,
	lastApplied: number | null = TOP_RUNG
): void => {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const c = conn as any;
	c.videoReceivers.set(key, { receiver, userId });
	c.streamsMap[key] = { userId, type: STREAM_TYPE.VIDEO, mid };
	if (lastApplied != null) c.lastAppliedRung.set(key, lastApplied);
};

describe('VideoScreenInConnection — downlink quality controller (fps-liveness + badge)', () => {
	let conn: VideoScreenInConnection;
	const requestVideoQuality = vi.mocked(MeetingsApi.requestVideoQuality);

	beforeEach(() => {
		storeMocks.connectionQuality = {};
		storeMocks.tileCeilings = {};
		conn = new VideoScreenInConnection(MEETING_ID);
		requestVideoQuality.mockClear();
		vi.mocked(rtcDownlinkDebug).mockClear();
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

	it('(b) holds and does NOT lower rung when sender maxUplinkTier is 0 and maxHardwareTier is null — their uplink is the issue', async () => {
		const receiver = makeStalledReceiver();
		seedReceiver(conn, FEED_KEY_1, USER_1, 'mid1', receiver);
		storeMocks.connectionQuality = {
			[USER_1]: { networkScore: 4, changedAt: 0, maxUplinkTier: 0, maxHardwareTier: null }
		};

		for (let i = 0; i < EVIDENCE_DOWN_N + EVIDENCE_DOWN_M + 2; i += 1) {
			// eslint-disable-next-line no-await-in-loop
			await conn.evaluateQualityTick();
		}

		const { calls } = requestVideoQuality.mock;
		const downgradeCalls = calls.filter(([, , , rung]) => (rung as number) < TOP_RUNG);
		expect(downgradeCalls).toHaveLength(0);
	});

	it('(b2) hardware-aware senderOK: maxUplink=0, maxHardware=0 → at ceiling → senderOK=true → shed allowed', async () => {
		// maxUplinkTier >= maxHardwareTier (0 >= 0) → senderOK=true → controller sheds when stalled.
		const receiver = makeStalledReceiver();
		seedReceiver(conn, FEED_KEY_1, USER_1, 'mid1', receiver);
		storeMocks.connectionQuality = {
			[USER_1]: { networkScore: 4, changedAt: 0, maxUplinkTier: 0, maxHardwareTier: 0 }
		};

		for (let i = 0; i < EVIDENCE_DOWN_N + EVIDENCE_DOWN_M + 2; i += 1) {
			// eslint-disable-next-line no-await-in-loop
			await conn.evaluateQualityTick();
		}

		const { calls } = requestVideoQuality.mock;
		const downgradeCalls = calls.filter(([, , , rung]) => (rung as number) < TOP_RUNG);
		expect(downgradeCalls.length).toBeGreaterThan(0);
	});

	it('(b3) hardware-aware senderOK: maxUplink=0, maxHardware=2 → below ceiling → senderOK=false → HOLD', async () => {
		// maxUplinkTier < maxHardwareTier (0 < 2) → network shed their encoding → HOLD, not our downlink.
		const receiver = makeStalledReceiver();
		seedReceiver(conn, FEED_KEY_1, USER_1, 'mid1', receiver);
		storeMocks.connectionQuality = {
			[USER_1]: { networkScore: 4, changedAt: 0, maxUplinkTier: 0, maxHardwareTier: 2 }
		};

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

	it('(h) clamps the emitted substream to the stored tile ceiling', async () => {
		// Target would be TOP_RUNG (no feedState, roomFloor=TOP_RUNG), but the tile ceiling caps it at 0.
		seedReceiver(conn, FEED_KEY_1, USER_1, 'mid1', makeNoStatReceiver(), TOP_RUNG);
		storeMocks.tileCeilings = { [FEED_KEY_1]: 0 };

		await conn.evaluateQualityTick();

		expect(requestVideoQuality).toHaveBeenCalledWith(MEETING_ID, USER_1, 'mid1', 0, 2);
	});

	it('(i) does not clamp when the stored ceiling is TOP_RUNG (no cap)', async () => {
		// lastApplied starts at 1; roomFloor with no feedStates is TOP_RUNG, ceiling is TOP_RUNG → target
		// climbs to TOP_RUNG and reconcile emits it unclamped.
		seedReceiver(conn, FEED_KEY_1, USER_1, 'mid1', makeNoStatReceiver(), 1);
		storeMocks.tileCeilings = { [FEED_KEY_1]: TOP_RUNG };

		await conn.evaluateQualityTick();

		expect(requestVideoQuality).toHaveBeenCalledWith(MEETING_ID, USER_1, 'mid1', TOP_RUNG, 2);
	});

	it('(j) defers a never-served feed until its tile ceiling is published, then requests the cap only', async () => {
		// Fresh feed (never requested), no ceiling yet → first tick must NOT emit a request (no HIGH probe).
		seedReceiver(conn, FEED_KEY_1, USER_1, 'mid1', makeNoStatReceiver(), null);
		storeMocks.tileCeilings = {};

		await conn.evaluateQualityTick(); // ceiling absent → deferred
		expect(requestVideoQuality).not.toHaveBeenCalled();

		// Tile mounts and publishes its ceiling (rung 0) → next reconcile emits the capped tier, once.
		storeMocks.tileCeilings = { [FEED_KEY_1]: 0 };
		await conn.evaluateQualityTick();

		expect(requestVideoQuality).toHaveBeenCalledTimes(1);
		expect(requestVideoQuality).toHaveBeenCalledWith(MEETING_ID, USER_1, 'mid1', 0, 2);
		// Never a HIGH (TOP_RUNG) request that would immediately get clamped down.
		const highCalls = requestVideoQuality.mock.calls.filter(([, , , rung]) => rung === TOP_RUNG);
		expect(highCalls).toHaveLength(0);
	});

	it('(k) the FIRST request is already the capped tier when the ceiling is known upfront (no HIGH-then-drop)', async () => {
		seedReceiver(conn, FEED_KEY_1, USER_1, 'mid1', makeNoStatReceiver(), null);
		storeMocks.tileCeilings = { [FEED_KEY_1]: 1 };

		await conn.evaluateQualityTick();

		expect(requestVideoQuality).toHaveBeenCalledTimes(1);
		expect(requestVideoQuality).toHaveBeenCalledWith(MEETING_ID, USER_1, 'mid1', 1, 2);
	});

	it('(l) serves a never-served feed at TOP_RUNG if no ceiling ever arrives (never permanently withheld)', async () => {
		seedReceiver(conn, FEED_KEY_1, USER_1, 'mid1', makeNoStatReceiver(), null);
		storeMocks.tileCeilings = {};

		// Drive past the bounded wait: ticks 1..2 defer, tick 3 falls back to TOP_RUNG.
		await conn.evaluateQualityTick();
		await conn.evaluateQualityTick();
		expect(requestVideoQuality).not.toHaveBeenCalled();
		await conn.evaluateQualityTick();

		expect(requestVideoQuality).toHaveBeenCalledTimes(1);
		expect(requestVideoQuality).toHaveBeenCalledWith(MEETING_ID, USER_1, 'mid1', TOP_RUNG, 2);
	});

	it('(m) senderOK=true when maxUplinkTier is undefined — allows shed on stalled feed', async () => {
		// No maxUplinkTier in connectionQuality → maxUplinkTier undefined → senderOK=true → shed fires.
		const receiver = makeStalledReceiver();
		seedReceiver(conn, FEED_KEY_1, USER_1, 'mid1', receiver);
		storeMocks.connectionQuality = { [USER_1]: { networkScore: 10, changedAt: 0 } };

		await conn.evaluateQualityTick(); // tick 1: no prev → HOLD
		await conn.evaluateQualityTick(); // tick 2
		await conn.evaluateQualityTick(); // tick 3
		requestVideoQuality.mockClear();
		await conn.evaluateQualityTick(); // tick 4: EVIDENCE_DOWN_N=3 stalls → DOWN fires

		const { calls } = requestVideoQuality.mock;
		const downgradeCalls = calls.filter(([, , , rung]) => (rung as number) < TOP_RUNG);
		expect(downgradeCalls.length).toBeGreaterThan(0);
	});

	it('(n) senderOK=true when maxUplinkTier is 1 and maxHardwareTier is null — allows shed on stalled feed', async () => {
		const receiver = makeStalledReceiver();
		seedReceiver(conn, FEED_KEY_1, USER_1, 'mid1', receiver);
		storeMocks.connectionQuality = {
			[USER_1]: { networkScore: 4, changedAt: 0, maxUplinkTier: 1, maxHardwareTier: null }
		};

		await conn.evaluateQualityTick();
		await conn.evaluateQualityTick();
		await conn.evaluateQualityTick();
		requestVideoQuality.mockClear();
		await conn.evaluateQualityTick();

		const { calls } = requestVideoQuality.mock;
		const downgradeCalls = calls.filter(([, , , rung]) => (rung as number) < TOP_RUNG);
		expect(downgradeCalls.length).toBeGreaterThan(0);
	});

	it('(o) senderOK=true when maxUplinkTier is 2 and maxHardwareTier is null — allows shed on stalled feed', async () => {
		const receiver = makeStalledReceiver();
		seedReceiver(conn, FEED_KEY_1, USER_1, 'mid1', receiver);
		storeMocks.connectionQuality = {
			[USER_1]: { networkScore: 4, changedAt: 0, maxUplinkTier: 2, maxHardwareTier: null }
		};

		await conn.evaluateQualityTick();
		await conn.evaluateQualityTick();
		await conn.evaluateQualityTick();
		requestVideoQuality.mockClear();
		await conn.evaluateQualityTick();

		const { calls } = requestVideoQuality.mock;
		const downgradeCalls = calls.filter(([, , , rung]) => (rung as number) < TOP_RUNG);
		expect(downgradeCalls.length).toBeGreaterThan(0);
	});

	it('(p) logs [DOWNLINK] their-network when the sender lowers maxUplinkTier while our request is unchanged', async () => {
		// Healthy feed → our request stays TOP; sender publishes HIGH then drops to MEDIUM. What we SHOW
		// = min(request, maxUplinkTier) goes 2→1 with our request unchanged, so the drop is attributed to them.
		storeMocks.connectionQuality = {
			[USER_1]: { networkScore: 10, changedAt: 1, maxUplinkTier: 2 }
		};
		const receiver = makeHealthyReceiver();
		seedReceiver(conn, FEED_KEY_1, USER_1, 'mid1', receiver, TOP_RUNG);
		const downlinkDebug = vi.mocked(rtcDownlinkDebug);

		await conn.evaluateQualityTick(); // baseline: shown = min(TOP, 2) = 2, first reconcile → no log
		expect(downlinkDebug).not.toHaveBeenCalled();

		storeMocks.connectionQuality = {
			[USER_1]: { networkScore: 10, changedAt: 2, maxUplinkTier: 1 }
		};
		await conn.evaluateQualityTick(); // shown = min(TOP, 1) = 1, our request unchanged → their-network

		expect(downlinkDebug).toHaveBeenCalledWith('Test User', TOP_RUNG, 1, 'their-network');
	});
});

describe('VideoScreenInConnection — downlinkShortfall()', () => {
	let conn: VideoScreenInConnection;

	beforeEach(() => {
		storeMocks.connectionQuality = {};
		storeMocks.tileCeilings = {};
		conn = new VideoScreenInConnection(MEETING_ID);
	});

	it('returns 0 when there are no active feeds', () => {
		expect(conn.downlinkShortfall()).toBe(0);
	});

	it('returns 0 when the feed has no known maxUplinkTier (unknown sender)', () => {
		seedReceiver(conn, FEED_KEY_1, USER_1, 'mid1', makeNoStatReceiver());
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(conn as any).feedStates.set(FEED_KEY_1, { targetRung: 2 });
		storeMocks.connectionQuality = { [USER_1]: { networkScore: 8, changedAt: 0 } };
		expect(conn.downlinkShortfall()).toBe(0);
	});

	it('returns 0 when theirMaxUplinkTier == myNetTarget (no shortfall)', () => {
		seedReceiver(conn, FEED_KEY_1, USER_1, 'mid1', makeNoStatReceiver());
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(conn as any).feedStates.set(FEED_KEY_1, { targetRung: 2 });
		storeMocks.connectionQuality = {
			[USER_1]: { networkScore: 10, changedAt: 0, maxUplinkTier: 2 }
		};
		expect(conn.downlinkShortfall()).toBe(0);
	});

	it('returns 1 when mean shortfall is 1 (single feed, their tier 2, my target 1)', () => {
		seedReceiver(conn, FEED_KEY_1, USER_1, 'mid1', makeNoStatReceiver());
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(conn as any).feedStates.set(FEED_KEY_1, { targetRung: 1 });
		storeMocks.connectionQuality = {
			[USER_1]: { networkScore: 10, changedAt: 0, maxUplinkTier: 2 }
		};
		expect(conn.downlinkShortfall()).toBe(1);
	});

	it('returns 2 when single feed shortfall is 2 (their tier 2, my target 0)', () => {
		seedReceiver(conn, FEED_KEY_1, USER_1, 'mid1', makeNoStatReceiver());
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(conn as any).feedStates.set(FEED_KEY_1, { targetRung: 0 });
		storeMocks.connectionQuality = {
			[USER_1]: { networkScore: 10, changedAt: 0, maxUplinkTier: 2 }
		};
		expect(conn.downlinkShortfall()).toBe(2);
	});

	it('returns mean shortfall across feeds (three feeds [0,2,0] → mean=2/3)', () => {
		// Feed 1: shortfall=0 (tier 2, target 2). Feed 2: shortfall=2 (tier 2, target 0).
		// Feed 3: shortfall=0 (tier 1, target 1). Mean = (0+2+0)/3 = 0.667.
		seedReceiver(conn, FEED_KEY_1, USER_1, 'mid1', makeNoStatReceiver());
		seedReceiver(conn, FEED_KEY_2, USER_2, 'mid2', makeNoStatReceiver());
		const USER_3 = 'user3';
		const FEED_KEY_3 = `${USER_3}-${STREAM_TYPE.VIDEO}`;
		seedReceiver(conn, FEED_KEY_3, USER_3, 'mid3', makeNoStatReceiver());
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const c = conn as any;
		c.feedStates.set(FEED_KEY_1, { targetRung: 2 });
		c.feedStates.set(FEED_KEY_2, { targetRung: 0 });
		c.feedStates.set(FEED_KEY_3, { targetRung: 1 });
		storeMocks.connectionQuality = {
			[USER_1]: { networkScore: 10, changedAt: 0, maxUplinkTier: 2 },
			[USER_2]: { networkScore: 10, changedAt: 0, maxUplinkTier: 2 },
			[USER_3]: { networkScore: 10, changedAt: 0, maxUplinkTier: 1 }
		};
		expect(conn.downlinkShortfall()).toBeCloseTo(2 / 3, 5);
	});

	it('uses the NETWORK target (feedStates.targetRung), not the tile-capped request', () => {
		// netTarget=2 (full quality requested by controller), tileCeiling=0 (tiny tile).
		// The shortfall must be 0 (their tier 2 - my netTarget 2), not 2 (which would wrongly use ceiling).
		seedReceiver(conn, FEED_KEY_1, USER_1, 'mid1', makeNoStatReceiver());
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(conn as any).feedStates.set(FEED_KEY_1, { targetRung: 2 });
		storeMocks.tileCeilings = { [FEED_KEY_1]: 0 };
		storeMocks.connectionQuality = {
			[USER_1]: { networkScore: 10, changedAt: 0, maxUplinkTier: 2 }
		};
		expect(conn.downlinkShortfall()).toBe(0);
	});
});
