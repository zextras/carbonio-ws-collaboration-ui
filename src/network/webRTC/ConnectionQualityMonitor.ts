/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import {
	combineVote,
	ConnectionQuality,
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
import { DISPLAY_WINDOW, VoteWindow } from './voteWindow';
import useStore from '../../store/Store';
import {
	IBidirectionalConnectionAudioInOut,
	IScreenOutConnection,
	IVideoOutConnection,
	IVideoScreenInConnection
} from '../../types/network/webRTC/webRTC';
import { rtcTierDebug } from '../../utils/debug';
import { wsClient } from '../websocket/WebSocketClient';

const OUTBOUND_RTP = 'outbound-rtp';

function maxDefined(values: Array<number | undefined>): number | undefined {
	let out: number | undefined;
	values.forEach((v) => {
		if (v !== undefined) out = out === undefined ? v : Math.max(out, v);
	});
	return out;
}

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

	// Receiving PC — ticked each 2 s to drive the per-feed freeze + sender-badge controller.
	private readonly videoIn: IVideoScreenInConnection;

	private intervalId: ReturnType<typeof setInterval> | null = null;

	committed: ConnectionQuality | null = null;

	changedAt = 0;

	// RAW vote buffer (bars 0..5, one per 2 s tick, seeded optimistic). Only the display median reads from
	// it. Lost ticks push bars=0 with NO reset (see vote()) so recovery is not over-optimistic.
	private voteWindow = new VoteWindow();

	private videoOutPrevCum: VideoOutCumulative | null = null;

	private lastVideoSender: RTCRtpSender | null = null;

	private lastTopActiveRung = -2;

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
		// The SINGLE 2 s loop: computes the badge vote (uplink+RTT), applies the display level to the
		// store, then ticks the per-feed freeze+badge controller (evaluateQualityTick).
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
		// +1 keeps changedAt strictly increasing so the store monotonicity guard accepts same-ms calls.
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
		const { raw, level } = await this.computeQuality();
		useStore.getState().setConnectionScoreDetail(raw);
		if (this.committed !== level) {
			this.committed = level;
			// +1 keeps changedAt strictly increasing so the store monotonicity guard accepts same-ms calls.
			this.changedAt = Math.max(Date.now(), this.changedAt + 1);
			// Broadcast only on a vote-level change — the event carries score only (no maxTier).
			wsClient.sendConnectionStatusUpdate(this.meetingId, this.committed, this.changedAt);
		}
		this.applyLocalQuality(this.committed ?? level);
		await this.videoIn.evaluateQualityTick().catch(() => {});
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

	// Raw per-tick RTT / jitter / uplink loss on OUR OWN legs to Janus (the badge). Pipeline B
	// (per-feed freeze + sender-badge controller) lives in VideoScreenInConnection; the monitor
	// only ticks it via evaluateQualityTick().
	private async computeQuality(): Promise<{ raw: LinkSample; level: ConnectionQuality }> {
		const webcamActive = this.videoOut.rtpSender != null;
		const screenActive = this.screenOut.rtpSender != null;

		// LOST reflects only the OUTBOUND legs (what others receive from us: audio + webcam/screen when
		// active); inbound is excluded on purpose (our reception trouble is surfaced per-feed, not broadcast).
		// Soft 'disconnected' counts as down; LOST clears only when every active outbound pair is back up.
		const outboundDown = [
			this.audioConn.peerConn?.connectionState,
			webcamActive ? this.videoOut.peerConn?.connectionState : undefined,
			screenActive ? this.screenOut.peerConn?.connectionState : undefined
		].some((s) => s != null && ['failed', 'disconnected', 'closed'].includes(s));
		const iceConnected = !outboundDown;

		const [audioStats, videoUpStats, screenUpStats] = await Promise.all([
			this.safeStats(this.audioConn.peerConn),
			webcamActive ? this.safeStats(this.videoOut.peerConn) : Promise.resolve(null),
			screenActive ? this.safeStats(this.screenOut.peerConn) : Promise.resolve(null)
		]);

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

		const raw: LinkSample = {};
		if (rttMs !== undefined) raw.rttMs = rttMs;
		if (jitterMs !== undefined) raw.jitterMs = jitterMs;
		if (lossUp !== undefined) raw.lossUp = lossUp;

		return { raw, level: this.vote(raw, iceConnected) };
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

	// Derives topActiveRung (highest rid still encoding) purely to log GCC tier changes; never feeds the vote.
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
			// Our own uplink (no remote user); GCC drives the encoder's top active layer.
			rtcTierDebug('uplink', this.lastTopActiveRung, topActiveRung, 'self', 'congestion-control');
		}
		this.lastTopActiveRung = topActiveRung;
	}
}
