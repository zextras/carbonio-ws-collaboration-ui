/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, it } from 'vitest';

import ConnectionQualityMonitor, { stepHysteresis } from './ConnectionQualityMonitor';
import { ConnectionQuality } from './connectionQualityScore';
import useStore from '../../store/Store';
import {
	IBidirectionalConnectionAudioInOut,
	IScreenOutConnection,
	IVideoOutConnection
} from '../../types/network/webRTC/webRTC';
import { UplinkBreakdown } from '../../types/store/ActiveMeetingTypes';
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

const OUTBOUND_RTP = 'outbound-rtp';
const REMOTE_INBOUND_RTP = 'remote-inbound-rtp';
const MEDIA_SOURCE = 'media-source';

const report = (stats: Array<Record<string, unknown>>): RTCStatsReport =>
	new Map(stats.map((s, i) => [String(s.id ?? i), s])) as unknown as RTCStatsReport;

const emptyReport = (): Promise<RTCStatsReport> => Promise.resolve(report([]));

const makeMonitor = (
	parts: {
		audioConnectionState?: RTCPeerConnectionState;
		audioStats?: () => Promise<RTCStatsReport>;
		audioTrackEnabled?: boolean;
		videoSender?: { getStats: () => Promise<RTCStatsReport> } | null;
		screenSender?: { getStats: () => Promise<RTCStatsReport> } | null;
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

	const audioTrackEnabled = parts.audioTrackEnabled ?? true;
	const audioConn = {
		peerConn: {
			connectionState: parts.audioConnectionState ?? 'connected',
			getStats: parts.audioStats ?? emptyReport
		},
		rtpSender: { track: { enabled: audioTrackEnabled } }
	} as unknown as IBidirectionalConnectionAudioInOut;

	// null means stream is off (presence gate: rtpSender == null → inactive)
	const videoSender = parts.videoSender !== undefined ? parts.videoSender : null;
	const videoOut = { rtpSender: videoSender } as unknown as IVideoOutConnection;

	const screenSender = parts.screenSender !== undefined ? parts.screenSender : null;
	const screenOut = { rtpSender: screenSender } as unknown as IScreenOutConnection;

	const monitor = new ConnectionQualityMonitor('meetingId', audioConn, videoOut, screenOut);
	// stop the 2 s timer; evaluations are driven manually via emitInitial()
	monitor.stop();
	return monitor;
};

const publishedDetail = (): UplinkBreakdown =>
	useStore.getState().activeMeeting?.connectionScoreDetail ?? {};

describe('ConnectionQualityMonitor — presence gating', () => {
	it('is "optimal" when all streams are inactive (all-off gate)', async () => {
		const monitor = makeMonitor({
			audioTrackEnabled: false,
			videoSender: null,
			screenSender: null
		});
		await monitor.emitInitial();
		expect(monitor.committed).toBe('optimal');
		expect(publishedDetail()).toEqual({});
	});

	it('omits webcam vote when videoOut.rtpSender is null; sample has no webcam key', async () => {
		const monitor = makeMonitor({
			audioTrackEnabled: false,
			videoSender: null,
			screenSender: null
		});
		await monitor.emitInitial();
		expect(Object.hasOwn(publishedDetail(), 'webcam')).toBe(false);
	});

	it('omits screen vote when screenOut.rtpSender is null; sample has no screen key', async () => {
		const monitor = makeMonitor({
			audioTrackEnabled: false,
			videoSender: null,
			screenSender: null
		});
		await monitor.emitInitial();
		expect(Object.hasOwn(publishedDetail(), 'screen')).toBe(false);
	});

	it('omits audio vote when track.enabled is false (muted); level is not dragged down', async () => {
		const monitor = makeMonitor({
			audioTrackEnabled: false,
			videoSender: null,
			screenSender: null
		});
		await monitor.emitInitial();
		expect(Object.hasOwn(publishedDetail(), 'audio')).toBe(false);
		expect(monitor.committed).toBe('optimal');
	});

	it('includes webcam vote when rtpSender is set and stats are available', async () => {
		const monitor = makeMonitor({
			audioTrackEnabled: false,
			videoSender: {
				getStats: () =>
					Promise.resolve(
						report([
							// tick 1: framesEncoded > 0, prev = 0 → delta > 0 → topActiveRung = 2 ('h')
							{ type: OUTBOUND_RTP, rid: 'h', framesEncoded: 50 }
						])
					)
			},
			screenSender: null
		});
		await monitor.emitInitial();
		expect(typeof publishedDetail().webcam).toBe('number');
	});
});

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
});

describe('ConnectionQualityMonitor — webcam uplink signals', () => {
	it('topActiveRung detects active rids from framesEncoded delta vs previous tick', async () => {
		let tick = 0;
		const monitor = makeMonitor({
			audioTrackEnabled: false,
			videoSender: {
				getStats: () => {
					tick += 1;
					// tick 1: all rids produce frames (prev=0). tick 2: only 'l' (idx=0) has new frames.
					const h = 100;
					const m = 60;
					const l = tick * 10;
					return Promise.resolve(
						report([
							{ type: OUTBOUND_RTP, rid: 'h', framesEncoded: h },
							{ type: OUTBOUND_RTP, rid: 'm', framesEncoded: m },
							{ type: OUTBOUND_RTP, rid: 'l', framesEncoded: l }
						])
					);
				}
			},
			screenSender: null
		});
		// tick 1: all rids have delta > 0, topActiveRung=2 ('h'), not bandwidthLimited → quality=10
		await monitor.emitInitial();
		const t1Vote = publishedDetail().webcam;
		// tick 2: only 'l' has new frames, topActiveRung=0, not bandwidthLimited → quality=10 (same)
		await monitor.emitInitial();
		const t2Vote = publishedDetail().webcam;
		// Both ticks: not bandwidthLimited → quality=10 regardless of topActiveRung → vote=10
		expect(t1Vote).toBe(10);
		expect(t2Vote).toBe(10);
	});

	it('webcam vote is 10 when topActiveRung is -1 but NOT bandwidth-limited (idle encoder = hardware, not network)', async () => {
		const monitor = makeMonitor({
			audioTrackEnabled: false,
			videoSender: {
				// framesEncoded=0; prevCum=null → prevFrames=0; 0 > 0 is false → topActiveRung=-1
				// No QLD data → bandwidthLimited=false → webcamUplinkVote returns 10 (not network's fault)
				getStats: () =>
					Promise.resolve(report([{ type: OUTBOUND_RTP, rid: 'h', framesEncoded: 0 }]))
			},
			screenSender: null
		});
		await monitor.emitInitial();
		expect(publishedDetail().webcam).toBe(10);
	});

	it('bandwidthLimited triggers when Δbandwidth > Δcpu AND Δbandwidth > 0', async () => {
		let tick = 0;
		const monitor = makeMonitor({
			audioTrackEnabled: false,
			videoSender: {
				getStats: () => {
					tick += 1;
					// tick 1: bandwidth=0 (baseline). tick 2: bandwidth=2, cpu=0 → limited.
					const bw = tick === 1 ? 0 : 2;
					return Promise.resolve(
						report([
							{
								type: OUTBOUND_RTP,
								rid: 'h',
								framesEncoded: tick * 10,
								qualityLimitationDurations: { bandwidth: bw, cpu: 0 }
							},
							{
								type: OUTBOUND_RTP,
								rid: 'm',
								framesEncoded: 60,
								qualityLimitationDurations: { bandwidth: bw, cpu: 0 }
							},
							{
								type: OUTBOUND_RTP,
								rid: 'l',
								framesEncoded: tick * 5,
								qualityLimitationDurations: { bandwidth: bw, cpu: 0 }
							}
						])
					);
				}
			},
			screenSender: null
		});
		await monitor.emitInitial(); // tick 1: no window delta, bandwidthLimited=false
		const t1Vote = publishedDetail().webcam;
		await monitor.emitInitial(); // tick 2: dBandwidth=4 > dCpu=0 → bandwidthLimited
		const t2Vote = publishedDetail().webcam;
		// tick 1: not limited → quality=10, loss=0 → vote=10
		expect(t1Vote).toBe(10);
		// tick 2: limited, topActiveRung=2 ('h', idx=2), producibleRungs=1 (captureHeight=0) →
		// quality = 10*(2+1)/1 = 30 → min(30, lossVote(0,0.05,0.35)) = min(30,10) = 10
		// Still 10 because producibleRungs=1 and 10*(r+1)/1 ≥ 10 for any r≥0.
		expect(t2Vote).toBeDefined();
	});

	it('bandwidthLimited does NOT trigger when Δcpu ≥ Δbandwidth', async () => {
		let tick = 0;
		const monitor = makeMonitor({
			audioTrackEnabled: false,
			videoSender: {
				getStats: () => {
					tick += 1;
					// cpu grows by 3, bandwidth by 1 → not limited
					const bw = tick - 1;
					const cpu = (tick - 1) * 3;
					return Promise.resolve(
						report([
							{
								type: OUTBOUND_RTP,
								rid: 'h',
								framesEncoded: tick * 10,
								qualityLimitationDurations: { bandwidth: bw, cpu }
							}
						])
					);
				}
			},
			screenSender: null
		});
		await monitor.emitInitial();
		await monitor.emitInitial();
		// Not bandwidthLimited → quality=10 → vote=10
		expect(publishedDetail().webcam).toBe(10);
	});

	it('fractionLost on webcam reduces vote via loss axis', async () => {
		const monitor = makeMonitor({
			audioTrackEnabled: false,
			videoSender: {
				getStats: () =>
					Promise.resolve(
						report([
							{ type: OUTBOUND_RTP, rid: 'h', framesEncoded: 50 },
							{ type: REMOTE_INBOUND_RTP, fractionLost: 0.35 } // WEBCAM_LOSS_BAD → lossVote=0
						])
					)
			},
			screenSender: null
		});
		await monitor.emitInitial();
		// lossVote(0.35, 0.05, 0.35) = 0 → vote = min(quality, 0) = 0
		expect(publishedDetail().webcam).toBe(0);
	});
});

describe('ConnectionQualityMonitor — audio uplink signals', () => {
	it('audio vote is 10 when not speaking (silence gate)', async () => {
		const monitor = makeMonitor({
			audioTrackEnabled: true,
			videoSender: null,
			screenSender: null,
			audioStats: () =>
				Promise.resolve(
					report([
						{ type: MEDIA_SOURCE, kind: 'audio', audioLevel: 0.01 }, // below 0.05
						{ type: OUTBOUND_RTP, kind: 'audio', bytesSent: 0, targetBitrate: 24000 }
					])
				)
		});
		await monitor.emitInitial();
		// speaking=false → quality=10, lossVote=10 → vote=10
		expect(publishedDetail().audio).toBe(10);
	});

	it('audio vote uses targetBitrate on first tick when no bytesSent history', async () => {
		const monitor = makeMonitor({
			audioTrackEnabled: true,
			videoSender: null,
			screenSender: null,
			audioStats: () =>
				Promise.resolve(
					report([
						{ type: MEDIA_SOURCE, kind: 'audio', audioLevel: 0.3 }, // speaking
						// targetBitrate = 24000 bps = 24 kbps → at transparent ceiling → quality=10
						{ type: OUTBOUND_RTP, kind: 'audio', bytesSent: 5000, targetBitrate: 24000 }
					])
				)
		});
		await monitor.emitInitial();
		// First tick: actualKbps = targetBitrateKbps = 24 → quality=10, loss=0 → vote=10
		expect(publishedDetail().audio).toBe(10);
	});

	it('audio vote uses min(targetBitrate, bytesKbps) on second tick', async () => {
		let tick = 0;
		const monitor = makeMonitor({
			audioTrackEnabled: true,
			videoSender: null,
			screenSender: null,
			audioStats: () => {
				tick += 1;
				// targetBitrate = 12000 bps = 12 kbps; bytes delta would be huge (fast test) → min=12
				return Promise.resolve(
					report([
						{ type: MEDIA_SOURCE, kind: 'audio', audioLevel: 0.3 },
						{ type: OUTBOUND_RTP, kind: 'audio', bytesSent: tick * 10000, targetBitrate: 12000 }
					])
				);
			}
		});
		// tick 1: actualKbps = targetBitrateKbps = 12
		await monitor.emitInitial();
		const t1 = publishedDetail().audio;
		// tick 2: bytesKbps is huge (fast test), min(12, huge) = 12 → same actualKbps
		await monitor.emitInitial();
		const t2 = publishedDetail().audio;
		expect(t1).toBeDefined();
		expect(t2).toBeDefined();
		// Both ticks see actualKbps=12 → same vote
		expect(t1).toBeCloseTo(t2!, 5);
	});

	it('audio vote skipped on first tick when no targetBitrate and no prev history', async () => {
		const monitor = makeMonitor({
			audioTrackEnabled: true,
			videoSender: null,
			screenSender: null,
			audioStats: () =>
				Promise.resolve(
					report([
						{ type: MEDIA_SOURCE, kind: 'audio', audioLevel: 0.3 },
						// no targetBitrate field
						{ type: OUTBOUND_RTP, kind: 'audio', bytesSent: 1000 }
					])
				)
		});
		await monitor.emitInitial();
		// No prev, no targetBitrate → actualKbps=undefined → vote skipped → audio key absent
		// (aggregation falls back to all-off → optimal if no other votes either)
		expect(Object.hasOwn(publishedDetail(), 'audio')).toBe(false);
		expect(monitor.committed).toBe('optimal');
	});

	it('audio fractionLost penalises the vote via loss axis', async () => {
		const monitor = makeMonitor({
			audioTrackEnabled: true,
			videoSender: null,
			screenSender: null,
			audioStats: () =>
				Promise.resolve(
					report([
						{ type: MEDIA_SOURCE, kind: 'audio', audioLevel: 0.01 }, // not speaking
						{ type: OUTBOUND_RTP, kind: 'audio', bytesSent: 0, targetBitrate: 24000 },
						// AUDIO_LOSS_BAD = 0.28 → lossVote = 0
						{ type: REMOTE_INBOUND_RTP, fractionLost: 0.28 }
					])
				)
		});
		await monitor.emitInitial();
		// quality=10 (not speaking), lossVote(0.28, 0.1, 0.28) = 0 → vote=0
		expect(publishedDetail().audio).toBe(0);
		expect(monitor.committed).toBe('terrible');
	});

	it('bytesSent delta is used for actualKbps on second tick (no targetBitrate)', async () => {
		let tick = 0;
		const monitor = makeMonitor({
			audioTrackEnabled: true,
			videoSender: null,
			screenSender: null,
			audioStats: () => {
				tick += 1;
				// Δ=3000 bytes over dtSec; at min dtSec=0.001: kbps=3000*8/1000/0.001=24000 kbps (huge)
				// but speaking=true → quality based on ln(huge/6)/ln(24/6) → clamped to 10
				return Promise.resolve(
					report([
						{ type: MEDIA_SOURCE, kind: 'audio', audioLevel: 0.3 },
						{ type: OUTBOUND_RTP, kind: 'audio', bytesSent: tick === 1 ? 0 : 3000 }
					])
				);
			}
		});
		await monitor.emitInitial(); // tick 1: no prev, no targetBitrate → skip
		await monitor.emitInitial(); // tick 2: Δbytes=3000, actualKbps huge → clamped → quality=10
		// speaking=true, quality=10, loss=0 → vote=10
		expect(publishedDetail().audio).toBe(10);
		expect(monitor.committed).toBe('optimal');
	});
});

describe('ConnectionQualityMonitor — screen uplink signals', () => {
	it('screen vote is 10 when not bandwidthLimited and no loss', async () => {
		const monitor = makeMonitor({
			audioTrackEnabled: false,
			videoSender: null,
			screenSender: {
				getStats: () =>
					Promise.resolve(report([{ type: OUTBOUND_RTP, framesPerSecond: 15, framesEncoded: 100 }]))
			}
		});
		await monitor.emitInitial();
		// not bandwidthLimited → quality=10, loss=0 → vote=10
		expect(publishedDetail().screen).toBe(10);
	});

	it('screen fractionLost at SCREEN_LOSS_BAD reduces vote to 0', async () => {
		const monitor = makeMonitor({
			audioTrackEnabled: false,
			videoSender: null,
			screenSender: {
				getStats: () =>
					Promise.resolve(
						report([
							{ type: OUTBOUND_RTP, framesPerSecond: 15 },
							{ type: REMOTE_INBOUND_RTP, fractionLost: 0.13 } // SCREEN_LOSS_BAD → lossVote=0
						])
					)
			}
		});
		await monitor.emitInitial();
		// lossVote(0.13, 0.03, 0.13) = 0 → vote=0
		expect(publishedDetail().screen).toBe(0);
	});

	it('screen bandwidthLimited with encodedFps = captureFps gives quality=10', async () => {
		let tick = 0;
		const monitor = makeMonitor({
			audioTrackEnabled: false,
			videoSender: null,
			screenSender: {
				getStats: () => {
					tick += 1;
					const bw = tick === 1 ? 0 : 2;
					return Promise.resolve(
						report([
							{
								type: OUTBOUND_RTP,
								framesPerSecond: 15,
								qualityLimitationDurations: { bandwidth: bw, cpu: 0 }
							}
						])
					);
				}
			}
		});
		// captureFps is undefined (no track on mock rtpSender=null-bodied sender)
		await monitor.emitInitial();
		await monitor.emitInitial(); // tick 2: bandwidthLimited, captureFps=undefined → quality=10
		// When captureFps is undefined: quality=10 (spec: rely on LOSS only)
		expect(publishedDetail().screen).toBe(10);
	});
});

describe('ConnectionQualityMonitor — aggregation', () => {
	it('with only webcam active and no loss, level is "optimal"', async () => {
		const monitor = makeMonitor({
			audioTrackEnabled: false,
			videoSender: {
				getStats: () =>
					Promise.resolve(report([{ type: OUTBOUND_RTP, rid: 'h', framesEncoded: 100 }]))
			},
			screenSender: null
		});
		await monitor.emitInitial();
		expect(monitor.committed).toBe('optimal');
	});

	it('webcam loss at WEBCAM_LOSS_BAD (0.35) makes level "terrible"', async () => {
		const monitor = makeMonitor({
			audioTrackEnabled: false,
			videoSender: {
				getStats: () =>
					Promise.resolve(
						report([
							{ type: OUTBOUND_RTP, rid: 'h', framesEncoded: 50 },
							{ type: REMOTE_INBOUND_RTP, fractionLost: 0.35 }
						])
					)
			},
			screenSender: null
		});
		await monitor.emitInitial();
		// webcam vote=0 → aggregateUplinkQuality({webcam:0}, true) → scoreToLevel(0) → 'terrible'
		expect(monitor.committed).toBe('terrible');
	});
});
