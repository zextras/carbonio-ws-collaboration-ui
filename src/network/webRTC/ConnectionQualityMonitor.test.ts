/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, it, vi } from 'vitest';

import ConnectionQualityMonitor, {
	deltaLossRate,
	stepHysteresis
} from './ConnectionQualityMonitor';
import { ConnectionQuality, StreamVotes } from './connectionQualityScore';
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

describe('deltaLossRate', () => {
	it('returns 0 when there are fewer than minSamples total packets', () => {
		expect(deltaLossRate(2, 2, 0, 0)).toBe(0);
	});

	it('computes the delta loss fraction when denominator meets the threshold', () => {
		// 5 new lost, 15 new received → loss = 5/20 = 0.25
		expect(deltaLossRate(5, 15, 0, 0)).toBe(0.25);
	});

	it('clamps negative deltas to 0', () => {
		// prevLost > currentLost is a reset/reorder artifact; treat as 0 new loss
		expect(deltaLossRate(0, 20, 10, 0)).toBe(0);
	});

	it('returns 0 on a clean tick', () => {
		expect(deltaLossRate(10, 110, 10, 100)).toBe(0);
	});

	it('uses a custom minSamples threshold', () => {
		// 4 total packets < default 5 → 0, but >= custom 3 → actual rate
		expect(deltaLossRate(1, 3, 0, 0, 3)).toBeCloseTo(0.25);
		expect(deltaLossRate(1, 3, 0, 0, 5)).toBe(0);
	});
});

describe('stepHysteresis', () => {
	it('commits the first level immediately regardless of direction', () => {
		const r = stepHysteresis('medium', null, 0);
		expect(r).toEqual({ next: 'medium', streak: 0, changed: true });
	});

	it('commits to "lost" immediately even when currently optimal', () => {
		const r = stepHysteresis('lost', 'optimal', 0);
		expect(r).toEqual({ next: 'lost', streak: 0, changed: true });
	});

	it('does not fire changed when level is already "lost"', () => {
		const r = stepHysteresis('lost', 'lost', 0);
		expect(r.changed).toBe(false);
		expect(r.next).toBe('lost');
	});

	it('leaves "lost" in a single tick when a non-lost level arrives (no better-streak)', () => {
		const r = stepHysteresis('poor', 'lost', 0);
		expect(r).toEqual({ next: 'poor', streak: 0, changed: true });
	});

	it('commits a worsening level immediately (1 tick)', () => {
		const r = stepHysteresis('poor', 'optimal', 0);
		expect(r).toEqual({ next: 'poor', streak: 0, changed: true });
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
		const r = stepHysteresis('medium', 'medium', 0);
		expect(r).toEqual({ next: 'medium', streak: 0, changed: false });
	});
});

const INBOUND_RTP = 'inbound-rtp';
const OUTBOUND_RTP = 'outbound-rtp';
const REMOTE_INBOUND_RTP = 'remote-inbound-rtp';

const report = (stats: Array<Record<string, unknown>>): RTCStatsReport =>
	new Map(stats.map((s, i) => [String(i), s])) as unknown as RTCStatsReport;

const emptyReport = (): Promise<RTCStatsReport> => Promise.resolve(report([]));

const makeMonitor = (
	parts: {
		audioConnectionState?: RTCPeerConnectionState;
		audioStats?: () => Promise<RTCStatsReport>;
		myAudioOn?: boolean;
		otherParticipant?: boolean;
		otherAudioOn?: boolean;
		videoSender?: {
			track?: { getSettings: () => { height: number } };
			getStats: () => Promise<RTCStatsReport>;
		};
		videoFeeds?: Array<{ requestedRung: number; inboundLossRate: number; freezeFraction: number }>;
		hasScreenFeed?: boolean;
		screenReceiverStats?: () => Promise<RTCStatsReport>;
		screenSender?: { getStats: () => Promise<RTCStatsReport> };
	} = {}
): ConnectionQualityMonitor => {
	// Audio presence is read from participant/session state, so the store must be primed before the
	// monitor reads it. Votes are published to activeMeeting.connectionQualityVotes and read from there.
	const participants: Record<string, { userId: string; audioStreamOn: boolean }> = {
		me: { userId: 'me', audioStreamOn: parts.myAudioOn ?? false }
	};
	if (parts.otherParticipant) {
		participants.other = { userId: 'other', audioStreamOn: parts.otherAudioOn ?? true };
	}
	useStore.setState({
		session: { id: 'me' },
		meetings: { meetingId: { participants } },
		activeMeeting: { meetingId: 'meetingId', connectionQuality: {}, connectionQualityVotes: {} }
	} as unknown as RootStore);

	const audioConn = {
		peerConn: {
			connectionState: parts.audioConnectionState ?? 'connected',
			getStats: parts.audioStats ?? emptyReport
		}
	} as unknown as IBidirectionalConnectionAudioInOut;
	const videoOut = {
		rtpSender: parts.videoSender ?? null
	} as unknown as IVideoOutConnection;
	const screenReceiver = parts.screenReceiverStats
		? ({ getStats: parts.screenReceiverStats } as unknown as RTCRtpReceiver)
		: null;
	const videoIn = {
		getVideoFeedsForQuality: () => parts.videoFeeds ?? [],
		hasScreenFeed: () => parts.hasScreenFeed ?? false,
		getScreenReceiver: () => screenReceiver
	} as unknown as IVideoScreenInConnection;
	const screenOut = {
		rtpSender: parts.screenSender ?? null
	} as unknown as IScreenOutConnection;
	const monitor = new ConnectionQualityMonitor(
		'meetingId',
		audioConn,
		videoOut,
		videoIn,
		screenOut
	);
	// stop the 2 s evaluation timer; the getStats mappers are exercised via emitInitial()
	monitor.stop();
	return monitor;
};

// The votes the monitor last published to the store.
const publishedVotes = (): StreamVotes =>
	useStore.getState().activeMeeting?.connectionQualityVotes ?? {};

describe('ConnectionQualityMonitor getStats mappers (via emitInitial)', () => {
	it('audio: scores down (concealmentRatio) and up (fractionLost + rtt) independently while both flow', async () => {
		const monitor = makeMonitor({
			myAudioOn: true,
			otherParticipant: true,
			audioStats: () =>
				Promise.resolve(
					report([
						{
							type: INBOUND_RTP,
							kind: 'audio',
							concealedSamples: 100,
							totalSamplesReceived: 1000,
							jitterBufferDelay: 0,
							jitterBufferEmittedCount: 0
						},
						// fractionLost 0.15, no rtt -> uplinkAudio = score(max(0.15/0.30,0)) = 5
						{ type: REMOTE_INBOUND_RTP, kind: 'audio', fractionLost: 0.15, roundTripTime: 0 }
					])
				)
		});
		await monitor.emitInitial();
		// concealmentRatio = 100/1000 = 0.1, jbDelayPerFrameSec = 0
		// down impairment = max(0.1/0.20, 0) = 0.5 -> score = 5
		expect(publishedVotes().downlinkAudio).toBe(5);
		// up = score(max(0.15/0.30, (0-300)/700)) = score(0.5) = 5
		expect(publishedVotes().uplinkAudio).toBe(5);
		expect(monitor.committed).toBe('medium');
	});

	it('audio uplink is omitted when my mic is off (never scored on a channel I am not using)', async () => {
		const monitor = makeMonitor({
			myAudioOn: false,
			otherParticipant: true,
			audioStats: () =>
				Promise.resolve(
					report([
						{
							type: INBOUND_RTP,
							kind: 'audio',
							concealedSamples: 0,
							totalSamplesReceived: 100
						},
						// the far-end up-loss report must be ignored while my mic is off
						{ type: REMOTE_INBOUND_RTP, kind: 'audio', fractionLost: 0.2 }
					])
				)
		});
		await monitor.emitInitial();
		expect(publishedVotes().uplinkAudio).toBeUndefined();
		expect(publishedVotes().downlinkAudio).toBe(10);
	});

	it('audio is fully omitted when alone and mic off -> optimal, never a phantom 10', async () => {
		const monitor = makeMonitor({ myAudioOn: false, otherParticipant: false });
		await monitor.emitInitial();
		expect(publishedVotes().uplinkAudio).toBeUndefined();
		expect(publishedVotes().downlinkAudio).toBeUndefined();
		expect(monitor.committed).toBe('optimal');
	});

	it('audio uplink present alone when my mic is on; downlink still omitted (no one to hear)', async () => {
		const monitor = makeMonitor({
			myAudioOn: true,
			otherParticipant: false,
			audioStats: () =>
				Promise.resolve(report([{ type: REMOTE_INBOUND_RTP, kind: 'audio', fractionLost: 0 }]))
		});
		await monitor.emitInitial();
		expect(publishedVotes().uplinkAudio).toBe(10);
		expect(publishedVotes().downlinkAudio).toBeUndefined();
	});

	it('audio downlink omitted when the only other participant has their mic off (nothing to hear)', async () => {
		const monitor = makeMonitor({
			myAudioOn: false,
			otherParticipant: true,
			otherAudioOn: false,
			audioStats: () =>
				Promise.resolve(
					report([
						{ type: INBOUND_RTP, kind: 'audio', concealedSamples: 0, totalSamplesReceived: 100 }
					])
				)
		});
		await monitor.emitInitial();
		expect(publishedVotes().downlinkAudio).toBeUndefined();
		expect(publishedVotes().uplinkAudio).toBeUndefined();
	});

	it('audio downlink: jbDelayPerFrameSec at the BAD threshold saturates the vote to 0', async () => {
		const monitor = makeMonitor({
			otherParticipant: true,
			audioStats: () =>
				Promise.resolve(
					report([
						{
							type: INBOUND_RTP,
							kind: 'audio',
							concealedSamples: 0,
							totalSamplesReceived: 0,
							// 0.50 s/frame over 100 frames = JB_BAD
							jitterBufferDelay: 50,
							jitterBufferEmittedCount: 100
						}
					])
				)
		});
		await monitor.emitInitial();
		// jbDelayPerFrameSec = 50/100 = 0.50 = JB_BAD -> impairment = 1 -> vote 0
		expect(publishedVotes().downlinkAudio).toBe(0);
	});

	it('webcam uplink: a BW-limited sender maps its top active rung to a fractional vote', async () => {
		const monitor = makeMonitor({
			videoSender: {
				track: { getSettings: () => ({ height: 720 }) },
				getStats: () =>
					Promise.resolve(
						report([
							{
								type: OUTBOUND_RTP,
								rid: 'l',
								bytesSent: 1000,
								framesEncoded: 100,
								active: true,
								// qualityLimitationDurations provide windowed BW/CPU fractions
								qualityLimitationDurations: { bandwidth: 2, cpu: 0 }
							},
							{ type: OUTBOUND_RTP, rid: 'm', bytesSent: 2000, framesEncoded: 200, active: true },
							{ type: OUTBOUND_RTP, rid: 'h', bytesSent: 0, active: false }
						])
					)
			}
		});
		await monitor.emitInitial();
		// producibleRungs=3, topActiveRung=1 (h inactive), bwLimitedFraction >> cpuLimitedFraction
		// → tierVote = 2/3*10 = 6.7, lossRate=0 → vote = 6.7
		expect(publishedVotes().uplinkWebcam).toBe(6.7);
	});

	it('webcam uplink: CPU-dominant limitation is excluded (CPU is not a network fact)', async () => {
		// The windowed fraction requires TWO ticks to compute a meaningful delta:
		// tick 1 — new sender resets the ring; snapshot {cpu:2} becomes the baseline.
		// tick 2 — counter grew to {cpu:4}; cpuLimitedFraction = Δ2/windowSec >> bwLimitedFraction=0
		//           → byCpu=true → tierVote=10 (scale-down attributed to CPU, excluded from score).
		let cpuCounter = 0;
		let bytesMultiplier = 0;
		const monitor = makeMonitor({
			videoSender: {
				track: { getSettings: () => ({ height: 720 }) },
				getStats: () => {
					cpuCounter += 2;
					bytesMultiplier += 1;
					return Promise.resolve(
						report([
							{
								type: OUTBOUND_RTP,
								rid: 'l',
								bytesSent: 500 * bytesMultiplier,
								framesEncoded: 100 * bytesMultiplier,
								active: true,
								qualityLimitationDurations: { bandwidth: 0, cpu: cpuCounter }
							},
							{
								type: OUTBOUND_RTP,
								rid: 'm',
								bytesSent: 1000 * bytesMultiplier,
								framesEncoded: 100 * bytesMultiplier,
								active: true
							},
							{ type: OUTBOUND_RTP, rid: 'h', bytesSent: 0, active: false }
						])
					);
				}
			}
		});
		await monitor.emitInitial(); // tick 1: baseline established (fractions = 0 after ring reset)
		await monitor.emitInitial(); // tick 2: Δcpu > 0, Δbw = 0 → cpuLimitedFraction >> bwLimitedFraction
		// topActiveRung=1, scaledDown=true, byCpu=true → tierVote=10
		expect(publishedVotes().uplinkWebcam).toBe(10);
	});

	it('webcam uplink: GCC-trickle top layer (bytesSent growing, framesEncoded flat) is not counted as active', async () => {
		// RTX/padding keep bytesSent growing and active=true on a GCC-disabled layer; only
		// framesEncoded reveals that the encoder stopped producing frames for that layer.
		// tick 1: h and m both "grew" from 0 baseline → topActiveRung=2 (both look active).
		// tick 2: h.framesEncoded flat (5→5), m.framesEncoded grew (10→20) → topActiveRung=1 (m wins).
		let tick = 0;
		const monitor = makeMonitor({
			videoSender: {
				track: { getSettings: () => ({ height: 720 }) },
				getStats: () => {
					tick += 1;
					return Promise.resolve(
						report([
							{
								type: OUTBOUND_RTP,
								rid: 'l',
								bytesSent: 500 * tick,
								framesEncoded: 50 * tick,
								active: true
							},
							{
								type: OUTBOUND_RTP,
								rid: 'm',
								bytesSent: 1000 * tick,
								// framesEncoded grows each tick — real video
								framesEncoded: 10 * tick,
								active: true
							},
							{
								type: OUTBOUND_RTP,
								rid: 'h',
								// bytesSent grows (RTX/padding trickle) but framesEncoded is flat
								bytesSent: 200 * tick,
								framesEncoded: 5,
								active: true
							}
						])
					);
				}
			}
		});
		await monitor.emitInitial(); // tick 1: all "grew" from 0 → topActiveRung=2 (h)
		await monitor.emitInitial(); // tick 2: h framesEncoded flat → topActiveRung=1 (m)
		// topActiveRung=1, producibleRungs=3, no BW limitation → tierVote=2/3*10=6.7, loss=0 → 6.7
		expect(publishedVotes().uplinkWebcam).toBe(6.7);
	});

	it('webcam downlink: vote is computed from requestedRung, inboundLossRate, and freezeFraction', async () => {
		const monitor = makeMonitor({
			videoFeeds: [
				{ requestedRung: 2, inboundLossRate: 0, freezeFraction: 0 },
				{ requestedRung: 0, inboundLossRate: 0, freezeFraction: 0 }
			]
		});
		await monitor.emitInitial();
		// feed1: tierVote=10*(1-0)=10; feed2: tierVote=3.3*(1-0)=3.3; avg=6.7
		expect(publishedVotes().downlinkWebcam).toBe(6.7);
	});

	it('screen uplink (sending): fractionLost drives the vote', async () => {
		const monitor = makeMonitor({
			screenSender: {
				getStats: () => Promise.resolve(report([{ type: REMOTE_INBOUND_RTP, fractionLost: 0.075 }]))
			}
		});
		await monitor.emitInitial();
		// lossRate avg = 0.075; score(0.075/0.15) = 5
		expect(publishedVotes().uplinkScreen).toBe(5);
		expect(publishedVotes().downlinkScreen).toBeUndefined();
	});

	it('screen downlink (receiving): packet-loss delta drives the vote', async () => {
		const monitor = makeMonitor({
			hasScreenFeed: true,
			screenReceiverStats: () =>
				Promise.resolve(
					report([
						{
							type: INBOUND_RTP,
							kind: 'video',
							packetsLost: 3,
							packetsReceived: 97,
							totalFreezesDuration: 0,
							qpSum: 0,
							framesDecoded: 0
						}
					])
				)
		});
		await monitor.emitInitial();
		// lossRate=3/100=0.03, freeze=0, qp=undefined -> score(max(0, 0, 0.03/0.15)) = score(0.2) = 8
		expect(publishedVotes().downlinkScreen).toBe(8);
		expect(publishedVotes().uplinkScreen).toBeUndefined();
	});

	it('screen is scored in both directions when sharing and receiving at once', async () => {
		const monitor = makeMonitor({
			screenSender: {
				getStats: () => Promise.resolve(report([{ type: REMOTE_INBOUND_RTP, fractionLost: 0 }]))
			},
			hasScreenFeed: true,
			screenReceiverStats: () =>
				Promise.resolve(
					report([
						{
							type: INBOUND_RTP,
							kind: 'video',
							packetsLost: 3,
							packetsReceived: 97,
							totalFreezesDuration: 0,
							qpSum: 0,
							framesDecoded: 0
						}
					])
				)
		});
		await monitor.emitInitial();
		expect(publishedVotes().uplinkScreen).toBe(10);
		expect(publishedVotes().downlinkScreen).toBe(8);
	});

	it('screen downlink: a totalFreezesDuration delta saturates the freeze fraction vote', async () => {
		const monitor = makeMonitor({
			hasScreenFeed: true,
			screenReceiverStats: () =>
				Promise.resolve(
					report([
						{
							type: INBOUND_RTP,
							kind: 'video',
							packetsLost: 0,
							packetsReceived: 100,
							// 1 second frozen — large enough to saturate freezeFraction regardless of windowSec
							totalFreezesDuration: 1,
							qpSum: 0,
							framesDecoded: 0
						}
					])
				)
		});
		await monitor.emitInitial();
		// dFreeze/windowSec >= FREEZE_UNUSABLE (0.20) -> clamped to 1 -> vote 0
		expect(publishedVotes().downlinkScreen).toBe(0);
	});

	it('audio: 5 s window — baseline stays at zero across two ticks within the window', async () => {
		let tick = 0;
		const monitor = makeMonitor({
			otherParticipant: true,
			audioStats: () => {
				tick += 1;
				// cumulative counters grow across ticks
				const concealedSamples = tick === 1 ? 1000 : 2000;
				const totalSamplesReceived = tick === 1 ? 10000 : 20000;
				return Promise.resolve(
					report([
						{
							type: INBOUND_RTP,
							kind: 'audio',
							concealedSamples,
							totalSamplesReceived,
							jitterBufferDelay: 0,
							jitterBufferEmittedCount: 0
						}
					])
				);
			}
		});
		await monitor.emitInitial();
		// tick 1: delta from zero baseline -> 1000/10000=0.1 -> score(0.5)=5
		expect(publishedVotes().downlinkAudio).toBe(5);
		await monitor.emitInitial();
		// tick 2: baseline still zero (both within 5 s window) -> 2000/20000=0.1 -> score 5
		expect(publishedVotes().downlinkAudio).toBe(5);
	});
});
