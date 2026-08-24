/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import {
	activeAudioKbps,
	aggregateQuality,
	calcDownlinkAudioVote,
	calcDownlinkScreenVote,
	calcDownlinkWebcamVote,
	calcUplinkAudioVote,
	calcUplinkScreenVote,
	calcUplinkWebcamVote,
	ConnectionQuality,
	StreamVotes
} from './connectionQualityScore';
import useStore from '../../store/Store';
import {
	IBidirectionalConnectionAudioInOut,
	IScreenOutConnection,
	IVideoOutConnection,
	IVideoScreenInConnection
} from '../../types/network/webRTC/webRTC';
import { rtcDebug } from '../../utils/debug';
import { wsClient } from '../websocket/WebSocketClient';

const QUALITY_RANK: Record<ConnectionQuality, number> = {
	lost: 0,
	terrible: 1,
	poor: 2,
	medium: 3,
	high: 4,
	optimal: 5
};

const INBOUND_RTP = 'inbound-rtp';
const REMOTE_INBOUND_RTP = 'remote-inbound-rtp';
const OUTBOUND_RTP = 'outbound-rtp';
const MEDIA_SOURCE = 'media-source';
const CANDIDATE_PAIR = 'candidate-pair';
// media-source.audioLevel (RMS 0..1) above this = local voice (client-side, real-time VAD — no wait for
// the Janus talking event). Below it (silence / typing / faint noise) we do NOT score audio fidelity,
// so a good connection stays 10 instead of flickering when you make occasional noise. Tunable.
const AUDIO_SPEECH_LEVEL = 0.05;

// 5-second sliding-window ring buffer. Each entry is a timestamped snapshot.
// Baseline = oldest entry within WINDOW_MS; if <5 s of history, oldest available is used.
// No thin-sample guard, no hysteresis — the window is the only smoothing mechanism.
const WINDOW_MS = 5000;

type Timed<T> = { ts: number; data: T };

function winPush<T>(ring: Timed<T>[], ts: number, data: T): void {
	ring.push({ ts, data });
	while (ring.length > 1 && ts - ring[0].ts > WINDOW_MS) {
		ring.shift();
	}
}

type AudioDownSnap = {
	packetsLost: number;
	packetsReceived: number;
};

type ScreenDownSnap = {
	packetsLost: number;
	packetsReceived: number;
	totalFreezesDuration: number;
	qpSum: number;
	framesDecoded: number;
};

// qualityLimitationDurations.bandwidth/.cpu are cumulative seconds; windowed Δ ÷ windowSec gives
// the fraction of time the encoder was limited in the observation window.
type VideoUpSnap = { bwDuration: number; cpuDuration: number };

// Exported for testing: determines the next committed quality level given the current raw level and
// the previous committed level. Returns the new committed level (may be unchanged) and the updated
// betterStreak counter.
export function stepHysteresis(
	raw: ConnectionQuality,
	committed: ConnectionQuality | null,
	betterStreak: number
): { next: ConnectionQuality; streak: number; changed: boolean } {
	if (committed == null) {
		return { next: raw, streak: 0, changed: true };
	}
	if (raw === 'lost') {
		const changed = committed !== 'lost';
		return { next: 'lost', streak: 0, changed };
	}
	if (committed === 'lost') {
		return { next: raw, streak: 0, changed: true };
	}
	const rawRank = QUALITY_RANK[raw];
	const committedRank = QUALITY_RANK[committed];
	if (rawRank < committedRank) {
		// worse: commit immediately
		return { next: raw, streak: 0, changed: true };
	}
	if (rawRank > committedRank) {
		// better: need 3 consecutive better ticks
		const newStreak = betterStreak + 1;
		if (newStreak >= 3) {
			return { next: raw, streak: 0, changed: true };
		}
		return { next: committed, streak: newStreak, changed: false };
	}
	// same level
	return { next: committed, streak: 0, changed: false };
}

// Exported for testing: computes a delta-based loss rate clamped to [0,1]. Returns 0 when the
// denominator is below the minimum sample threshold (avoids noise from tiny packet counts).
export function deltaLossRate(
	currentLost: number,
	currentReceived: number,
	prevLost: number,
	prevReceived: number,
	minSamples = 5
): number {
	const dLost = Math.max(0, currentLost - prevLost);
	const dRecv = Math.max(0, currentReceived - prevReceived);
	const dTotal = dLost + dRecv;
	return dTotal >= minSamples ? dLost / dTotal : 0;
}

export default class ConnectionQualityMonitor {
	private readonly meetingId: string;

	// My own quality is computed locally and is authoritative for my own tile, so it is written straight
	// to the store immediately (no round-trip). The WS broadcast still carries it to other clients.
	private readonly myUserId: string | undefined;

	private readonly audioConn: IBidirectionalConnectionAudioInOut;

	private readonly videoOut: IVideoOutConnection;

	private readonly videoIn: IVideoScreenInConnection;

	private readonly screenOut: IScreenOutConnection;

	private intervalId: ReturnType<typeof setInterval> | null = null;

	committed: ConnectionQuality | null = null;

	changedAt = 0;

	private betterStreak = 0;

	// 5 s ring buffers — one per stats direction.
	private audioDownRing: Timed<AudioDownSnap>[];

	private screenDownRing: Timed<ScreenDownSnap>[];

	// Webcam uplink: windowed qualityLimitationDurations for BW/CPU fraction computation.
	private videoUpRing: Timed<VideoUpSnap>[];

	// instantaneous fractionLost samples for screen uplink (remote-inbound-rtp)
	private screenUpLossRing: Timed<number>[] = [];

	// windowed qpSum/framesEncoded snapshots for screen uplink blur (mean QP = Δqp/Δframes)
	private screenUpQpRing: Timed<{ qpSum: number; framesEncoded: number }>[] = [];

	// candidate-pair currentRoundTripTime (ms) samples — the global me<->Janus RTT vote
	private rttRing: Timed<number>[] = [];

	// framesEncoded per rid — the reliable "is this layer producing video" signal.
	// RTX/padding keep bytesSent growing and active=true on GCC-deallocated layers;
	// only framesEncoded increments when the encoder actually produces frames.
	private videoFramesEncoded: Record<string, number> = {};

	// last committed topActiveRung — used to detect tier changes for the debug log
	private lastTopActiveRung = -2;

	private lastVideoSender: RTCRtpSender | null = null;

	// previous outbound-audio cumulative counters, for the encoded-bitrate delta (uplink fidelity).
	// bytes = bytesSent (PAYLOAD-only per RFC 3550; header is a disjoint counter, not subtracted).
	private prevAudioOut: { bytes: number; packets: number } | null = null;

	// topActiveRung computed this tick (null = video sender absent)
	private currentTopActiveRung: number | null = null;

	// maxTier value included in the last WS send — compared each tick to detect changes
	private lastSentMaxTier: 'high' | 'medium' | 'low' | undefined = undefined;

	constructor(
		meetingId: string,
		audioConn: IBidirectionalConnectionAudioInOut,
		videoOut: IVideoOutConnection,
		videoIn: IVideoScreenInConnection,
		screenOut: IScreenOutConnection
	) {
		// Pre-seed rings with a zero baseline at construction time so the first tick computes a
		// meaningful delta from the start of monitoring rather than from nothing.
		const t0 = Date.now();
		this.audioDownRing = [
			{
				ts: t0,
				data: { packetsLost: 0, packetsReceived: 0 }
			}
		];
		this.screenDownRing = [
			{
				ts: t0,
				data: {
					packetsLost: 0,
					packetsReceived: 0,
					totalFreezesDuration: 0,
					qpSum: 0,
					framesDecoded: 0
				}
			}
		];
		this.videoUpRing = [{ ts: t0, data: { bwDuration: 0, cpuDuration: 0 } }];
		this.screenUpQpRing = [{ ts: t0, data: { qpSum: 0, framesEncoded: 0 } }];
		this.meetingId = meetingId;
		this.myUserId = useStore.getState().session?.id;
		this.audioConn = audioConn;
		this.videoOut = videoOut;
		this.videoIn = videoIn;
		this.screenOut = screenOut;
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

	private getMaxTier(): 'high' | 'medium' | 'low' | undefined {
		if (this.currentTopActiveRung == null || this.currentTopActiveRung < 0) return undefined;
		if (this.currentTopActiveRung >= 2) return 'high';
		if (this.currentTopActiveRung === 1) return 'medium';
		return 'low';
	}

	// Re-assert my own quality straight into the store. Idempotent thanks to the setter's changedAt
	// guard.
	private applyLocalQuality(level: ConnectionQuality): void {
		if (this.myUserId == null) return;
		useStore
			.getState()
			.setParticipantConnectionQuality(
				this.meetingId,
				this.myUserId,
				level,
				this.changedAt,
				this.lastSentMaxTier
			);
	}

	async emitInitial(): Promise<void> {
		const { votes, level } = await this.computeQuality();
		// bypass hysteresis for the initial broadcast
		this.committed = level;
		this.changedAt = Math.max(Date.now(), this.changedAt + 1);
		const maxTier = this.getMaxTier();
		this.lastSentMaxTier = maxTier;
		useStore.getState().setConnectionQualityVotes(votes);
		wsClient.sendConnectionQuality(this.meetingId, level, this.changedAt, undefined, maxTier);
		this.applyLocalQuality(level);
	}

	async resyncTo(userId: string): Promise<void> {
		if (this.committed == null) {
			await this.emitInitial();
		}
		if (this.committed != null) {
			wsClient.sendConnectionQuality(
				this.meetingId,
				this.committed,
				this.changedAt,
				userId,
				this.lastSentMaxTier
			);
		}
	}

	rebroadcast(): void {
		if (this.committed != null) {
			wsClient.sendConnectionQuality(
				this.meetingId,
				this.committed,
				this.changedAt,
				undefined,
				this.lastSentMaxTier
			);
		}
	}

	private async evaluate(): Promise<void> {
		const { votes, level } = await this.computeQuality();
		const { next, streak, changed } = stepHysteresis(level, this.committed, this.betterStreak);
		const maxTier = this.getMaxTier();
		const maxTierChanged = maxTier !== this.lastSentMaxTier;
		this.betterStreak = streak;
		useStore.getState().setConnectionQualityVotes(votes);
		if (changed) {
			this.committed = next;
			this.changedAt = Math.max(Date.now(), this.changedAt + 1);
		}
		if (changed || maxTierChanged) {
			this.lastSentMaxTier = maxTier;
			wsClient.sendConnectionQuality(
				this.meetingId,
				this.committed ?? next,
				this.changedAt,
				undefined,
				maxTier
			);
		}
		this.applyLocalQuality(next);
	}

	private async computeQuality(): Promise<{ votes: StreamVotes; level: ConnectionQuality }> {
		const votes: StreamVotes = {};

		// iceConnected: audio PC connection state must not be failed/disconnected/closed
		const audioState = this.audioConn.peerConn?.connectionState;
		const iceConnected = !audioState || !['failed', 'disconnected', 'closed'].includes(audioState);

		// Audio presence is decided by app state (see the audio block below), not by packet flow.
		const participants = Object.values(
			useStore.getState().meetings[this.meetingId]?.participants ?? {}
		);
		const myAudioOn =
			this.myUserId != null &&
			(participants.find((p) => p.userId === this.myUserId)?.audioStreamOn ?? false);
		const someoneElseAudioOn = participants.some(
			(p) => p.userId !== this.myUserId && (p.audioStreamOn ?? false)
		);

		// webcam uplink: only while a video sender exists (camera on)
		this.currentTopActiveRung = null;
		if (this.videoOut.rtpSender != null) {
			try {
				const stats = await this.videoOut.rtpSender.getStats();
				votes.uplinkWebcam = this.calcUplinkWebcam(stats);
			} catch {
				// defensive: browser may refuse getStats when the PC is closing; omit the vote
			}
		}

		// downlink RTT for webcam/screen receive — measured on the video-in PC's own candidate-pair
		// (each stream is a separate peer-connection, so its RTT is its own). Undefined -> no penalty.
		let videoInRttMs: number | undefined;
		if (this.videoIn.peerConn != null) {
			try {
				videoInRttMs = this.readInstantCandidateRtt(await this.videoIn.peerConn.getStats());
			} catch {
				// defensive: leave undefined
			}
		}

		// webcam downlink: only while receiving feeds, from the in-connection's per-feed quality states
		const tierMap: Record<'high' | 'medium' | 'low', number> = { high: 2, medium: 1, low: 0 };
		const videoFeeds = this.videoIn.getVideoFeedsForQuality();
		if (videoFeeds.length > 0) {
			const mappedFeeds = videoFeeds.map((f) => {
				let shownTierIdx: number;
				if (f.frameHeight >= 720) {
					shownTierIdx = 2;
				} else if (f.frameHeight >= 360) {
					shownTierIdx = 1;
				} else {
					shownTierIdx = 0;
				}
				const ownerMaxTier =
					useStore.getState().activeMeeting?.connectionQuality[f.userId]?.maxTier;
				const senderMaxTierIdx = ownerMaxTier != null ? (tierMap[ownerMaxTier] ?? -1) : -1;
				return {
					shownTierIdx,
					senderMaxTierIdx,
					inboundLossRate: f.inboundLossRate,
					temporalReduced: f.temporalReduced
				};
			});
			votes.downlinkWebcam = calcDownlinkWebcamVote(mappedFeeds, videoInRttMs);
		}

		// The audio AudioBridge PC is the always-up channel, so we read it every tick: the global RTT vote
		// from its candidate-pair (the whole me<->Janus pipe), plus the audio votes when a direction is
		// actually active — uplink while my mic is on, downlink while someone else's is (presence is app
		// state, not packet flow).
		if (this.audioConn.peerConn != null) {
			try {
				const stats = await this.audioConn.peerConn.getStats();
				const rttMs = this.readRttMs(stats);
				const networkConstrained = this.isUplinkBandwidthConstrained(stats);
				if (myAudioOn || someoneElseAudioOn) {
					const { uplink, downlink } = this.calcAudioVotes(stats, rttMs, networkConstrained);
					if (myAudioOn) votes.uplinkAudio = uplink;
					if (someoneElseAudioOn) votes.downlinkAudio = downlink;
				}
			} catch {
				// defensive: omit audio votes on error
			}
		}

		// screen uplink: only while sharing
		if (this.screenOut.rtpSender != null) {
			try {
				const stats = await this.screenOut.rtpSender.getStats();
				votes.uplinkScreen = this.calcUplinkScreen(stats);
			} catch {
				// defensive: omit the vote
			}
		}

		// screen downlink: only while receiving a shared screen
		if (this.videoIn.hasScreenFeed()) {
			const receiver = this.videoIn.getScreenReceiver();
			if (receiver != null) {
				try {
					const stats = await receiver.getStats();
					votes.downlinkScreen = this.calcDownlinkScreen(stats, videoInRttMs);
				} catch {
					// defensive: omit the vote
				}
			}
		}

		return { votes, level: aggregateQuality(votes, iceConnected) };
	}

	private calcUplinkWebcam(stats: RTCStatsReport): number {
		if (this.videoOut.rtpSender !== this.lastVideoSender) {
			this.videoFramesEncoded = {};
			this.videoUpRing.length = 0;
			this.lastVideoSender = this.videoOut.rtpSender;
		}
		const track = this.videoOut.rtpSender?.track;
		const captureHeight =
			track && typeof (track as MediaStreamTrack).getSettings === 'function'
				? ((track as MediaStreamTrack).getSettings().height ?? 0)
				: 0;
		const tiers = useStore.getState().session.attributes?.videoSimulcastTiers;
		let producibleRungs: number;
		if (tiers && tiers.length > 0) {
			producibleRungs = tiers.filter((t) => captureHeight >= t.height).length;
		} else if (captureHeight >= 720) {
			producibleRungs = 3;
		} else if (captureHeight >= 360) {
			producibleRungs = 2;
		} else {
			producibleRungs = 1;
		}

		const ridToIndex: Record<string, 0 | 1 | 2> = { l: 0, m: 1, h: 2 };
		let topActiveRung = -1;
		let bwDuration = 0;
		let cpuDuration = 0;
		// uplink RTT for this stream from its own remote-inbound report (Janus's view of our send leg)
		let videoUpRttMs: number | undefined;
		// per-rid temporal structure (scalabilityMode@fps) — snapshotted here, logged ONLY on a tier
		// change (below), so it captures "what we're producing" without the per-tick fps-jitter spam.
		const scal: Record<string, string> = {};

		const now = Date.now();
		stats.forEach(
			(
				r: RTCStats & {
					rid?: string;
					framesEncoded?: number;
					framesPerSecond?: number;
					scalabilityMode?: string;
					active?: boolean;
					qualityLimitationDurations?: { bandwidth?: number; cpu?: number };
					roundTripTime?: number;
				}
			) => {
				if (r.type === REMOTE_INBOUND_RTP && r.roundTripTime != null) {
					videoUpRttMs = r.roundTripTime * 1000;
				}
				if (r.type !== OUTBOUND_RTP) return;
				// qualityLimitationDurations are cumulative — read from any layer (same encoder)
				bwDuration = Math.max(bwDuration, r.qualityLimitationDurations?.bandwidth ?? 0);
				cpuDuration = Math.max(cpuDuration, r.qualityLimitationDurations?.cpu ?? 0);
				const rid = r.rid ?? '';
				const idx = ridToIndex[rid];
				if (idx == null) return;
				scal[rid] = `${r.scalabilityMode ?? '?'}@${Math.round(r.framesPerSecond ?? 0)}fps`;
				// framesEncoded is the reliable "is this layer producing video" signal:
				// GCC-disabled layers keep active=true and trickle RTX/padding bytes,
				// but their encoder produces 0 frames — only framesEncoded reveals this.
				const prevFrames = this.videoFramesEncoded[rid] ?? 0;
				const currentFrames = r.framesEncoded ?? 0;
				this.videoFramesEncoded[rid] = currentFrames;
				const framesGrew = currentFrames > prevFrames;
				if (r.active !== false && framesGrew && idx > topActiveRung) {
					topActiveRung = idx;
				}
			}
		);

		// windowed bwLimitedFraction and cpuLimitedFraction
		winPush(this.videoUpRing, now, { bwDuration, cpuDuration });
		const base = this.videoUpRing[0].data;
		const windowSec = Math.max((now - this.videoUpRing[0].ts) / 1000, 0.1);
		const bwLimitedFraction = Math.max(0, bwDuration - base.bwDuration) / windowSec;
		const cpuLimitedFraction = Math.max(0, cpuDuration - base.cpuDuration) / windowSec;

		if (topActiveRung !== this.lastTopActiveRung) {
			const tierName = (r: number): string => ['low', 'medium', 'high'][r] ?? 'none';
			const ridName: Record<string, string> = { h: 'high', m: 'medium', l: 'low' };
			const bestPossible = producibleRungs > 0 ? tierName(producibleRungs - 1) : 'none';
			const temporal = Object.keys(scal)
				.map((r) => `${ridName[r] ?? r}:${scal[r]}`)
				.join(' ');
			rtcDebug(
				`UPLINK WEBCAM CHANGE: best tier possible ${bestPossible}, uploaded ${tierName(this.lastTopActiveRung)} -> ${tierName(topActiveRung)}` +
					` | temporal ${temporal}`
			);
			this.lastTopActiveRung = topActiveRung;
		}
		this.currentTopActiveRung = topActiveRung;

		return calcUplinkWebcamVote({
			topActiveRung,
			producibleRungs,
			bwLimitedFraction,
			cpuLimitedFraction,
			rttMs: videoUpRttMs
		});
	}

	// Audio up and down are scored from getStats: inbound-rtp for the downlink (delta packetsLost)
	// and remote-inbound-rtp for the uplink (fractionLost). Which is included is decided by the
	// caller from app state (mic on / others present).
	private calcAudioVotes(
		stats: RTCStatsReport,
		rttMs: number | undefined,
		networkConstrained: boolean
	): { uplink: number; downlink: number } {
		const now = Date.now();

		let downSnap: AudioDownSnap | null = null;
		let outSnap: { bytes: number; packets: number } | null = null;
		let audioLevel = 0;

		stats.forEach(
			(
				r: RTCStats & {
					kind?: string;
					packetsLost?: number;
					packetsReceived?: number;
					bytesSent?: number;
					packetsSent?: number;
					audioLevel?: number;
				}
			) => {
				if (r.type === INBOUND_RTP && r.kind === 'audio') {
					downSnap = {
						packetsLost: r.packetsLost ?? 0,
						packetsReceived: r.packetsReceived ?? 0
					};
				}
				if (r.type === OUTBOUND_RTP && r.kind === 'audio') {
					outSnap = {
						bytes: r.bytesSent ?? 0,
						packets: r.packetsSent ?? 0
					};
				}
				if (r.type === MEDIA_SOURCE && r.kind === 'audio') {
					audioLevel = r.audioLevel ?? 0;
				}
			}
		);

		// uplink fidelity: encoded bitrate from the outbound-audio counter deltas, scored ONLY while the
		// local mic level indicates real speech (client-side, real-time VAD via media-source.audioLevel) —
		// so silence/typing on a good connection is never mistaken for a muffled voice. Measured on OUR
		// outbound = the leg where muffling happens; the AudioBridge re-encode makes the inbound useless.
		// undefined (not speaking / counter reset) -> no quality penalty. Baseline advances every tick.
		const speaking = audioLevel > AUDIO_SPEECH_LEVEL;
		let activeKbps: number | undefined;
		if (outSnap != null) {
			const cur = outSnap as { bytes: number; packets: number };
			const prev = this.prevAudioOut;
			if (speaking && prev != null && cur.packets >= prev.packets && cur.bytes >= prev.bytes) {
				// bytesSent is PAYLOAD-only (RFC 3550 §6.4.1); headerBytesSent is a DISJOINT counter, so
				// subtracting it would double-count the header and ~halve small audio packets. Audio has
				// no RTX, so the bytesSent delta is already the pure Opus payload.
				activeKbps = activeAudioKbps({
					payloadBytesDelta: Math.max(0, cur.bytes - prev.bytes),
					packetsDelta: cur.packets - prev.packets
				});
			}
			this.prevAudioOut = cur;
		}

		// uplink: fidelity from the encoded bitrate (armed only when the network is capping the send
		// rate — see isUplinkBandwidthConstrained) x the uplink delay factor
		const uplinkScore = calcUplinkAudioVote({ activeKbps, networkConstrained, rttMs });

		// downlink: windowed delta packetsLost / (packetsLost + packetsReceived)
		let downlinkScore = 10;
		if (downSnap != null) {
			winPush(this.audioDownRing, now, downSnap as AudioDownSnap);
			const base = this.audioDownRing[0].data;
			const cur = downSnap as AudioDownSnap;
			const dLost = Math.max(0, cur.packetsLost - base.packetsLost);
			const dRecv = Math.max(0, cur.packetsReceived - base.packetsReceived);
			const lossRate = dLost + dRecv > 0 ? dLost / (dLost + dRecv) : 0;
			downlinkScore = calcDownlinkAudioVote({ lossRate, rttMs });
		}

		return { uplink: uplinkScore, downlink: downlinkScore };
	}

	// Global RTT (ms) from the selected candidate-pair of the always-up audio PC — the whole
	// me<->Janus round-trip, averaged over the window. Not per-direction (a round-trip can't be split
	// up/down) but ours alone: other participants have separate pipes to Janus.
	private readRttMs(stats: RTCStatsReport): number | undefined {
		const now = Date.now();
		let sample: number | undefined;
		stats.forEach(
			(
				r: RTCStats & {
					nominated?: boolean;
					state?: string;
					currentRoundTripTime?: number;
				}
			) => {
				if (
					r.type === CANDIDATE_PAIR &&
					r.nominated === true &&
					r.state === 'succeeded' &&
					r.currentRoundTripTime != null
				) {
					sample = r.currentRoundTripTime * 1000;
				}
			}
		);
		if (sample === undefined) return undefined;
		winPush(this.rttRing, now, sample);
		return this.rttRing.reduce((s, e) => s + e.data, 0) / this.rttRing.length;
	}

	// Instantaneous RTT (ms) from a PC's own selected candidate-pair — used for the receive-side PCs
	// (webcam/screen downlink), each measured on its own transport. Undefined if not yet nominated.
	private readInstantCandidateRtt(stats: RTCStatsReport): number | undefined {
		let rttMs: number | undefined;
		stats.forEach(
			(
				r: RTCStats & {
					nominated?: boolean;
					state?: string;
					currentRoundTripTime?: number;
				}
			) => {
				if (
					r.type === CANDIDATE_PAIR &&
					r.nominated === true &&
					r.state === 'succeeded' &&
					r.currentRoundTripTime != null
				) {
					rttMs = r.currentRoundTripTime * 1000;
				}
			}
		);
		return rttMs;
	}

	// BWE gate for the audio-uplink fidelity vote: is the network capping our send rate? The selected
	// candidate-pair's availableOutgoingBitrate below the good-voice band means real throttling (arm the
	// fidelity penalty). Undefined -> we cannot tell -> trust VBR (no penalty). Threshold to validate E2E.
	private isUplinkBandwidthConstrained(stats: RTCStatsReport): boolean {
		const AUDIO_BWE_FLOOR_BPS = 40000;
		let available: number | undefined;
		stats.forEach(
			(
				r: RTCStats & {
					nominated?: boolean;
					state?: string;
					availableOutgoingBitrate?: number;
				}
			) => {
				if (
					r.type === CANDIDATE_PAIR &&
					r.nominated === true &&
					r.state === 'succeeded' &&
					r.availableOutgoingBitrate != null
				) {
					available = r.availableOutgoingBitrate;
				}
			}
		);
		return available !== undefined && available < AUDIO_BWE_FLOOR_BPS;
	}

	private calcUplinkScreen(stats: RTCStatsReport): number {
		const now = Date.now();
		let rttMs: number | undefined;
		let qpSum: number | undefined;
		let framesEncoded: number | undefined;

		stats.forEach(
			(
				r: RTCStats & {
					kind?: string;
					fractionLost?: number;
					roundTripTime?: number;
					qpSum?: number;
					framesEncoded?: number;
				}
			) => {
				// remote-inbound-rtp carries the sender's view of loss on OUR uplink leg (fractionLost 0..1)
				// plus the per-SSRC round-trip time on this stream's own transport.
				if (r.type === REMOTE_INBOUND_RTP) {
					winPush(this.screenUpLossRing, now, r.fractionLost ?? 0);
					if (r.roundTripTime != null) rttMs = r.roundTripTime * 1000;
				}
				// outbound-rtp carries our encoder's quantizer sum + frame count -> mean QP (blur)
				if (r.type === OUTBOUND_RTP && r.kind === 'video') {
					qpSum = r.qpSum ?? 0;
					framesEncoded = r.framesEncoded ?? 0;
				}
			}
		);

		const lossRate =
			this.screenUpLossRing.length > 0
				? this.screenUpLossRing.reduce((s, e) => s + e.data, 0) / this.screenUpLossRing.length
				: 0;

		// windowed mean QP = ΔqpSum / ΔframesEncoded; undefined if no new frames (static screen) ->
		// the vote skips the QP term and scores loss only.
		let qp: number | undefined;
		if (framesEncoded !== undefined) {
			winPush(this.screenUpQpRing, now, { qpSum: qpSum ?? 0, framesEncoded });
			const base = this.screenUpQpRing[0].data;
			const dFrames = framesEncoded - base.framesEncoded;
			const dQp = (qpSum ?? 0) - base.qpSum;
			if (dFrames > 0) qp = dQp / dFrames;
		}

		return calcUplinkScreenVote({ lossRate, qp, rttMs });
	}

	private calcDownlinkScreen(stats: RTCStatsReport, rttMs?: number): number {
		const now = Date.now();

		let snap: ScreenDownSnap | null = null;
		stats.forEach(
			(
				r: RTCStats & {
					kind?: string;
					packetsLost?: number;
					packetsReceived?: number;
					totalFreezesDuration?: number;
					qpSum?: number;
					framesDecoded?: number;
				}
			) => {
				if (r.type === INBOUND_RTP && r.kind === 'video') {
					snap = {
						packetsLost: r.packetsLost ?? 0,
						packetsReceived: r.packetsReceived ?? 0,
						totalFreezesDuration: r.totalFreezesDuration ?? 0,
						qpSum: r.qpSum ?? 0,
						framesDecoded: r.framesDecoded ?? 0
					};
				}
			}
		);

		if (snap == null) return 10;

		winPush(this.screenDownRing, now, snap as ScreenDownSnap);
		const base = this.screenDownRing[0].data;
		const cur = snap as ScreenDownSnap;
		// degradation = freeze ratio: fraction of the window the decoder was stalled. A post-recovery
		// outcome (RTT's recovery damage is already inside it), ~0 on static content.
		const windowSec = Math.max((now - this.screenDownRing[0].ts) / 1000, 0.1);
		const dFreeze = Math.max(0, cur.totalFreezesDuration - base.totalFreezesDuration);
		const freezeRatio = Math.max(0, Math.min(1, dFreeze / windowSec));

		return calcDownlinkScreenVote({ freezeRatio, rttMs });
	}
}
