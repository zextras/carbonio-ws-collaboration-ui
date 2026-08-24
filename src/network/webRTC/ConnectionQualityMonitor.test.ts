/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, it } from 'vitest';

import ConnectionQualityMonitor, { stepHysteresis } from './ConnectionQualityMonitor';
import { ConnectionQuality, LinkSample } from './connectionQualityScore';
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

describe('stepHysteresis', () => {
	it('commits the first level immediately regardless of direction', () => {
		expect(stepHysteresis('medium', null, 0)).toEqual({ next: 'medium', streak: 0, changed: true });
	});

	it('commits to "lost" immediately even when currently optimal', () => {
		expect(stepHysteresis('lost', 'optimal', 0)).toEqual({
			next: 'lost',
			streak: 0,
			changed: true
		});
	});

	it('does not fire changed when level is already "lost"', () => {
		const r = stepHysteresis('lost', 'lost', 0);
		expect(r.changed).toBe(false);
		expect(r.next).toBe('lost');
	});

	it('leaves "lost" in a single tick when a non-lost level arrives (no better-streak)', () => {
		expect(stepHysteresis('poor', 'lost', 0)).toEqual({ next: 'poor', streak: 0, changed: true });
	});

	it('commits a worsening level immediately (1 tick)', () => {
		expect(stepHysteresis('poor', 'optimal', 0)).toEqual({
			next: 'poor',
			streak: 0,
			changed: true
		});
	});

	it('does not commit an improvement until the 3rd consecutive better tick', () => {
		let streak = 0;
		const committed: ConnectionQuality = 'poor';

		const r1 = stepHysteresis('optimal', committed, streak);
		expect(r1.changed).toBe(false);
		expect(r1.next).toBe('poor');
		streak = r1.streak;

		const r2 = stepHysteresis('optimal', committed, streak);
		expect(r2.changed).toBe(false);
		expect(r2.next).toBe('poor');
		streak = r2.streak;

		const r3 = stepHysteresis('optimal', committed, streak);
		expect(r3.changed).toBe(true);
		expect(r3.next).toBe('optimal');
		expect(r3.streak).toBe(0);
	});

	it('resets the better streak when a same-level tick arrives', () => {
		const r1 = stepHysteresis('optimal', 'poor', 0);
		expect(r1.streak).toBe(1);

		const r2 = stepHysteresis('poor', 'poor', r1.streak);
		expect(r2.streak).toBe(0);
		expect(r2.changed).toBe(false);
	});

	it('resets the better streak when the level worsens mid-climb', () => {
		const r1 = stepHysteresis('optimal', 'poor', 0);
		expect(r1.streak).toBe(1);

		const r2 = stepHysteresis('terrible', 'poor', r1.streak);
		expect(r2.streak).toBe(0);
		expect(r2.changed).toBe(true);
		expect(r2.next).toBe('terrible');
	});

	it('unchanged same-level produces changed: false', () => {
		expect(stepHysteresis('medium', 'medium', 0)).toEqual({
			next: 'medium',
			streak: 0,
			changed: false
		});
	});
});

const INBOUND_RTP = 'inbound-rtp';
const REMOTE_INBOUND_RTP = 'remote-inbound-rtp';
const REMOTE_OUTBOUND_RTP = 'remote-outbound-rtp';
const CANDIDATE_PAIR = 'candidate-pair';

const report = (stats: Array<Record<string, unknown>>): RTCStatsReport =>
	// the id used by the SR-escape pairing is the stat's own `id` field, not the Map key
	new Map(stats.map((s, i) => [String(s.id ?? i), s])) as unknown as RTCStatsReport;

const emptyReport = (): Promise<RTCStatsReport> => Promise.resolve(report([]));

const makeMonitor = (
	parts: {
		audioConnectionState?: RTCPeerConnectionState;
		audioStats?: () => Promise<RTCStatsReport>;
		videoSender?: { getStats: () => Promise<RTCStatsReport> };
		screenSender?: { getStats: () => Promise<RTCStatsReport> };
		videoInStats?: () => Promise<RTCStatsReport>;
	} = {}
): ConnectionQualityMonitor => {
	// setState MERGES, so the store's real action methods (setConnectionScoreDetail, ...) survive; only
	// session/activeMeeting are replaced with the fixture the monitor reads/writes.
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
			connectionState: parts.audioConnectionState ?? 'connected',
			getStats: parts.audioStats ?? emptyReport
		}
	} as unknown as IBidirectionalConnectionAudioInOut;
	const videoOut = { rtpSender: parts.videoSender ?? null } as unknown as IVideoOutConnection;
	const videoIn = {
		peerConn: parts.videoInStats ? { getStats: parts.videoInStats } : null
	} as unknown as IVideoScreenInConnection;
	const screenOut = { rtpSender: parts.screenSender ?? null } as unknown as IScreenOutConnection;
	const monitor = new ConnectionQualityMonitor(
		'meetingId',
		audioConn,
		videoOut,
		videoIn,
		screenOut
	);
	// stop the 2 s timer; the getStats mappers are exercised via emitInitial()
	monitor.stop();
	return monitor;
};

const publishedDetail = (): LinkSample =>
	useStore.getState().activeMeeting?.connectionScoreDetail ?? {};

describe('ConnectionQualityMonitor (RTT + loss via emitInitial)', () => {
	it('is "lost" when the audio PC connection is failed, regardless of stats', async () => {
		const monitor = makeMonitor({ audioConnectionState: 'failed' });
		await monitor.emitInitial();
		expect(monitor.committed).toBe('lost');
	});

	it('is "optimal" with no signal at all (idle, muted, nothing sent or received)', async () => {
		const monitor = makeMonitor({});
		await monitor.emitInitial();
		expect(monitor.committed).toBe('optimal');
		expect(publishedDetail()).toEqual({
			rttMs: undefined,
			lossUp: undefined,
			lossDown: undefined
		});
	});

	it('reads RTT from the audio PC candidate-pair; bad RTT alone drops the level', async () => {
		const monitor = makeMonitor({
			audioStats: () =>
				Promise.resolve(
					report([
						{
							type: CANDIDATE_PAIR,
							nominated: true,
							state: 'succeeded',
							currentRoundTripTime: 0.45
						}
					])
				)
		});
		await monitor.emitInitial();
		expect(publishedDetail().rttMs).toBeCloseTo(450, 5);
		// rttScore(450)=2.5, loss unknown -> lossScore 10; blend 4.4 -> poor
		expect(monitor.committed).toBe('poor');
	});

	it('takes uplink loss as the worst fractionLost across my sent streams', async () => {
		const monitor = makeMonitor({
			audioStats: () =>
				Promise.resolve(
					report([
						{
							type: CANDIDATE_PAIR,
							nominated: true,
							state: 'succeeded',
							currentRoundTripTime: 0.02
						},
						{ type: REMOTE_INBOUND_RTP, kind: 'audio', fractionLost: 0.05 }
					])
				),
			videoSender: {
				getStats: () =>
					Promise.resolve(report([{ type: REMOTE_INBOUND_RTP, kind: 'video', fractionLost: 0.3 }]))
			}
		});
		await monitor.emitInitial();
		// worst of 0.05 (audio) and 0.3 (video) = 0.3
		expect(publishedDetail().lossUp).toBeCloseTo(0.3, 5);
		expect(monitor.committed).toBe('poor');
	});

	it('reads downlink loss via the SR escape, immune to the publisher upstream loss', async () => {
		let tick = 0;
		const monitor = makeMonitor({
			audioStats: () => {
				tick += 1;
				// forwarded (Janus->me) grows 1000/tick; received grows cleanly on tick 1, then loses 100
				const sent = 1000 * tick;
				const recv = tick === 1 ? 1000 : 1900;
				return Promise.resolve(
					report([
						{
							type: CANDIDATE_PAIR,
							nominated: true,
							state: 'succeeded',
							currentRoundTripTime: 0.02
						},
						{ type: REMOTE_INBOUND_RTP, kind: 'audio', fractionLost: 0 },
						{ type: REMOTE_OUTBOUND_RTP, id: 'ro1', packetsSent: sent },
						// packetsLost is huge (publisher's own uplink loss) — it MUST NOT affect our downlink
						{
							type: INBOUND_RTP,
							kind: 'audio',
							remoteId: 'ro1',
							packetsReceived: recv,
							packetsLost: 5000
						}
					])
				);
			}
		});
		await monitor.emitInitial(); // tick 1: baseline pool {sent:1000, recv:1000}
		await monitor.emitInitial(); // tick 2: Δsent=1000, Δrecv=900 -> 10% forwarded-but-lost
		expect(publishedDetail().lossDown).toBeCloseTo(0.1, 5);
		expect(publishedDetail().lossUp).toBe(0);
		expect(monitor.committed).toBe('poor');
	});

	it('is "optimal" on a clean, low-latency link that both sends and receives', async () => {
		let tick = 0;
		const monitor = makeMonitor({
			audioStats: () => {
				tick += 1;
				return Promise.resolve(
					report([
						{
							type: CANDIDATE_PAIR,
							nominated: true,
							state: 'succeeded',
							currentRoundTripTime: 0.03
						},
						{ type: REMOTE_INBOUND_RTP, kind: 'audio', fractionLost: 0 },
						{ type: REMOTE_OUTBOUND_RTP, id: 'ro1', packetsSent: 1000 * tick },
						{ type: INBOUND_RTP, kind: 'audio', remoteId: 'ro1', packetsReceived: 1000 * tick }
					])
				);
			}
		});
		await monitor.emitInitial();
		await monitor.emitInitial();
		expect(publishedDetail().lossUp).toBe(0);
		expect(publishedDetail().lossDown).toBe(0);
		expect(monitor.committed).toBe('optimal');
	});
});
