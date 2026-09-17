/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, it } from 'vitest';

import ConnectionQualityMonitor from './ConnectionQualityMonitor';
import { LinkSample } from './connectionQualityScore';
import useStore from '../../store/Store';
import {
	IBidirectionalConnectionAudioInOut,
	IScreenOutConnection,
	IVideoOutConnection,
	IVideoScreenInConnection
} from '../../types/network/webRTC/webRTC';
import { RootStore } from '../../types/store/StoreTypes';

const wsMocks = vi.hoisted(() => ({ sendUplinkStatusUpdate: vi.fn() }));
vi.mock('../../network/websocket/WebSocketClient', () => ({
	wsClient: { sendUplinkStatusUpdate: wsMocks.sendUplinkStatusUpdate }
}));

// setupTests.ts stubs the default export for component tests; exercise the real class here
vi.unmock('./ConnectionQualityMonitor');

const CANDIDATE_PAIR = 'candidate-pair';
const REMOTE_INBOUND_RTP = 'remote-inbound-rtp';
const OUTBOUND_RTP = 'outbound-rtp';
const TRANSPORT = 'transport';

const report = (stats: Array<Record<string, unknown>>): RTCStatsReport =>
	new Map(stats.map((s, i) => [String(s.id ?? i), s])) as unknown as RTCStatsReport;

const emptyReport = (): Promise<RTCStatsReport> => Promise.resolve(report([]));

const candidatePair = (rttSeconds: number): Record<string, unknown> => ({
	id: 'cp',
	type: CANDIDATE_PAIR,
	nominated: true,
	state: 'succeeded',
	currentRoundTripTime: rttSeconds
});

// Transport report that selects the 'cp' candidate pair — required for the new identity-based
// readCandidatePairRttMs (transport.selectedCandidatePairId → stats.get('cp')).
const transportSelectingCp = (): Record<string, unknown> => ({
	id: 'tr',
	type: TRANSPORT,
	selectedCandidatePairId: 'cp'
});

const resolveState = (
	s: RTCPeerConnectionState | (() => RTCPeerConnectionState) | undefined,
	fallback: RTCPeerConnectionState = 'connected'
): RTCPeerConnectionState => (typeof s === 'function' ? s() : (s ?? fallback));

const makeMonitor = (
	parts: {
		audioConnectionState?: RTCPeerConnectionState | (() => RTCPeerConnectionState);
		videoOutConnectionState?: RTCPeerConnectionState | (() => RTCPeerConnectionState);
		screenOutConnectionState?: RTCPeerConnectionState | (() => RTCPeerConnectionState);
		videoInConnectionState?: RTCPeerConnectionState | (() => RTCPeerConnectionState);
		audioStats?: () => Promise<RTCStatsReport>;
		videoPeerStats?: () => Promise<RTCStatsReport>;
		screenPeerStats?: () => Promise<RTCStatsReport>;
		webcamActive?: boolean;
		screenActive?: boolean;
	} = {}
): ConnectionQualityMonitor => {
	// setState MERGES, so the store's real action methods survive; only session/activeMeeting are
	// replaced with the fixture the monitor reads/writes.
	useStore.setState({
		session: { id: 'me' },
		activeMeeting: {
			meetingId: 'meetingId',
			connectionQuality: {},
			connectionScoreDetail: undefined
		}
	} as unknown as RootStore);

	const audioConn = {
		peerConn: {
			get connectionState(): RTCPeerConnectionState {
				return resolveState(parts.audioConnectionState);
			},
			getStats: parts.audioStats ?? emptyReport
		},
		rtpSender: { track: { enabled: true } }
	} as unknown as IBidirectionalConnectionAudioInOut;

	// null rtpSender = stream off (presence gate); its peerConn.getStats is read only when active.
	const videoOut = {
		peerConn: {
			get connectionState(): RTCPeerConnectionState {
				return resolveState(parts.videoOutConnectionState);
			},
			getStats: parts.videoPeerStats ?? emptyReport
		},
		rtpSender: parts.webcamActive ? {} : null
	} as unknown as IVideoOutConnection;

	const screenOut = {
		peerConn: {
			get connectionState(): RTCPeerConnectionState {
				return resolveState(parts.screenOutConnectionState);
			},
			getStats: parts.screenPeerStats ?? emptyReport
		},
		rtpSender: parts.screenActive ? {} : null
	} as unknown as IScreenOutConnection;

	// Inbound PC — deliberately NOT part of the (outbound-only) LOST decision; a state is wired here
	// only to prove the monitor ignores it.
	const videoIn = {
		peerConn:
			parts.videoInConnectionState != null
				? {
						get connectionState(): RTCPeerConnectionState {
							return resolveState(parts.videoInConnectionState);
						}
					}
				: null,
		evaluateQualityTick: vi.fn().mockResolvedValue(undefined),
		downlinkShortfall: vi.fn().mockReturnValue(0),
		hasActiveWebcamFeeds: vi.fn().mockReturnValue(false)
	} as unknown as IVideoScreenInConnection;

	const monitor = new ConnectionQualityMonitor(
		'meetingId',
		audioConn,
		videoOut,
		screenOut,
		videoIn
	);
	// stop the 2 s timer; evaluations are driven manually via emitInitial()
	monitor.stop();
	return monitor;
};

const publishedDetail = (): LinkSample =>
	useStore.getState().activeMeeting?.connectionScoreDetail ?? {};

// The vote pushes one raw bars value per tick into the VoteWindow (capacity 7, seeded optimistic=5).
// The committed level is median-7; a full swing needs ~4 consecutive bad ticks to move the majority
// of the last-7 window. Drive N ticks through the manual emitInitial() path (interval is stopped).
async function ticks(monitor: ConnectionQualityMonitor, n: number): Promise<void> {
	for (let i = 0; i < n; i += 1) {
		// eslint-disable-next-line no-await-in-loop
		await monitor.emitInitial();
	}
}

describe('ConnectionQualityMonitor — ICE state', () => {
	it.each(['failed', 'disconnected', 'closed'] as const)(
		'is "lost" when audio PC connection is "%s"',
		async (state) => {
			const monitor = makeMonitor({ audioConnectionState: state });
			await monitor.emitInitial();
			expect(monitor.committed).toBe('lost');
		}
	);

	it('does NOT overshoot to optimal after recovering from lost — keeps the pre-loss votes', async () => {
		// A degraded uplink (50% loss) drives the vote to 'terrible'; then a 3-tick ICE-loss flap; then ICE
		// reconnects with the link STILL degraded. The window must reflect the pre-loss/lost state and NOT
		// seed back to 'optimal' (which used to fire a false green "connection restored" snackbar).
		let phase: RTCPeerConnectionState = 'connected';
		const degradedAudio = (): Promise<RTCStatsReport> =>
			Promise.resolve(
				report([
					transportSelectingCp(),
					candidatePair(0.02),
					{ id: 'oa', type: OUTBOUND_RTP, ssrc: 1 },
					{ id: 'ria', type: REMOTE_INBOUND_RTP, ssrc: 1, fractionLost: 0.5 }
				])
			);
		const monitor = makeMonitor({ audioConnectionState: () => phase, audioStats: degradedAudio });

		// Degraded while connected → committed 'terrible' (50% loss → loss score 0, combineVote 2.0 → bars=1).
		await ticks(monitor, 6);
		expect(monitor.committed).toBe('terrible');

		// ICE-loss flap.
		phase = 'disconnected';
		await ticks(monitor, 3);
		expect(monitor.committed).toBe('lost');

		// Reconnect, link still degraded → must NOT overshoot to 'optimal'.
		phase = 'connected';
		await monitor.emitInitial();
		expect(monitor.committed).not.toBe('optimal');
		expect(monitor.committed).toBe('terrible');
	});
});

describe('ConnectionQualityMonitor — LOST aggregates the active OUTBOUND pairs', () => {
	it('is "lost" when the active webcam-out PC is down while audio is fine', async () => {
		const monitor = makeMonitor({
			audioConnectionState: 'connected',
			webcamActive: true,
			videoOutConnectionState: 'disconnected'
		});
		await monitor.emitInitial();
		expect(monitor.committed).toBe('lost');
	});

	it('is "lost" when the active screen-out PC is down while audio is fine', async () => {
		const monitor = makeMonitor({
			audioConnectionState: 'connected',
			screenActive: true,
			screenOutConnectionState: 'failed'
		});
		await monitor.emitInitial();
		expect(monitor.committed).toBe('lost');
	});

	it('ignores a down webcam-out PC while the camera is OFF (inactive pair not counted)', async () => {
		const monitor = makeMonitor({
			audioConnectionState: 'connected',
			webcamActive: false,
			videoOutConnectionState: 'failed'
		});
		await monitor.emitInitial();
		expect(monitor.committed).not.toBe('lost');
	});

	it('does NOT go "lost" when only the INBOUND PC is down (badge is outbound-only)', async () => {
		const monitor = makeMonitor({
			audioConnectionState: 'connected',
			videoInConnectionState: 'failed'
		});
		await monitor.emitInitial();
		expect(monitor.committed).not.toBe('lost');
	});

	it('stays "lost" until ALL active outbound pairs recover — one recovering is not enough', async () => {
		let audio: RTCPeerConnectionState = 'disconnected';
		let webcam: RTCPeerConnectionState = 'disconnected';
		const monitor = makeMonitor({
			audioConnectionState: () => audio,
			webcamActive: true,
			videoOutConnectionState: () => webcam
		});
		// both outbound pairs down → lost
		await monitor.emitInitial();
		expect(monitor.committed).toBe('lost');
		// audio recovers but webcam-out still down → STILL lost
		audio = 'connected';
		await monitor.emitInitial();
		expect(monitor.committed).toBe('lost');
		// webcam-out recovers too → all outbound up → real vote (not lost)
		webcam = 'connected';
		await monitor.emitInitial();
		expect(monitor.committed).not.toBe('lost');
	});
});

describe('ConnectionQualityMonitor — no evidence', () => {
	it('is "optimal" with an empty sample (connected, nothing measurable)', async () => {
		const monitor = makeMonitor();
		await monitor.emitInitial();
		expect(monitor.committed).toBe('optimal');
		expect(publishedDetail()).toEqual({});
	});
});

describe('ConnectionQualityMonitor — RTT', () => {
	it('reads RTT from the audio PC candidate-pair and drives the vote down when far', async () => {
		const monitor = makeMonitor({
			audioStats: () => Promise.resolve(report([transportSelectingCp(), candidatePair(0.5)])) // 500 ms
		});
		// 6 bad ticks move ≥4 of the last-7 window to bars=2 → median-7 = 2 → 'poor'.
		await ticks(monitor, 6);
		expect(publishedDetail().rttMs).toBeCloseTo(500, 0);
		expect(monitor.committed).toBe('poor');
	});

	it('does NOT feed the vote from per-media RTCP round-trip (remote-inbound-rtp.roundTripTime) — candidate-pair only', async () => {
		// remote-inbound.roundTripTime is a single un-smoothed RR sample (A-LSR-DLSR) refreshed only ~every 5 s
		// for a muted/DTX send-leg; it holds stale 800-1600 ms spikes that a max() would promote. It measures
		// the SAME me<->Janus leg the candidate-pair already covers, so it is dropped from the vote RTT.
		// With no candidate-pair present, the vote has no RTT evidence.
		const monitor = makeMonitor({
			audioStats: () =>
				Promise.resolve(
					report([{ id: 'ri', type: REMOTE_INBOUND_RTP, roundTripTime: 0.5, kind: 'audio' }])
				)
		});
		await ticks(monitor, 6);
		expect(publishedDetail().rttMs).toBeUndefined();
		expect(monitor.committed).toBe('optimal');
	});

	it('a clean low RTT reads optimal', async () => {
		const monitor = makeMonitor({
			audioStats: () => Promise.resolve(report([candidatePair(0.05)])) // 50 ms
		});
		await monitor.emitInitial();
		expect(monitor.committed).toBe('optimal');
	});
});

describe('ConnectionQualityMonitor — uplink loss', () => {
	it('reads worst remote-inbound fractionLost across sent streams', async () => {
		// packetsSent must advance each tick so the active-layer filter marks both ssrcs as sending.
		let aTick = 0;
		let vTick = 0;
		const monitor = makeMonitor({
			webcamActive: true,
			audioStats: () => {
				aTick += 1;
				return Promise.resolve(
					report([
						candidatePair(0.05),
						{ id: 'outa', type: OUTBOUND_RTP, ssrc: 1, packetsSent: aTick * 50 },
						{ id: 'ria', type: REMOTE_INBOUND_RTP, ssrc: 1, fractionLost: 0.05 }
					])
				);
			},
			videoPeerStats: () => {
				vTick += 1;
				return Promise.resolve(
					report([
						{ id: 'outv', type: OUTBOUND_RTP, ssrc: 2, packetsSent: vTick * 100 },
						{ id: 'riv', type: REMOTE_INBOUND_RTP, ssrc: 2, fractionLost: 0.2 }
					])
				);
			}
		});
		// 6 bad ticks → median-7 at bars=1: uplinkLossScore(0.2)=0 (>16% bad), combineVote 2.0 → bars=1.
		await ticks(monitor, 6);
		expect(publishedDetail().lossUp).toBeCloseTo(0.2, 5);
		expect(monitor.committed).toBe('terrible'); // 20% loss → loss score 0 → 'terrible' under the tuned badge
	});
});

describe('ConnectionQualityMonitor — uplink jitter (clean)', () => {
	it('reads remote-inbound jitter on our send leg and exposes it in ms', async () => {
		// packetsSent must advance so the active-layer filter keeps ssrc 1 active on tick 1.
		const monitor = makeMonitor({
			audioStats: () =>
				Promise.resolve(
					report([
						candidatePair(0.05),
						{ id: 'outa', type: OUTBOUND_RTP, ssrc: 1, packetsSent: 100 },
						{ id: 'ri', type: REMOTE_INBOUND_RTP, ssrc: 1, jitter: 0.05 }
					])
				)
		});
		// tick 1: ssrc 1 first-seen (prev undefined) → treated as active → jitter reads 50 ms.
		await monitor.emitInitial();
		expect(publishedDetail().jitterMs).toBeCloseTo(50, 0);
	});
});

describe('ConnectionQualityMonitor — parked simulcast layer filter', () => {
	it('ignores a parked video layer with stale high jitter and reads only the active layer', async () => {
		// ssrc 10: parked by GCC (framesPerSecond 0) with 71 ms stale jitter.
		// ssrc 20: active (framesPerSecond 25) with 14 ms jitter. The vote must read ~14 ms, not 71.
		const monitor = makeMonitor({
			webcamActive: true,
			videoPeerStats: () =>
				Promise.resolve(
					report([
						{ id: 'op', type: OUTBOUND_RTP, ssrc: 10, framesPerSecond: 0 },
						{ id: 'oa', type: OUTBOUND_RTP, ssrc: 20, framesPerSecond: 25 },
						{ id: 'rip', type: REMOTE_INBOUND_RTP, ssrc: 10, jitter: 0.071 },
						{ id: 'ria', type: REMOTE_INBOUND_RTP, ssrc: 20, jitter: 0.014 }
					])
				)
		});
		// Parked layer (fps 0) is excluded from the first tick → jitterMs ≈ 14 ms, not 71.
		await monitor.emitInitial();
		expect(publishedDetail().jitterMs).toBeCloseTo(14, 0);
		// 7 more ticks of clean 14 ms jitter must NOT drive the vote down (14 ms is fine).
		await ticks(monitor, 7);
		expect(monitor.committed).toBe('optimal');
	});

	it('ignores a parked video layer with stale high fractionLost and reads only the active layer', async () => {
		const monitor = makeMonitor({
			webcamActive: true,
			videoPeerStats: () =>
				Promise.resolve(
					report([
						{ id: 'op', type: OUTBOUND_RTP, ssrc: 10, framesPerSecond: 0 },
						{ id: 'oa', type: OUTBOUND_RTP, ssrc: 20, framesPerSecond: 25 },
						{ id: 'rip', type: REMOTE_INBOUND_RTP, ssrc: 10, fractionLost: 0.3 }, // parked, stale
						{ id: 'ria', type: REMOTE_INBOUND_RTP, ssrc: 20, fractionLost: 0.0 } // active, clean
					])
				)
		});
		// Parked layer (fps 0) excluded from the first tick → lossUp = 0 (only the active layer).
		await monitor.emitInitial();
		expect(publishedDetail().lossUp).toBeCloseTo(0, 5);
		// 7 more ticks of zero loss must leave the vote at 'optimal'.
		await ticks(monitor, 7);
		expect(monitor.committed).toBe('optimal');
	});
});

describe('ConnectionQualityMonitor — evaluateQualityTick is called with no argument', () => {
	it('calls evaluateQualityTick() with no arguments each evaluate() tick', async () => {
		const monitor = makeMonitor();
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const spy = (monitor as any).videoIn.evaluateQualityTick;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		await (monitor as any).evaluate();
		expect(spy).toHaveBeenCalledTimes(1);
		expect(spy).toHaveBeenCalledWith();
	});
});

describe('ConnectionQualityMonitor — uplink status broadcast (relativeScore + maxUplinkTier + maxHardwareTier)', () => {
	beforeEach(() => {
		wsMocks.sendUplinkStatusUpdate.mockClear();
	});

	it('emitInitial broadcasts a numeric relativeScore (not a level string)', async () => {
		const monitor = makeMonitor();
		await monitor.emitInitial();
		expect(wsMocks.sendUplinkStatusUpdate).toHaveBeenCalled();
		const [, relativeScore] = wsMocks.sendUplinkStatusUpdate.mock.calls[0];
		expect(typeof relativeScore).toBe('number');
	});

	it('emitInitial broadcasts null relativeScore when ICE is down (LOST)', async () => {
		const monitor = makeMonitor({ audioConnectionState: 'disconnected' });
		await monitor.emitInitial();
		expect(monitor.committed).toBe('lost');
		const [, relativeScore] = wsMocks.sendUplinkStatusUpdate.mock.calls[0];
		expect(relativeScore).toBeNull();
	});

	it('emitInitial includes maxUplinkTier=null when webcam is off', async () => {
		const monitor = makeMonitor({ webcamActive: false });
		await monitor.emitInitial();
		expect(wsMocks.sendUplinkStatusUpdate).toHaveBeenCalled();
		const [, , , maxUplinkTier] = wsMocks.sendUplinkStatusUpdate.mock.calls[0];
		expect(maxUplinkTier).toBeNull();
	});

	it('emitInitial broadcasts maxHardwareTier=null when captureHeight is unavailable', async () => {
		// rtpSender={} has no .track → captureHeight=undefined → producibleCeiling returns null
		const monitor = makeMonitor({ webcamActive: true });
		await monitor.emitInitial();
		const [, , , , maxHardwareTier] = wsMocks.sendUplinkStatusUpdate.mock.calls[0];
		expect(maxHardwareTier).toBeNull();
	});

	it('emitInitial includes maxUplinkTier when webcam is active and GCC has settled', async () => {
		// trackWebcamUplink sets lastTopActiveRung only when prevCum is already set (tick 1 is transient).
		// Use a video stats factory with a single OUTBOUND_RTP rid='m' so the second call sees progress.
		let vTick = 0;
		const monitor = makeMonitor({
			webcamActive: true,
			videoPeerStats: () => {
				vTick += 1;
				return Promise.resolve(
					report([{ id: 'ov', type: OUTBOUND_RTP, rid: 'm', framesEncoded: vTick * 10 }])
				);
			}
		});
		// Tick 1: prevCum=null → topActiveRung=-1 (transient) → lastTopActiveRung=-1 → myMaxUplinkTier stays null.
		await monitor.emitInitial();
		wsMocks.sendUplinkStatusUpdate.mockClear();
		// Tick 2: prevCum has rid 'm' with framesEncoded=10; current=20>10 → topActiveRung=1 (rid='m' index 1)
		// → lastTopActiveRung=1 ≥ 0 → myMaxUplinkTier=1.
		await monitor.emitInitial();
		const lastCall = wsMocks.sendUplinkStatusUpdate.mock.calls.at(-1);
		expect(lastCall?.[3]).toBe(1);
	});

	it('broadcasts on maxUplinkTier-only change (level unchanged)', async () => {
		// Stub computeQuality so the quality level stays 'optimal' and myMaxUplinkTier is not overwritten.
		// Pre-set committedMaxUplinkTier=1, myMaxUplinkTier=0 → maxUplinkTierChanged fires.
		const monitor = makeMonitor();
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const m = monitor as any;
		const computeStub = vi
			.spyOn(m, 'computeQuality')
			.mockResolvedValue({ raw: {}, level: 'optimal' });

		m.committed = 'optimal';
		m.committedMaxUplinkTier = 1;
		m.myMaxUplinkTier = 0; // GCC stepped down
		m.changedAt = 100;

		wsMocks.sendUplinkStatusUpdate.mockClear();
		await m.evaluate();

		expect(wsMocks.sendUplinkStatusUpdate).toHaveBeenCalled();
		const lastCall = wsMocks.sendUplinkStatusUpdate.mock.calls.at(-1);
		expect(lastCall?.[3]).toBe(0);

		computeStub.mockRestore();
	});

	it('does NOT broadcast when neither level nor maxUplinkTier nor maxHardwareTier changed', async () => {
		const monitor = makeMonitor({ webcamActive: true });
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const m = monitor as any;
		m.lastTopActiveRung = 2;
		m.videoOutPrevCum = { framesEncoded: {} };
		await monitor.emitInitial();
		wsMocks.sendUplinkStatusUpdate.mockClear();

		// Same rung, same level → no broadcast
		m.lastTopActiveRung = 2;
		await m.evaluate();

		expect(wsMocks.sendUplinkStatusUpdate).not.toHaveBeenCalled();
	});
});

describe('ConnectionQualityMonitor — absoluteScore broadcast and selector', () => {
	beforeEach(() => {
		wsMocks.sendUplinkStatusUpdate.mockClear();
	});

	it('emitInitial broadcasts absoluteScore as the third argument (after relativeScore)', async () => {
		const monitor = makeMonitor();
		await monitor.emitInitial();
		expect(wsMocks.sendUplinkStatusUpdate).toHaveBeenCalled();
		const call = wsMocks.sendUplinkStatusUpdate.mock.calls[0];
		// [meetingId, relativeScore, absoluteScore, maxUplinkTier, maxHardwareTier, changedAt]
		const [, relativeScore, absoluteScoreArg] = call;
		expect(typeof relativeScore).toBe('number');
		// No webcam, no feeds → no shortfalls → absoluteScore == relativeScore (round1)
		expect(absoluteScoreArg).toBe(relativeScore);
	});

	it('absoluteScore is null when ICE is down (LOST)', async () => {
		const monitor = makeMonitor({ audioConnectionState: 'disconnected' });
		await monitor.emitInitial();
		const [, , absoluteScoreArg] = wsMocks.sendUplinkStatusUpdate.mock.calls[0];
		expect(absoluteScoreArg).toBeNull();
	});

	it('broadcasts when absoluteScore changes even if level and tiers are unchanged', async () => {
		const monitor = makeMonitor();
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const m = monitor as any;
		const computeStub = vi
			.spyOn(m, 'computeQuality')
			.mockResolvedValue({ raw: {}, level: 'optimal' });

		m.committed = 'optimal';
		m.committedAbsoluteScore = 8;
		m.myAbsoluteScore = 8;
		m.committedMaxUplinkTier = null;
		m.myMaxUplinkTier = null;
		m.committedMaxHardwareTier = null;
		m.myMaxHardwareTier = null;
		m.changedAt = 100;

		// stub downlinkShortfall to now return 1 → absoluteScore drops
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(m.videoIn.downlinkShortfall as ReturnType<typeof vi.fn>).mockReturnValue(1);

		wsMocks.sendUplinkStatusUpdate.mockClear();
		await m.evaluate();

		expect(wsMocks.sendUplinkStatusUpdate).toHaveBeenCalled();
		computeStub.mockRestore();
	});
});
