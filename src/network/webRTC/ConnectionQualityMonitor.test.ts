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

// setupTests.ts stubs the default export for component tests; exercise the real class here
vi.unmock('./ConnectionQualityMonitor');

const CANDIDATE_PAIR = 'candidate-pair';
const REMOTE_INBOUND_RTP = 'remote-inbound-rtp';
const REMOTE_OUTBOUND_RTP = 'remote-outbound-rtp';
const INBOUND_RTP = 'inbound-rtp';
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

const makeMonitor = (
	parts: {
		audioConnectionState?: RTCPeerConnectionState | (() => RTCPeerConnectionState);
		audioStats?: () => Promise<RTCStatsReport>;
		videoPeerStats?: () => Promise<RTCStatsReport>;
		screenPeerStats?: () => Promise<RTCStatsReport>;
		videoInStats?: () => Promise<RTCStatsReport>;
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
				const s = parts.audioConnectionState;
				return typeof s === 'function' ? s() : (s ?? 'connected');
			},
			getStats: parts.audioStats ?? emptyReport
		},
		rtpSender: { track: { enabled: true } }
	} as unknown as IBidirectionalConnectionAudioInOut;

	// null rtpSender = stream off (presence gate); its peerConn.getStats is read only when active.
	const videoOut = {
		peerConn: { getStats: parts.videoPeerStats ?? emptyReport },
		rtpSender: parts.webcamActive ? {} : null
	} as unknown as IVideoOutConnection;

	const screenOut = {
		peerConn: { getStats: parts.screenPeerStats ?? emptyReport },
		rtpSender: parts.screenActive ? {} : null
	} as unknown as IScreenOutConnection;

	const videoIn = {
		peerConn: { getStats: parts.videoInStats ?? emptyReport },
		evaluateQualityTick: vi.fn().mockResolvedValue(undefined)
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
	it('is "lost" when audio PC connection is "failed"', async () => {
		const monitor = makeMonitor({ audioConnectionState: 'failed' });
		await monitor.emitInitial();
		expect(monitor.committed).toBe('lost');
	});

	it('is "lost" when audio PC connection is "disconnected"', async () => {
		const monitor = makeMonitor({ audioConnectionState: 'disconnected' });
		await monitor.emitInitial();
		expect(monitor.committed).toBe('lost');
	});

	it('is "lost" when audio PC connection is "closed"', async () => {
		const monitor = makeMonitor({ audioConnectionState: 'closed' });
		await monitor.emitInitial();
		expect(monitor.committed).toBe('lost');
	});

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

		// Degraded while connected → committed 'poor' (50% loss → combineVote ≈ 3.3 → bars=2 → 'poor').
		await ticks(monitor, 6);
		expect(monitor.committed).toBe('poor');

		// ICE-loss flap.
		phase = 'disconnected';
		await ticks(monitor, 3);
		expect(monitor.committed).toBe('lost');

		// Reconnect, link still degraded → must NOT overshoot to 'optimal'.
		phase = 'connected';
		await monitor.emitInitial();
		expect(monitor.committed).not.toBe('optimal');
		expect(monitor.committed).toBe('poor');
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
		// 6 bad ticks → median-7 at bars=2: uplinkLossScore(0.2)≈0.1, combineVote≈3.4 → bars=2 → 'poor'.
		await ticks(monitor, 6);
		expect(publishedDetail().lossUp).toBeCloseTo(0.2, 5);
		expect(monitor.committed).toBe('poor'); // 20% loss (combineVote ≈ 3.4 → bars 2) is 'poor'
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

describe('ConnectionQualityMonitor — downlink SR-escape loss', () => {
	it('computes (forwarded - received)/forwarded across ticks on the video-in PC', async () => {
		let tick = 0;
		const monitor = makeMonitor({
			// +1000 forwarded and +900 received every tick after the baseline -> a SUSTAINED 10% downlink loss.
			// No packetsLost in inbound-rtp => diagVideoPktLoss=0; invariant 0.10 <= 0 fails =>
			// lossDownVideoOwn=undefined => the vote stays 'optimal' (raw lossDownVideo is display-only).
			videoInStats: () => {
				tick += 1;
				const sent = tick * 1000;
				const recv = tick === 1 ? 1000 : 1000 + (tick - 1) * 900;
				return Promise.resolve(
					report([
						{ id: 'ro1', type: REMOTE_OUTBOUND_RTP, packetsSent: sent },
						{ id: 'in1', type: INBOUND_RTP, remoteId: 'ro1', packetsReceived: recv }
					])
				);
			}
		});
		// tick 1 seeds the SSRC and starts the post-switch mask (VIDEO_LOSS_MASK_TICKS=2).
		await monitor.emitInitial();
		expect(publishedDetail().lossDownVideo).toBeUndefined();
		// ticks 2 (mask still active) and 3 (mask expired → first real 10% reading).
		await ticks(monitor, 2);
		// SR-escape computation still runs and lossDownVideo is populated for the hover display.
		expect(publishedDetail().lossDownVideo).toBeCloseTo(0.1, 5);
		// Invariant fails (diagVideoPktLoss=0 because no packetsLost reported) => lossDownVideoOwn=undefined
		// => raw lossDownVideo has zero vote influence => vote stays 'optimal'.
		await ticks(monitor, 5); // ticks 4-8: loss computed but lossDownVideoOwn undefined, not fed into vote
		expect(monitor.committed).toBe('optimal');
	});

	it('populates lossDownVideoOwn when SR-escape satisfies the invariant but does NOT move the badge (downlink is display-only)', async () => {
		// +1000 forwarded, +900 received, +100 lost per tick after baseline -> SR-escape=10%, diagVideoPktLoss=10%.
		// Invariant: 0.10 <= 0.10 => lossDownVideoOwn=0.10 is populated for the video controller.
		// Badge vote = rttScore + jitterScore + uplinkLossScore ONLY (all undefined here) → stays 'optimal'.
		let tick = 0;
		const monitor = makeMonitor({
			videoInStats: () => {
				tick += 1;
				const sent = tick * 1000;
				const recv = tick === 1 ? 1000 : 1000 + (tick - 1) * 900;
				const lost = (tick - 1) * 100; // 0 at seed, +100 per tick thereafter
				return Promise.resolve(
					report([
						{ id: 'ro1', type: REMOTE_OUTBOUND_RTP, packetsSent: sent },
						{
							id: 'in1',
							type: INBOUND_RTP,
							remoteId: 'ro1',
							packetsReceived: recv,
							packetsLost: lost
						}
					])
				);
			}
		});
		// ticks 1-2: SSRC seed + mask; ticks 3+: lossDownVideoOwn=0.10.
		await ticks(monitor, 9);
		expect(publishedDetail().lossDownVideoOwn).toBeCloseTo(0.1, 5);
		// Downlink loss does NOT drive the badge — only rttScore/jitterScore/uplinkLossScore do.
		expect(monitor.committed).toBe('optimal');
	});

	it('leaves the vote "optimal" when SR-escape violates the invariant (SR-escape > packetsLost)', async () => {
		// +1000 forwarded, +600 received -> SR-escape=40%; +30 lost per tick -> diagVideoPktLoss≈4.8%.
		// Invariant: 0.40 > 0.048 => counters corrupted => lossDownVideoOwn=undefined => vote unaffected.
		let tick = 0;
		const monitor = makeMonitor({
			videoInStats: () => {
				tick += 1;
				const sent = tick * 1000;
				const recv = tick === 1 ? 1000 : 1000 + (tick - 1) * 600;
				const lost = (tick - 1) * 30;
				return Promise.resolve(
					report([
						{ id: 'ro1', type: REMOTE_OUTBOUND_RTP, packetsSent: sent },
						{
							id: 'in1',
							type: INBOUND_RTP,
							remoteId: 'ro1',
							packetsReceived: recv,
							packetsLost: lost
						}
					])
				);
			}
		});
		await ticks(monitor, 9);
		// lossDownVideo is high and populated for display, but lossDownVideoOwn is undefined (invariant failed).
		expect(publishedDetail().lossDownVideo).toBeGreaterThan(0.3);
		expect(publishedDetail().lossDownVideoOwn).toBeUndefined();
		expect(monitor.committed).toBe('optimal');
	});

	it('does NOT leak the publisher uplink loss (ignores inbound-rtp.packetsLost)', async () => {
		let tick = 0;
		const monitor = makeMonitor({
			videoInStats: () => {
				tick += 1;
				const sent = tick * 1000; // +1000 forwarded and +1000 received every tick -> 0% downlink loss
				const recv = tick * 1000;
				return Promise.resolve(
					report([
						{ id: 'ro1', type: REMOTE_OUTBOUND_RTP, packetsSent: sent },
						// large packetsLost = the PUBLISHER's uplink loss; must NOT count as ours
						{
							id: 'in1',
							type: INBOUND_RTP,
							remoteId: 'ro1',
							packetsReceived: recv,
							packetsLost: 500
						}
					])
				);
			}
		});
		// seed + 2-tick mask + clean 0%-loss readings → steady 0%.
		await ticks(monitor, 6);
		expect(publishedDetail().lossDownVideo).toBe(0);
		expect(monitor.committed).toBe('optimal');
	});

	it('gates the reading when fewer than 20 packets forwarded (volume gate — noisy few-packet window)', async () => {
		let tick = 0;
		const monitor = makeMonitor({
			// only 10 packets forwarded per tick — well below MIN_EXPECTED_PACKETS
			videoInStats: () => {
				tick += 1;
				const sent = tick * 10;
				const recv = tick * 9; // 10% loss, but should not be reported
				return Promise.resolve(
					report([
						{ id: 'ro1', type: REMOTE_OUTBOUND_RTP, packetsSent: sent },
						{ id: 'in1', type: INBOUND_RTP, remoteId: 'ro1', packetsReceived: recv }
					])
				);
			}
		});
		await monitor.emitInitial(); // baseline
		await monitor.emitInitial(); // dSent = 10 < 20 -> undefined
		expect(publishedDetail().lossDownVideo).toBeUndefined();
	});

	it('reports loss when >= 20 packets are forwarded (gate passes, real loss measured)', async () => {
		let tick = 0;
		const monitor = makeMonitor({
			// exactly 20 forwarded per tick with 50% loss — gate must pass
			videoInStats: () => {
				tick += 1;
				const sent = tick * 20;
				const recv = tick === 1 ? 20 : 20 + (tick - 1) * 10; // 50% loss per window
				return Promise.resolve(
					report([
						{ id: 'ro1', type: REMOTE_OUTBOUND_RTP, packetsSent: sent },
						{ id: 'in1', type: INBOUND_RTP, remoteId: 'ro1', packetsReceived: recv }
					])
				);
			}
		});
		// tick 1 seeds SSRC and starts mask (VIDEO_LOSS_MASK_TICKS=2); first real reading at tick 3.
		// ticks(6) runs ticks 1-6, all of which after tick 3 show 50% loss.
		await ticks(monitor, 6);
		expect(publishedDetail().lossDownVideo).toBeCloseTo(0.5, 5);
	});

	it('does NOT over-report loss on a stale-SR tick (received advances while packetsSent is frozen)', async () => {
		// After warmup (past the post-switch mask), an SR that freezes for a tick must not cause a false
		// loss: the baseline is held so the next SR advance measures dRecv over the SAME span as dSent.
		let tick = 0;
		const monitor = makeMonitor({
			videoInStats: () => {
				tick += 1;
				// ticks 1..6 stable & clean (warm past the mask); tick 7 stale SR (sent frozen @6000, recv
				// advances); tick 8 SR advances 6000->7000. Baseline held over the stale tick -> 0% loss, not 50%.
				const sent = tick <= 6 ? tick * 1000 : tick === 7 ? 6000 : 7000;
				const recv = tick <= 6 ? tick * 1000 : tick === 7 ? 6500 : 7000;
				return Promise.resolve(
					report([
						{ id: 'ro1', type: REMOTE_OUTBOUND_RTP, packetsSent: sent },
						{ id: 'in1', type: INBOUND_RTP, remoteId: 'ro1', packetsReceived: recv }
					])
				);
			}
		});
		// seed + 2-tick mask + clean 0%-loss ticks (VIDEO_LOSS_MASK_TICKS=2: ticks 1-2 masked, 3+ real).
		await ticks(monitor, 6); // ticks 1-6
		expect(publishedDetail().lossDownVideo).toBe(0);
		await monitor.emitInitial(); // tick 7: stale SR (dSent 0) -> skipped, baseline held
		expect(publishedDetail().lossDownVideo).toBeUndefined();
		await monitor.emitInitial(); // tick 8: SR advances -> dSent 1000, dRecv 1000 -> 0% loss
		expect(publishedDetail().lossDownVideo).toBe(0);
		expect(monitor.committed).toBe('optimal');
	});

	it('does NOT produce a false loss spike on an SSRC discontinuity (per-SSRC baseline isolation)', async () => {
		// Root cause of spurious video-downlink spikes: when a stream is unsubscribed then resubscribed
		// (AUTO-OFF→ON, or a new publisher) the SSRC changes. Pooling all cumulative counters then diffing
		// a single aggregate compares mismatched baselines and produces dSent/dRecv from different sessions
		// -> a ~100% loss for that window. Per-SSRC isolation seeds a fresh baseline on the new SSRC and
		// does not contribute on the first tick, so no false spike.
		let tick = 0;
		const monitor = makeMonitor({
			videoInStats: () => {
				tick += 1;
				if (tick === 1) {
					// SSRC A: seed tick
					return Promise.resolve(
						report([
							{ id: 'roA', type: REMOTE_OUTBOUND_RTP, packetsSent: 1000 },
							{ id: 'inA', type: INBOUND_RTP, remoteId: 'roA', packetsReceived: 1000 }
						])
					);
				}
				// SSRC A gone, SSRC B appears (discontinuity): new (remoteId, inboundId) pair.
				// Without per-SSRC isolation, dSent = B.sent - A.sent = 2000-1000 = 1000 and
				// dRecv = B.recv - A.recv = 100-1000 = negative -> clamped to 0 -> 100% false loss.
				return Promise.resolve(
					report([
						{ id: 'roB', type: REMOTE_OUTBOUND_RTP, packetsSent: 2000 },
						{ id: 'inB', type: INBOUND_RTP, remoteId: 'roB', packetsReceived: 100 }
					])
				);
			}
		});
		await monitor.emitInitial(); // tick 1: SSRC A seeded, no reading
		expect(publishedDetail().lossDownVideo).toBeUndefined();
		await monitor.emitInitial(); // tick 2: SSRC B is new -> fresh baseline, no contribution -> undefined
		expect(publishedDetail().lossDownVideo).toBeUndefined();
		expect(monitor.committed).toBe('optimal');
	});

	it('a large downlink video loss does NOT move the badge while rtt/jitter/uplink are clean', async () => {
		// Severe 40% downlink loss with invariant satisfied (lossDownVideoOwn=0.40). The three badge
		// signals (rttScore, jitterScore, uplinkLossScore) are all undefined → 10/10 → badge 'optimal'.
		// Downlink loss feeds the video controller only, not the badge.
		let tick = 0;
		const monitor = makeMonitor({
			videoInStats: () => {
				tick += 1;
				const sent = tick * 1000;
				const recv = tick * 600;
				const lost = tick === 1 ? 0 : (tick - 1) * 400;
				return Promise.resolve(
					report([
						{ id: 'ro1', type: REMOTE_OUTBOUND_RTP, packetsSent: sent },
						{
							id: 'in1',
							type: INBOUND_RTP,
							remoteId: 'ro1',
							packetsReceived: recv,
							packetsLost: lost
						}
					])
				);
			}
		});
		// 2 masked ticks + several real 40%-loss ticks; badge must remain 'optimal'.
		await ticks(monitor, 9);
		expect(publishedDetail().lossDownVideoOwn).toBeGreaterThan(0.3);
		expect(monitor.committed).toBe('optimal');
	});
});

describe('ConnectionQualityMonitor — evaluateQualityTick (video controller feed)', () => {
	// Build a monitor with an explicit evaluateQualityTick spy, suitable for driving via the
	// private evaluate() path (the timer is stopped; emitInitial() does not call evaluateQualityTick).
	const buildWithSpy = (
		videoInStats?: () => Promise<RTCStatsReport>
	): { monitor: ConnectionQualityMonitor; spy: ReturnType<typeof vi.fn> } => {
		useStore.setState({
			session: { id: 'me' },
			activeMeeting: {
				meetingId: 'meetingId',
				connectionQuality: {},
				connectionScoreDetail: undefined
			}
		} as unknown as RootStore);

		const audioConn = {
			peerConn: { connectionState: 'connected', getStats: emptyReport },
			rtpSender: { track: { enabled: true } }
		} as unknown as IBidirectionalConnectionAudioInOut;

		const videoOut = {
			peerConn: { getStats: emptyReport },
			rtpSender: null
		} as unknown as IVideoOutConnection;

		const screenOut = {
			peerConn: { getStats: emptyReport },
			rtpSender: null
		} as unknown as IScreenOutConnection;

		const spy = vi.fn().mockResolvedValue(undefined);
		const videoIn = {
			peerConn: { getStats: videoInStats ?? emptyReport },
			evaluateQualityTick: spy
		} as unknown as IVideoScreenInConnection;

		const monitor = new ConnectionQualityMonitor(
			'meetingId',
			audioConn,
			videoOut,
			screenOut,
			videoIn
		);
		monitor.stop();
		return { monitor, spy };
	};

	it('is called with a number on each timer tick; with no stats dlScore equals 10', async () => {
		const { monitor, spy } = buildWithSpy();
		// evaluate() is the production timer path; call it directly via private access.
		await (monitor as any).evaluate();
		expect(spy).toHaveBeenCalledOnce();
		expect(typeof spy.mock.calls[0][0]).toBe('number');
		expect(spy).toHaveBeenCalledWith(10); // undefined loss → curveScore(undefined) = 10
	});

	it('receives a low dlScore (< 5) when downlink video loss is high and invariant is satisfied', async () => {
		// 40% downlink loss: +1000 forwarded, +600 received, +400 lost per tick.
		// SR-escape = 40%; diagVideoPktLoss = 40%; invariant satisfied → lossDownVideoOwn = 0.40.
		// downlinkVideoLossScore(0.40) = 10 * ((0.42-0.40)/0.40)^2 ≈ 0.025 — well below 5.
		let tick = 0;
		const { monitor, spy } = buildWithSpy(() => {
			tick += 1;
			const sent = tick * 1000;
			const recv = tick * 600;
			const lost = tick === 1 ? 0 : (tick - 1) * 400;
			return Promise.resolve(
				report([
					{ id: 'ro1', type: REMOTE_OUTBOUND_RTP, packetsSent: sent },
					{
						id: 'in1',
						type: INBOUND_RTP,
						remoteId: 'ro1',
						packetsReceived: recv,
						packetsLost: lost
					}
				])
			);
		});
		// tick 1: SSRC seeded, mask=2→1, lossDownVideoOwn=undefined → dlScore=10
		// tick 2: mask=1→0, still masked → dlScore=10
		// tick 3: real reading → lossDownVideoOwn≈0.40 → dlScore≈0.025
		await (monitor as any).evaluate();
		await (monitor as any).evaluate();
		await (monitor as any).evaluate();
		const lastArg = spy.mock.calls.at(-1)?.[0] as number;
		expect(lastArg).toBeLessThan(5);
	});
});
