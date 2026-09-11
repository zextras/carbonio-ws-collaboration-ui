/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import {
	combineVote,
	ConnectionQuality,
	downlinkVideoLossScore,
	jitterScore,
	LinkSample,
	rttScore,
	scoreToBars,
	scoreToLevel,
	uplinkLossScore
} from './connectionQualityScore';
import {
	readCandidatePairRttMs,
	readMaxFractionLost,
	readMaxJitterMs,
	sendingSsrcs
} from './networkSignals';
import {
	MIN_EXPECTED_PACKETS,
	poolInboundLoss,
	SrEscapeStream,
	srEscapeStreams,
	srEscapeLoss
} from './srEscape';
import { DISPLAY_WINDOW, VoteWindow } from './voteWindow';
import useStore from '../../store/Store';
import {
	IBidirectionalConnectionAudioInOut,
	IScreenOutConnection,
	IVideoOutConnection,
	IVideoScreenInConnection
} from '../../types/network/webRTC/webRTC';
import { rtcDebug } from '../../utils/debug';
import { wsClient } from '../websocket/WebSocketClient';

const OUTBOUND_RTP = 'outbound-rtp';

// Uplink simulcast tier name from topActiveRung (highest rid still encoding): 0=low, 1=medium, 2=high.
const uplinkTierName = (r: number): string => ['low', 'medium', 'high'][r] ?? 'none';

function maxDefined(values: Array<number | undefined>): number | undefined {
	let out: number | undefined;
	values.forEach((v) => {
		if (v !== undefined) out = out === undefined ? v : Math.max(out, v);
	});
	return out;
}

// After an SSRC discontinuity the received counter lags the forwarded one for ~1 keyframe (VP8 ramp)
// so srEscape would read a spurious ~100% loss spike; mask 2 ticks.
const VIDEO_LOSS_MASK_TICKS = 2;

// Cumulative framesEncoded for the webcam sender (per simulcast rid) — kept only to derive topActiveRung
// for the uplink debug logs; NOT part of the vote and NOT broadcast (maxTier is gone).
type VideoOutCumulative = {
	framesEncoded: Record<string, number>;
};

export default class ConnectionQualityMonitor {
	private readonly meetingId: string;

	// My own quality is computed locally and is authoritative for my own tile, so it is written straight
	// to the store immediately (no round-trip). The WS broadcast still carries it to other clients.
	private readonly myUserId: string | undefined;

	private readonly audioConn: IBidirectionalConnectionAudioInOut;

	private readonly videoOut: IVideoOutConnection;

	private readonly screenOut: IScreenOutConnection;

	// Receiving PC — read only for the SR-escape DOWNLINK video loss (Janus->me), never for the badge.
	private readonly videoIn: IVideoScreenInConnection;

	private intervalId: ReturnType<typeof setInterval> | null = null;

	committed: ConnectionQuality | null = null;

	changedAt = 0;

	// RAW vote buffer (bars 0..5, one per 2 s tick, seeded optimistic). Only the display median reads from
	// it. Lost ticks push bars=0 with NO reset (see vote()) so recovery is not over-optimistic.
	private voteWindow = new VoteWindow();

	// Previous VIDEO SR-escape counters (cumulative) per SSRC — keyed by (remoteId:inboundId) pair.
	// Per-SSRC isolation avoids baseline-mismatch spikes at SSRC discontinuities.
	private prevVideoDownSsrc: Map<string, { sent: number; recv: number }> = new Map();

	// Countdown of ticks masking the video downlink-loss reading after an SSRC discontinuity.
	private videoLossMaskTicks = 0;

	// Previous-tick framesEncoded for the webcam tier debug log.
	private videoOutPrevCum: VideoOutCumulative | null = null;

	private lastVideoSender: RTCRtpSender | null = null;

	private lastTopActiveRung = -2;

	// What inbound-rtp.packetsLost reads for the forwarded video — the consistency reference for
	// lossDownVideoOwn (SR-escape trusted only when <= this), which feeds the video controller.
	private diagVideoPktLoss: number | undefined;

	private prevVideoInPktPool: { lost: number; recv: number } | null = null;

	constructor(
		meetingId: string,
		audioConn: IBidirectionalConnectionAudioInOut,
		videoOut: IVideoOutConnection,
		screenOut: IScreenOutConnection,
		videoIn: IVideoScreenInConnection
	) {
		this.meetingId = meetingId;
		this.myUserId = useStore.getState().session?.id;
		this.audioConn = audioConn;
		this.videoOut = videoOut;
		this.screenOut = screenOut;
		this.videoIn = videoIn;
		// The SINGLE 2 s loop: computes the badge vote (uplink+RTT), applies the display level to the store,
		// then hands the RAW downlink-loss score to the video controller (evaluateQualityTick).
		this.intervalId = setInterval(() => {
			this.evaluate().catch(() => {});
		}, 2000);
	}

	stop(): void {
		if (this.intervalId != null) {
			clearInterval(this.intervalId);
			this.intervalId = null;
		}
	}

	// Re-assert my own quality straight into the store. Idempotent thanks to the setter's changedAt guard.
	private applyLocalQuality(level: ConnectionQuality): void {
		if (this.myUserId == null) return;
		useStore
			.getState()
			.setParticipantConnectionQuality(this.meetingId, this.myUserId, level, this.changedAt);
	}

	async emitInitial(): Promise<void> {
		const { raw, level } = await this.computeQuality();
		this.committed = level;
		this.changedAt = Math.max(Date.now(), this.changedAt + 1);
		useStore.getState().setConnectionScoreDetail(raw);
		wsClient.sendConnectionStatusUpdate(this.meetingId, level, this.changedAt);
		this.applyLocalQuality(level);
	}

	async resyncTo(userId: string): Promise<void> {
		if (this.committed == null) {
			await this.emitInitial();
		}
		if (this.committed != null) {
			wsClient.sendConnectionStatusUpdate(this.meetingId, this.committed, this.changedAt, userId);
		}
	}

	rebroadcast(): void {
		if (this.committed != null) {
			wsClient.sendConnectionStatusUpdate(this.meetingId, this.committed, this.changedAt);
		}
	}

	private async evaluate(): Promise<void> {
		const { raw, level, dlScore } = await this.computeQuality();
		useStore.getState().setConnectionScoreDetail(raw);
		if (this.committed !== level) {
			this.committed = level;
			this.changedAt = Math.max(Date.now(), this.changedAt + 1);
			// Broadcast only on a vote-level change — the event carries score only (no maxTier).
			wsClient.sendConnectionStatusUpdate(this.meetingId, this.committed, this.changedAt);
		}
		this.applyLocalQuality(this.committed ?? level);
		await this.videoIn.evaluateQualityTick(dlScore).catch(() => {});
	}

	// getStats, swallowing the browser's refusal to report on a closing PC.
	private async safeStats(
		source: { getStats: () => Promise<RTCStatsReport> } | null | undefined
	): Promise<RTCStatsReport | null> {
		if (source == null) return null;
		try {
			return await source.getStats();
		} catch {
			return null;
		}
	}

	// Raw per-tick RTT / jitter / uplink loss on OUR OWN legs to Janus (the badge), plus the consistency-
	// gated downlink VIDEO loss score for the controller.
	private async computeQuality(): Promise<{
		raw: LinkSample;
		level: ConnectionQuality;
		dlScore: number;
	}> {
		const audioState = this.audioConn.peerConn?.connectionState;
		const iceConnected = !audioState || !['failed', 'disconnected', 'closed'].includes(audioState);

		const webcamActive = this.videoOut.rtpSender != null;
		const screenActive = this.screenOut.rtpSender != null;

		const [audioStats, videoUpStats, screenUpStats, videoInStats] = await Promise.all([
			this.safeStats(this.audioConn.peerConn),
			webcamActive ? this.safeStats(this.videoOut.peerConn) : Promise.resolve(null),
			screenActive ? this.safeStats(this.screenOut.peerConn) : Promise.resolve(null),
			this.safeStats(this.videoIn.peerConn)
		]);

		// Webcam uplink tracking is kept ONLY for the debug log now (maxTier is gone).
		if (webcamActive && videoUpStats != null) {
			this.trackWebcamUplink(videoUpStats);
		} else {
			this.videoOutPrevCum = null;
			this.lastVideoSender = null;
		}

		// RTT: candidate-pair round-trip ONLY (worst across audio/webcam/screen PCs) — a true two-way STUN
		// measurement of our own me<->Janus leg, present on every PC regardless of which streams are on.
		const rttMs = maxDefined([
			readCandidatePairRttMs(audioStats),
			readCandidatePairRttMs(videoUpStats),
			readCandidatePairRttMs(screenUpStats)
		]);

		// Active-layer filter: only outbound-rtp ssrcs whose encoder is producing frames this tick feed the
		// uplink readings; a parked simulcast layer (fps 0) holds stale jitter/loss and is excluded.
		const audioActiveSsrcs = sendingSsrcs(audioStats);
		const videoActiveSsrcs = webcamActive ? sendingSsrcs(videoUpStats) : undefined;
		const screenActiveSsrcs = screenActive ? sendingSsrcs(screenUpStats) : undefined;

		// Uplink loss: worst remote-inbound fractionLost, ACTIVE layers only.
		const lossUp = maxDefined([
			readMaxFractionLost(audioStats, audioActiveSsrcs),
			readMaxFractionLost(videoUpStats, videoActiveSsrcs),
			readMaxFractionLost(screenUpStats, screenActiveSsrcs)
		]);

		// Uplink jitter (CLEAN, our send leg only): worst remote-inbound jitter, ACTIVE layers only.
		const jitterMs = maxDefined([
			readMaxJitterMs(audioStats, audioActiveSsrcs),
			readMaxJitterMs(videoUpStats, videoActiveSsrcs),
			readMaxJitterMs(screenUpStats, screenActiveSsrcs)
		]);

		// Downlink VIDEO loss (forwarded feeds), via the Janus RTCP-SR escape (immune to the sender's
		// uplink). Delta computed per-SSRC so a discontinuity seeds a fresh baseline (no ~100% spike).
		const streams = videoInStats != null ? srEscapeStreams(videoInStats) : [];
		const lossDownVideo = this.videoDownlinkLossTick(streams);

		// Consistency reference: what inbound-rtp.packetsLost reads for the forwarded video (total loss).
		const vInPool = poolInboundLoss(videoInStats);
		this.diagVideoPktLoss = this.videoInboundPktLossTickDiag(vInPool.lost, vInPool.recv);

		// "Our fault" video downlink loss: trust the SR-escape only when it does not exceed TOTAL loss
		// (packetsLost = our loss + sender loss >= 0). SR-escape > packetsLost => corrupted counters => drop.
		const lossDownVideoOwn =
			lossDownVideo !== undefined &&
			this.diagVideoPktLoss !== undefined &&
			lossDownVideo <= this.diagVideoPktLoss
				? lossDownVideo
				: undefined;

		const raw: LinkSample = {};
		if (rttMs !== undefined) raw.rttMs = rttMs;
		if (jitterMs !== undefined) raw.jitterMs = jitterMs;
		if (lossUp !== undefined) raw.lossUp = lossUp;
		if (lossDownVideo !== undefined) raw.lossDownVideo = lossDownVideo;
		if (lossDownVideoOwn !== undefined) raw.lossDownVideoOwn = lossDownVideoOwn;

		// The video controller reads the RAW downlink-loss score every tick (undefined loss => 10 = off).
		const dlScore = downlinkVideoLossScore(lossDownVideoOwn);

		return { raw, level: this.vote(raw, iceConnected), dlScore };
	}

	// Compute the RAW badge vote for THIS tick from the three own-leg signals (RTT, uplink jitter, uplink
	// loss), worst-aware; push it into the VoteWindow; return the committed display level (median).
	//
	// ICE-down handling: every lost tick pushes bars=0 and the window is NOT reset — the pre-loss votes
	// are kept so recovery reflects the real (usually degraded) state instead of an optimistic seed.
	private vote(raw: LinkSample, iceConnected: boolean): ConnectionQuality {
		if (!iceConnected) {
			this.voteWindow.push(0);
			return 'lost';
		}

		const rttS = rttScore(raw.rttMs);
		const jitterS = jitterScore(raw.jitterMs);
		const lossS = uplinkLossScore(raw.lossUp);
		const rawBars = scoreToBars(combineVote(rttS, jitterS, lossS));
		this.voteWindow.push(rawBars);

		return scoreToLevel(this.voteWindow.medianLast(DISPLAY_WINDOW) * 2);
	}

	// VIDEO per-tick downlink loss from the forwarded-feed SR-escape. Per-SSRC deltas are summed so a
	// discontinuity never compares mismatched baselines. Stale-SR guard: if dSent==0 the baseline is HELD.
	// MIN_EXPECTED_PACKETS gate suppresses noisy few-packet windows; undefined = not measured this tick.
	private videoDownlinkLossTick(streams: SrEscapeStream[]): number | undefined {
		const presentKeys = new Set(streams.map((s) => s.key));
		[...this.prevVideoDownSsrc.keys()].forEach((k) => {
			if (!presentKeys.has(k)) this.prevVideoDownSsrc.delete(k);
		});

		let dSent = 0;
		let dRecv = 0;
		let discontinuity = false;
		streams.forEach(({ key, sent, recv }) => {
			const prev = this.prevVideoDownSsrc.get(key);
			if (prev === undefined) {
				this.prevVideoDownSsrc.set(key, { sent, recv });
				discontinuity = true;
				return;
			}
			if (sent < prev.sent || recv < prev.recv) {
				this.prevVideoDownSsrc.set(key, { sent, recv });
				discontinuity = true;
				return;
			}
			const ds = sent - prev.sent;
			if (ds === 0) {
				return; // stale SR: hold baseline so the next SR advance yields the correct span
			}
			dSent += ds;
			dRecv += recv - prev.recv;
			this.prevVideoDownSsrc.set(key, { sent, recv });
		});

		// Post-switch mask: after any discontinuity the received counter legitimately lags for ~1 keyframe
		// (VP8 lazy ramp) -> srEscape would read a spurious ~100% spike. Suppress the reading for a couple
		// of ticks; baselines keep updating so the post-mask delta is clean.
		if (discontinuity) this.videoLossMaskTicks = VIDEO_LOSS_MASK_TICKS;
		if (this.videoLossMaskTicks > 0) {
			this.videoLossMaskTicks -= 1;
			return undefined;
		}

		return srEscapeLoss(dSent, Math.max(0, dRecv));
	}

	// Per-tick inbound-rtp.packetsLost fraction for the forwarded video. Load-bearing: the consistency
	// reference for lossDownVideoOwn (SR-escape trusted only when <= this). Re-anchors on a counter reset.
	private videoInboundPktLossTickDiag(lost: number, recv: number): number | undefined {
		const prev = this.prevVideoInPktPool;
		if (prev == null || recv < prev.recv) {
			this.prevVideoInPktPool = { lost, recv };
			return undefined;
		}
		const dRecv = recv - prev.recv;
		const dLost = Math.max(0, lost - prev.lost);
		this.prevVideoInPktPool = { lost, recv };
		const expected = dRecv + dLost;
		if (expected < MIN_EXPECTED_PACKETS) return undefined;
		return Math.max(0, Math.min(1, dLost / expected));
	}

	// Uplink webcam tracking: derives topActiveRung (highest rid still encoding frames) purely to LOG when
	// GCC changes the uplink tier (it owns the uplink under bandwidth pressure). Never feeds the vote and
	// is no longer broadcast.
	private trackWebcamUplink(stats: RTCStatsReport): void {
		if (this.videoOut.rtpSender !== this.lastVideoSender) {
			this.videoOutPrevCum = null;
			this.lastTopActiveRung = -2;
			this.lastVideoSender = this.videoOut.rtpSender;
		}

		const framesEncoded: Record<string, number> = {};
		const ridToIndex: Record<string, number> = { l: 0, m: 1, h: 2 };
		stats.forEach((r: RTCStats & { rid?: string; framesEncoded?: number }) => {
			if (r.type !== OUTBOUND_RTP) return;
			const rid = r.rid ?? '';
			if (r.framesEncoded != null) framesEncoded[rid] = r.framesEncoded;
		});

		const prevCum = this.videoOutPrevCum;
		this.videoOutPrevCum = { framesEncoded };
		let topActiveRung = -1;
		Object.entries(framesEncoded).forEach(([rid, currentFrames]) => {
			const prevFrames = prevCum?.framesEncoded[rid] ?? 0;
			if (currentFrames > prevFrames) {
				const idx = ridToIndex[rid] ?? -1;
				if (idx > topActiveRung) topActiveRung = idx;
			}
		});
		if (
			prevCum != null &&
			this.lastTopActiveRung !== -2 &&
			topActiveRung !== this.lastTopActiveRung
		) {
			rtcDebug(
				`[UPLINK CAMERA CHANGED TIER] ${uplinkTierName(this.lastTopActiveRung)} -> ${uplinkTierName(topActiveRung)}`
			);
		}
		this.lastTopActiveRung = topActiveRung;
	}
}
