/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import {
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

type AudioUpSnap = { fractionLost: number; jitter: number };

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

	private audioUpRing: Timed<AudioUpSnap>[] = [];

	private screenDownRing: Timed<ScreenDownSnap>[];

	// Webcam uplink: windowed qualityLimitationDurations for BW/CPU fraction computation.
	private videoUpRing: Timed<VideoUpSnap>[];

	// instantaneous fractionLost samples for screen uplink (remote-inbound-rtp)
	private screenUpLossRing: Timed<number>[] = [];

	// instantaneous jitter (s) samples for screen uplink (remote-inbound-rtp)
	private screenUpJitterRing: Timed<number>[] = [];

	// instantaneous fractionLost samples for webcam uplink (remote-inbound-rtp video)
	private videoUpLossRing: Timed<number>[] = [];

	// framesEncoded per rid — the reliable "is this layer producing video" signal.
	// RTX/padding keep bytesSent growing and active=true on GCC-deallocated layers;
	// only framesEncoded increments when the encoder actually produces frames.
	private videoFramesEncoded: Record<string, number> = {};

	// last committed topActiveRung — used to detect tier changes for the debug log
	private lastTopActiveRung = -2;

	private lastVideoSender: RTCRtpSender | null = null;

	// topActiveRung computed this tick (null = video sender absent)
	private currentTopActiveRung: number | null = null;

	// maxTier value included in the last WS send — compared each tick to detect changes
	private lastSentMaxTier: 'best' | 'medium' | 'low' | undefined = undefined;

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

	private getMaxTier(): 'best' | 'medium' | 'low' | undefined {
		if (this.currentTopActiveRung == null || this.currentTopActiveRung < 0) return undefined;
		if (this.currentTopActiveRung >= 2) return 'best';
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

		// webcam downlink: only while receiving feeds, from the in-connection's per-feed quality states
		const tierMap: Record<'best' | 'medium' | 'low', number> = { best: 2, medium: 1, low: 0 };
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
				return { shownTierIdx, senderMaxTierIdx, inboundLossRate: f.inboundLossRate };
			});
			votes.downlinkWebcam = calcDownlinkWebcamVote(mappedFeeds);
		}

		// audio is one bidirectional AudioBridge channel that is always up in a meeting, so presence is
		// decided by app state, not packet flow: uplink only while my mic is on, downlink only while
		// someone else actually has their mic on (nothing to hear otherwise). getStats supplies the
		// impairment numbers.
		if (this.audioConn.peerConn != null && (myAudioOn || someoneElseAudioOn)) {
			try {
				const stats = await this.audioConn.peerConn.getStats();
				const { uplink, downlink } = this.calcAudioVotes(stats);
				if (myAudioOn) votes.uplinkAudio = uplink;
				if (someoneElseAudioOn) votes.downlinkAudio = downlink;
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
					votes.downlinkScreen = this.calcDownlinkScreen(stats);
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
			this.videoUpLossRing.length = 0;
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

		const now = Date.now();
		stats.forEach(
			(
				r: RTCStats & {
					rid?: string;
					framesEncoded?: number;
					active?: boolean;
					qualityLimitationDurations?: { bandwidth?: number; cpu?: number };
				}
			) => {
				if (r.type !== OUTBOUND_RTP) return;
				// qualityLimitationDurations are cumulative — read from any layer (same encoder)
				bwDuration = Math.max(bwDuration, r.qualityLimitationDurations?.bandwidth ?? 0);
				cpuDuration = Math.max(cpuDuration, r.qualityLimitationDurations?.cpu ?? 0);
				const rid = r.rid ?? '';
				const idx = ridToIndex[rid];
				if (idx == null) return;
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
			const rungLabel = (r: number): string => ['l', 'm', 'h'][r] ?? `rung${r}`;
			rtcDebug(
				`UPLINK WEBCAM TIER CHANGE: ${rungLabel(this.lastTopActiveRung)} -> ${rungLabel(topActiveRung)}` +
					` (topActiveRung=${topActiveRung}, producibleRungs=${producibleRungs})`
			);
			this.lastTopActiveRung = topActiveRung;
		}
		this.currentTopActiveRung = topActiveRung;

		// remote-inbound-rtp video fractionLost is instantaneous — average over the window
		stats.forEach((r: RTCStats & { kind?: string; fractionLost?: number }) => {
			if (r.type === REMOTE_INBOUND_RTP && r.kind === 'video') {
				winPush(this.videoUpLossRing, now, r.fractionLost ?? 0);
			}
		});
		const lossRate =
			this.videoUpLossRing.length > 0
				? this.videoUpLossRing.reduce((s, e) => s + e.data, 0) / this.videoUpLossRing.length
				: 0;

		return calcUplinkWebcamVote({
			topActiveRung,
			producibleRungs,
			bwLimitedFraction,
			cpuLimitedFraction,
			lossRate
		});
	}

	// Audio up and down are scored from getStats: inbound-rtp for the downlink (delta packetsLost)
	// and remote-inbound-rtp for the uplink (fractionLost). Which is included is decided by the
	// caller from app state (mic on / others present).
	private calcAudioVotes(stats: RTCStatsReport): { uplink: number; downlink: number } {
		const now = Date.now();

		let downSnap: AudioDownSnap | null = null;
		let upSnap: AudioUpSnap | null = null;

		stats.forEach(
			(
				r: RTCStats & {
					kind?: string;
					packetsLost?: number;
					packetsReceived?: number;
					fractionLost?: number;
					jitter?: number;
				}
			) => {
				if (r.type === INBOUND_RTP && r.kind === 'audio') {
					downSnap = {
						packetsLost: r.packetsLost ?? 0,
						packetsReceived: r.packetsReceived ?? 0
					};
				}
				if (r.type === REMOTE_INBOUND_RTP && r.kind === 'audio') {
					upSnap = {
						fractionLost: r.fractionLost ?? 0,
						jitter: r.jitter ?? 0
					};
				}
			}
		);

		// uplink: average instantaneous fractionLost over the window
		let uplinkScore = 10;
		if (upSnap != null) {
			winPush(this.audioUpRing, now, upSnap as AudioUpSnap);
			const n = this.audioUpRing.length;
			const avgLoss = this.audioUpRing.reduce((s, e) => s + e.data.fractionLost, 0) / n;
			const avgJitter = this.audioUpRing.reduce((s, e) => s + e.data.jitter, 0) / n;
			uplinkScore = calcUplinkAudioVote({ fractionLost: avgLoss, jitter: avgJitter });
		}

		// downlink: windowed delta packetsLost / (packetsLost + packetsReceived)
		let downlinkScore = 10;
		if (downSnap != null) {
			winPush(this.audioDownRing, now, downSnap as AudioDownSnap);
			const base = this.audioDownRing[0].data;
			const cur = downSnap as AudioDownSnap;
			const dLost = Math.max(0, cur.packetsLost - base.packetsLost);
			const dRecv = Math.max(0, cur.packetsReceived - base.packetsReceived);
			const lossRate = dLost + dRecv > 0 ? dLost / (dLost + dRecv) : 0;
			downlinkScore = calcDownlinkAudioVote({ lossRate });
		}

		return { uplink: uplinkScore, downlink: downlinkScore };
	}

	private calcUplinkScreen(stats: RTCStatsReport): number {
		const now = Date.now();

		stats.forEach((r: RTCStats & { fractionLost?: number; jitter?: number }) => {
			// remote-inbound-rtp carries the sender's view of loss (fractionLost 0..1) + jitter (s)
			if (r.type === REMOTE_INBOUND_RTP) {
				winPush(this.screenUpLossRing, now, r.fractionLost ?? 0);
				winPush(this.screenUpJitterRing, now, r.jitter ?? 0);
			}
		});

		const fractionLost =
			this.screenUpLossRing.length > 0
				? this.screenUpLossRing.reduce((s, e) => s + e.data, 0) / this.screenUpLossRing.length
				: 0;
		const jitter =
			this.screenUpJitterRing.length > 0
				? this.screenUpJitterRing.reduce((s, e) => s + e.data, 0) / this.screenUpJitterRing.length
				: 0;

		return calcUplinkScreenVote({ fractionLost, jitter });
	}

	private calcDownlinkScreen(stats: RTCStatsReport): number {
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
		const dPktLost = Math.max(0, cur.packetsLost - base.packetsLost);
		const dPktRecv = Math.max(0, cur.packetsReceived - base.packetsReceived);
		const lossRate = dPktLost + dPktRecv > 0 ? dPktLost / (dPktLost + dPktRecv) : 0;

		return calcDownlinkScreenVote({ lossRate });
	}
}
