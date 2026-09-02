/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import {
	combineScoreValue,
	ConnectionQuality,
	jitterScore,
	LinkSample,
	LOSS_BAD_VIDEO,
	lossScore,
	rttScore,
	scoreToLevel
} from './connectionQualityScore';
import {
	readCandidatePairRttMs,
	readMaxFractionLost,
	readMaxJitterMs,
	sendingSsrcs
} from './networkSignals';
import { OfficialVoteWindow } from './officialVoteWindow';
import {
	MIN_EXPECTED_PACKETS,
	poolInboundLoss,
	SrEscapeStream,
	srEscapeStreams,
	srEscapeLoss
} from './srEscape';
import { DISPLAY_WINDOW, QualitySignals, VoteWindow } from './voteWindow';
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

// Uplink simulcast tier name from topActiveRung (highest rid still encoding): 0=low, 1=medium, 2=high;
// anything else (no active rung / uninitialized) = 'none'.
const uplinkTierName = (r: number): string => ['low', 'medium', 'high'][r] ?? 'none';

function maxDefined(values: Array<number | undefined>): number | undefined {
	let out: number | undefined;
	values.forEach((v) => {
		if (v !== undefined) out = out === undefined ? v : Math.max(out, v);
	});
	return out;
}

// After an SSRC discontinuity the received counter lags the forwarded one for ~1 keyframe (VP8 ramp)
// so srEscape would read a spurious ~100% loss spike; mask 2 ticks — median-7 backstops the rest.
const VIDEO_LOSS_MASK_TICKS = 2;

// Cumulative framesEncoded for the webcam sender (per simulcast rid) — kept only to derive topActiveRung
// for the uplink debug logs and the maxTier we broadcast; NOT part of the vote.
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

	// Receiving PC — read only for the SR-escape DOWNLINK loss (Janus->me), never for perceived quality.
	private readonly videoIn: IVideoScreenInConnection;

	private intervalId: ReturnType<typeof setInterval> | null = null;

	committed: ConnectionQuality | null = null;

	changedAt = 0;

	// RAW vote buffer (bars 0..5, one per 2 s tick, seeded optimistic). Only the display median-7 reads
	// from this buffer. Lost ticks push bars=0 with NO reset (see vote()) so recovery is not over-optimistic.
	private voteWindow = new VoteWindow();

	// Official-vote history: receives the display bars value each tick, driving the snackbar N-of-M signals.
	// Capacity 13 (>= max window). Snackbar RESTORE/WARN signals live here.
	private officialVoteWindow = new OfficialVoteWindow();

	// Previous VIDEO SR-escape counters (cumulative) per SSRC — keyed by (remoteId:inboundId) pair.
	// Per-SSRC isolation avoids baseline-mismatch spikes at SSRC discontinuities (unsubscribe→resubscribe,
	// AUTO-OFF→ON): a new/restarted SSRC seeds its own baseline and does not contribute on the first tick
	// instead of producing a spurious ~100% for that window.
	private prevVideoDownSsrc: Map<string, { sent: number; recv: number }> = new Map();

	// Countdown of ticks masking the video downlink-loss reading after an SSRC discontinuity
	// (post-switch mask) — see videoDownlinkLossTick.
	private videoLossMaskTicks = 0;

	// Previous AUDIO inbound-loss counters (cumulative) — the AudioBridge mix is Janus-originated, so its
	// own inbound-rtp.packetsLost is a clean receiver-side loss with none of the SR-escape's ~1 Hz skew.
	private prevAudioDownPool: { lost: number; recv: number } | null = null;

	// Previous-tick framesEncoded for the webcam tier logs.
	private videoOutPrevCum: VideoOutCumulative | null = null;

	// Diagnostic: sender change detection for the tier log.
	private lastVideoSender: RTCRtpSender | null = null;

	private lastTopActiveRung = -2;

	// What inbound-rtp.packetsLost reads for the forwarded video. Despite the "diag" name this is
	// load-bearing: the consistency reference for lossDownVideoOwn (SR-escape trusted only when <= this),
	// which feeds the vote.
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
		// The SINGLE 2 s loop: computes the raw vote, pushes it into the vote buffer, derives the
		// committed display level and the snackbar SIGNALS, applies display to the store, then passes the
		// SIGNALS to the downlink controller (evaluateQualityTick). Everything on the same cadence.
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
			.setParticipantConnectionQuality(
				this.meetingId,
				this.myUserId,
				level,
				this.changedAt,
				this.currentMaxTier()
			);
	}

	private currentMaxTier(): number | undefined {
		const t = this.lastTopActiveRung;
		return t >= 0 ? t : undefined;
	}

	async emitInitial(): Promise<void> {
		const { raw, level } = await this.computeQuality();
		this.committed = level;
		this.changedAt = Math.max(Date.now(), this.changedAt + 1);
		useStore.getState().setConnectionScoreDetail(raw);
		wsClient.sendConnectionStatusUpdate(
			this.meetingId,
			level,
			this.changedAt,
			this.currentMaxTier()
		);
		this.applyLocalQuality(level);
	}

	async resyncTo(userId: string): Promise<void> {
		if (this.committed == null) {
			await this.emitInitial();
		}
		if (this.committed != null) {
			wsClient.sendConnectionStatusUpdate(
				this.meetingId,
				this.committed,
				this.changedAt,
				this.currentMaxTier(),
				userId
			);
		}
	}

	rebroadcast(): void {
		if (this.committed != null) {
			wsClient.sendConnectionStatusUpdate(
				this.meetingId,
				this.committed,
				this.changedAt,
				this.currentMaxTier()
			);
		}
	}

	private async evaluate(): Promise<void> {
		const prevTier = this.lastTopActiveRung;
		const { raw, level, signals } = await this.computeQuality();
		useStore.getState().setConnectionScoreDetail(raw);
		const levelChanged = this.committed !== level;
		const tierChanged = this.lastTopActiveRung !== prevTier;
		if (levelChanged) {
			this.committed = level;
			this.changedAt = Math.max(Date.now(), this.changedAt + 1);
		}
		if (levelChanged || tierChanged) {
			// Broadcast on a vote change OR a maxTier change — the downlink snackbar on peers reads maxTier.
			wsClient.sendConnectionStatusUpdate(
				this.meetingId,
				this.committed ?? level,
				this.changedAt,
				this.currentMaxTier()
			);
		}
		this.applyLocalQuality(this.committed ?? level);
		await this.videoIn.evaluateQualityTick(signals).catch(() => {});
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

	// Network-carrying estimate: raw per-tick RTT / jitter / loss on OUR OWN legs to Janus.
	// Scoring is done directly on the raw values (no per-axis windowing); the raw bars value is pushed
	// into a single VoteWindow whose medians drive the displayed level and the downstream signals.
	private async computeQuality(): Promise<{
		raw: LinkSample;
		level: ConnectionQuality;
		signals: QualitySignals;
	}> {
		const audioState = this.audioConn.peerConn?.connectionState;
		const iceConnected = !audioState || !['failed', 'disconnected', 'closed'].includes(audioState);

		// Presence gates — a stream with no sender contributes no uplink report (audio PC is always up,
		// and provides the baseline RTT even while muted, via ICE keepalives).
		const webcamActive = this.videoOut.rtpSender != null;
		const screenActive = this.screenOut.rtpSender != null;

		// One getStats per PeerConnection: each report carries candidate-pair (RTT), remote-inbound
		// (uplink loss/jitter/rtt), outbound-rtp (webcam tier logs) and inbound/remote-outbound (SR-escape).
		const [audioStats, videoUpStats, screenUpStats, videoInStats] = await Promise.all([
			this.safeStats(this.audioConn.peerConn),
			webcamActive ? this.safeStats(this.videoOut.peerConn) : Promise.resolve(null),
			screenActive ? this.safeStats(this.screenOut.peerConn) : Promise.resolve(null),
			this.safeStats(this.videoIn.peerConn)
		]);

		// Webcam uplink tracking is kept ONLY for the debug logs + the maxTier we broadcast, never the vote.
		if (webcamActive && videoUpStats != null) {
			this.trackWebcamUplink(videoUpStats);
		} else {
			this.videoOutPrevCum = null;
			this.lastVideoSender = null;
		}

		// RTT: candidate-pair round-trip ONLY (worst across audio/webcam/screen PCs). The candidate-pair is a
		// true two-way STUN measurement of our own me<->Janus leg and is present on every PC regardless of
		// which streams are on. The per-media remote-inbound.roundTripTime measures the SAME me<->Janus leg
		// but as a single, un-smoothed RTCP RR sample (A-LSR-DLSR) refreshed only ~every 5 s for a muted/DTX
		// audio send-leg — it holds stale spikes (800-1600 ms) that the max() then promotes, without adding
		// any leg the candidate-pair doesn't already cover. So it is dropped from the vote RTT.
		// See feat/dynamic-streams-rtt-loss RTT investigation.
		const rttMs = maxDefined([
			readCandidatePairRttMs(audioStats),
			readCandidatePairRttMs(videoUpStats),
			readCandidatePairRttMs(screenUpStats)
		]);

		// Active-layer filter: only outbound-rtp ssrcs whose encoder is producing frames this tick feed the
		// uplink readings (GCC's live send decision). A parked simulcast layer (fps 0) holds stale
		// remote-inbound jitter/loss and is excluded.
		const audioActiveSsrcs = sendingSsrcs(audioStats);
		const videoActiveSsrcs = webcamActive ? sendingSsrcs(videoUpStats) : undefined;
		const screenActiveSsrcs = screenActive ? sendingSsrcs(screenUpStats) : undefined;

		// Uplink loss: worst remote-inbound fractionLost, ACTIVE layers only (parked layers filtered).
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

		// Downlink loss, measured PER receiving PC with per-stream deltas, kept separate for diagnostics:
		//  - VIDEO (forwarded simulcast feeds): the Janus RTCP-SR escape — forwarded seqnums carry a linear
		//    offset, so a raw packetsLost would leak the publisher's UPLINK loss; the SR-escape (counts, not
		//    seqnums) avoids that. Delta computed per-SSRC so an SSRC discontinuity (unsubscribe→resubscribe
		//    / AUTO-OFF→ON) seeds a fresh baseline and does not produce a spurious ~100% spike.
		//  - AUDIO (AudioBridge mix): Janus ORIGINATES the mix (its own contiguous seqnums), so inbound-rtp
		//    packetsLost is a clean receiver-side loss with NONE of the SR-escape's ~1 Hz-vs-2 s quantization
		//    spikes. Measuring the two independently (not one pooled SR-escape) also stops one stream's loss
		//    from being diluted by the other's volume.
		const streams = videoInStats != null ? srEscapeStreams(videoInStats) : [];
		const lossDownVideo = this.videoDownlinkLossTick(streams);
		const aPool = poolInboundLoss(audioStats);
		const lossDownAudio = this.audioDownlinkLossTick(aPool.lost, aPool.recv);
		// lossDown = max(audio, video) kept for hover display; scoring uses the split values.
		const lossDown = maxDefined([lossDownAudio, lossDownVideo]);

		// What inbound-rtp.packetsLost reads for the forwarded video — the consistency reference for the
		// lossDownVideoOwn invariant check below (SR-escape trusted only when <= this total loss). The
		// SR-escape itself avoids packetsLost because forwarded seqnums carry the publisher's gaps (srEscape.ts).
		const vInPool = poolInboundLoss(videoInStats);
		this.diagVideoPktLoss = this.videoInboundPktLossTickDiag(vInPool.lost, vInPool.recv);

		// "Our fault" video downlink loss: trust the SR-escape (our Janus->me hop loss; the sender's
		// uplink loss is excluded by construction, since Janus can only forward what it received) only
		// when it does not exceed TOTAL loss (packetsLost = our loss + sender loss >= 0). SR-escape >
		// packetsLost implies a negative sender loss => the forwarded/received counters are corrupted
		// (RTX/transition storm) => drop the reading. This lets the vote lower quality on a genuine LOCAL
		// downlink limit while never blaming us for the sender's bad uplink.
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
		if (lossDown !== undefined) raw.lossDown = lossDown;
		if (lossDownAudio !== undefined) raw.lossDownAudio = lossDownAudio;
		if (lossDownVideo !== undefined) raw.lossDownVideo = lossDownVideo;
		if (lossDownVideoOwn !== undefined) raw.lossDownVideoOwn = lossDownVideoOwn;

		return { raw, ...this.vote(raw, iceConnected) };
	}

	// Compute the RAW vote for THIS tick directly from the raw values (NO per-axis windowing), push it into
	// the single VoteWindow, then derive the committed display level (median-7) and the snackbar SIGNALS.
	//
	// ICE-down handling: every lost tick pushes bars=0 and the window is NOT reset — the pre-loss votes
	// are kept, so recovery reflects the real (usually degraded) state the outage happened in instead of
	// an optimistic seed. That stops the vote overshooting to 'optimal' on reconnect (which fired a false
	// green "connection restored" snackbar that flipped back to WARN a few seconds later); the accumulated
	// zeros also weigh recovery by the outage duration. displayVote = 'lost' (hardcoded) during the outage.
	private vote(
		raw: LinkSample,
		iceConnected: boolean
	): { level: ConnectionQuality; signals: QualitySignals } {
		if (!iceConnected) {
			this.voteWindow.push(0);
			this.officialVoteWindow.push(0);
			return {
				level: 'lost',
				signals: { displayBars: 0, warnVote: true, restoreVote: false }
			};
		}

		// Score the RAW values directly — one set of axis scores per tick, no per-axis smoothing.
		// lossS = min of uplink (LOSS_BAD_AUDIO), AUDIO downlink (LOSS_BAD_AUDIO), and the
		// consistency-gated our-fault video downlink (lossDownVideoOwn, LOSS_BAD_VIDEO). Raw lossDownVideo
		// is NOT in the vote — only lossDownVideoOwn, which passes the physical-invariant check
		// (SR-escape <= packetsLost), enters. Audio downlink (Janus re-encoded mix, no sender-uplink
		// contamination) and the gated video term each measure only our own Janus->me hop. undefined
		// inputs return 10 (no evidence of harm), excluded from the min.
		const rttS = rttScore(raw.rttMs);
		const jitterS = jitterScore(raw.jitterMs);
		const lossS = Math.min(
			lossScore(raw.lossUp),
			lossScore(raw.lossDownAudio),
			lossScore(raw.lossDownVideoOwn, LOSS_BAD_VIDEO)
		);
		const latency = Math.min(rttS, jitterS);
		const score = combineScoreValue({ latency, loss: lossS });
		const rawBars = Math.max(0, Math.min(5, Math.round(score / 2)));

		this.voteWindow.push(rawBars);

		// Committed display level from the short display-window median (DISPLAY_WINDOW = 7 ≈ 14 s).
		const displayMedian = this.voteWindow.medianLast(DISPLAY_WINDOW);
		const level = scoreToLevel(displayMedian * 2);

		// Push the DISPLAY bars value into the official-vote history for the snackbar signals.
		this.officialVoteWindow.push(displayMedian);

		// Snackbar signals stay on the OfficialVoteWindow (never reset on rung changes).
		// The rung-decision evidence is owned and reset by the controller itself.
		const signals: QualitySignals = {
			displayBars: displayMedian,
			warnVote: this.officialVoteWindow.atLeast(8, 10, (b) => b <= 2),
			restoreVote: this.officialVoteWindow.atLeast(10, 13, (b) => b >= 3)
		};

		return { level, signals };
	}

	// VIDEO per-tick downlink loss from the forwarded-feed SR-escape. Per-SSRC deltas are summed so an
	// SSRC discontinuity (unsubscribe→resubscribe / AUTO-OFF→ON / changed outbound SSRC) never compares
	// mismatched cumulative baselines — a new/restarted SSRC seeds its own entry and does not contribute
	// on the first tick. Counter-reset guard (sent < prev or recv < prev) re-seeds without contributing.
	// Stale-SR guard: if dSent==0 (forwarded counter frozen while recv advances), the baseline is HELD
	// for that stream so the next SR advance sees the correct full delta. The MIN_EXPECTED_PACKETS gate
	// on the summed dSent suppresses noisy few-packet windows; undefined = not measured this tick.
	// SSRCs no longer present are pruned to prevent unbounded map growth.
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
				// New SSRC (switch / (re)subscribe / AUTO-ON): seed baseline, skip this tick.
				this.prevVideoDownSsrc.set(key, { sent, recv });
				discontinuity = true;
				return;
			}
			if (sent < prev.sent || recv < prev.recv) {
				// Counter reset (SSRC restarted / wrapped): re-seed, skip this tick.
				this.prevVideoDownSsrc.set(key, { sent, recv });
				discontinuity = true;
				return;
			}
			const ds = sent - prev.sent;
			if (ds === 0) {
				// Stale SR (forwarded counter frozen while recv advances): hold baseline so the next
				// SR advance yields dSent over the correct span. Do not update.
				return;
			}
			dSent += ds;
			dRecv += recv - prev.recv;
			this.prevVideoDownSsrc.set(key, { sent, recv });
		});

		// Post-switch mask: after any SSRC discontinuity the received counter legitimately lags the
		// forwarded counter for ~1 keyframe (VP8 lazy ramp) -> srEscape would read a spurious ~100%
		// spike (the residual artifact behind receiver-side vote whiplash + AUTO-OFF/ON). Suppress the
		// video loss reading for VIDEO_LOSS_MASK_TICKS; baselines keep updating so the post-mask delta is
		// clean. Real downlink trouble is still caught by audio loss + own-leg RTT, which are NOT masked.
		if (discontinuity) this.videoLossMaskTicks = VIDEO_LOSS_MASK_TICKS;
		if (this.videoLossMaskTicks > 0) {
			this.videoLossMaskTicks -= 1;
			return undefined;
		}

		return srEscapeLoss(dSent, Math.max(0, dRecv));
	}

	// AUDIO per-tick downlink loss from the Janus-originated mix's own inbound-rtp counters: a single
	// monotonic receiver-side pair, so a per-window delta is self-consistent (no SR-vs-live skew).
	// f = dLost / (dLost + dRecv) = dLost / dExpected (RFC 3550). Gate on MIN_EXPECTED_PACKETS — below
	// that threshold a few lost packets read as a wildly high %; audio (~100 pkt/2 s) always passes in
	// practice. dLost clamped at 0; a counter reset (recv < prev) re-anchors, covering late/duplicate
	// arrivals and SSRC changes.
	private audioDownlinkLossTick(lost: number, recv: number): number | undefined {
		const prev = this.prevAudioDownPool;
		if (prev == null || recv < prev.recv) {
			this.prevAudioDownPool = { lost, recv };
			return undefined;
		}
		const dRecv = recv - prev.recv;
		const dLost = Math.max(0, lost - prev.lost);
		this.prevAudioDownPool = { lost, recv };
		const expected = dRecv + dLost;
		if (expected < MIN_EXPECTED_PACKETS) return undefined; // too few packets — no reading
		return Math.max(0, Math.min(1, dLost / expected));
	}

	// Per-tick inbound-rtp.packetsLost fraction for the forwarded video. Load-bearing: the consistency
	// reference for lossDownVideoOwn (SR-escape trusted only when <= this), which feeds the vote. Same
	// per-tick delta shape as audioDownlinkLossTick; re-anchors on a counter reset.
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

	// Uplink webcam tracking: derives topActiveRung (highest rid still encoding frames) for the maxTier we
	// broadcast (peers' downlink snackbar + the banner's uplink-floored check) AND logs when GCC changes the
	// uplink tier — GCC owns the uplink, so a tier change here is GCC shedding/restoring a simulcast layer
	// under bandwidth pressure. Never feeds the vote.
	private trackWebcamUplink(stats: RTCStatsReport): void {
		// Reset accumulated state when the sender changes (new camera started).
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

		// topActiveRung: highest rid with Δframing > 0 relative to the previous tick.
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
		// Log a GCC-driven uplink tier change. Only once we have a real Δ baseline (prevCum) and not from the
		// -2 reset sentinel, so the establishing reading and the unreliable first tick do not emit a line.
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
