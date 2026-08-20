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
	concealedSamples: number;
	totalSamplesReceived: number;
	jbDelay: number;
	jbEmitted: number;
};

type AudioUpSnap = { fractionLost: number; roundTripTime: number };

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

	// instantaneous fractionLost samples for webcam uplink (remote-inbound-rtp video)
	private videoUpLossRing: Timed<number>[] = [];

	// bytesSent per rid — used only to detect growing (active) layers, not windowed
	private videoBytesSent: Record<string, number> = {};

	private lastVideoSender: RTCRtpSender | null = null;

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
				data: { concealedSamples: 0, totalSamplesReceived: 0, jbDelay: 0, jbEmitted: 0 }
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

	// Re-assert my own quality straight into the store. Idempotent thanks to the setter's changedAt
	// guard.
	private applyLocalQuality(level: ConnectionQuality): void {
		if (this.myUserId == null) return;
		useStore
			.getState()
			.setParticipantConnectionQuality(this.meetingId, this.myUserId, level, this.changedAt);
	}

	async emitInitial(): Promise<void> {
		const { votes, level } = await this.computeQuality();
		// bypass hysteresis for the initial broadcast
		this.committed = level;
		this.changedAt = Math.max(Date.now(), this.changedAt + 1);
		useStore.getState().setConnectionQualityVotes(votes);
		wsClient.sendConnectionQuality(this.meetingId, level, this.changedAt);
		this.applyLocalQuality(level);
	}

	async resyncTo(userId: string): Promise<void> {
		if (this.committed == null) {
			await this.emitInitial();
		}
		if (this.committed != null) {
			wsClient.sendConnectionQuality(this.meetingId, this.committed, this.changedAt, userId);
		}
	}

	rebroadcast(): void {
		if (this.committed != null) {
			wsClient.sendConnectionQuality(this.meetingId, this.committed, this.changedAt);
		}
	}

	private async evaluate(): Promise<void> {
		const { votes, level } = await this.computeQuality();
		const { next, streak, changed } = stepHysteresis(level, this.committed, this.betterStreak);
		this.betterStreak = streak;
		useStore.getState().setConnectionQualityVotes(votes);
		if (changed) {
			this.committed = next;
			this.changedAt = Math.max(Date.now(), this.changedAt + 1);
			wsClient.sendConnectionQuality(this.meetingId, next, this.changedAt);
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
		if (this.videoOut.rtpSender != null) {
			try {
				const stats = await this.videoOut.rtpSender.getStats();
				votes.uplinkWebcam = this.calcUplinkWebcam(stats);
			} catch {
				// defensive: browser may refuse getStats when the PC is closing; omit the vote
			}
		}

		// webcam downlink: only while receiving feeds, from the in-connection's per-feed quality states
		const videoFeeds = this.videoIn.getVideoFeedsForQuality();
		if (videoFeeds.length > 0) {
			votes.downlinkWebcam = calcDownlinkWebcamVote(videoFeeds);
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
			this.videoBytesSent = {};
			this.videoUpLossRing.length = 0;
			this.videoUpRing.length = 0;
			this.lastVideoSender = this.videoOut.rtpSender;
		}
		const track = this.videoOut.rtpSender?.track;
		let producibleRungs = 1;
		if (track && typeof (track as MediaStreamTrack).getSettings === 'function') {
			const height = (track as MediaStreamTrack).getSettings().height ?? 0;
			if (height >= 720) producibleRungs = 3;
			else if (height >= 360) producibleRungs = 2;
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
					bytesSent?: number;
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
				const prevBytes = this.videoBytesSent[rid] ?? 0;
				const currentBytes = r.bytesSent ?? 0;
				this.videoBytesSent[rid] = currentBytes;
				const growing = currentBytes > prevBytes;
				if (r.active !== false && growing && idx > topActiveRung) {
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

	// Audio up and down are scored from getStats: inbound-rtp for the downlink mix
	// (concealmentRatio + jbDelayPerFrameSec) and the far end's remote-inbound-rtp report for the
	// uplink (fractionLost + roundTripTime). Which of the two is actually included is decided by the
	// caller from app state (mic on / others present).
	private calcAudioVotes(stats: RTCStatsReport): { uplink: number; downlink: number } {
		const now = Date.now();

		let downSnap: AudioDownSnap | null = null;
		let upSnap: AudioUpSnap | null = null;

		stats.forEach(
			(
				r: RTCStats & {
					kind?: string;
					concealedSamples?: number;
					totalSamplesReceived?: number;
					jitterBufferDelay?: number;
					jitterBufferEmittedCount?: number;
					fractionLost?: number;
					roundTripTime?: number;
				}
			) => {
				if (r.type === INBOUND_RTP && r.kind === 'audio') {
					downSnap = {
						concealedSamples: r.concealedSamples ?? 0,
						totalSamplesReceived: r.totalSamplesReceived ?? 0,
						jbDelay: r.jitterBufferDelay ?? 0,
						jbEmitted: r.jitterBufferEmittedCount ?? 0
					};
				}
				if (r.type === REMOTE_INBOUND_RTP && r.kind === 'audio') {
					upSnap = {
						fractionLost: r.fractionLost ?? 0,
						roundTripTime: r.roundTripTime ?? 0
					};
				}
			}
		);

		// uplink: average instantaneous fractionLost + roundTripTime over the window
		let uplinkScore = 10;
		if (upSnap != null) {
			winPush(this.audioUpRing, now, upSnap as AudioUpSnap);
			const avgLoss =
				this.audioUpRing.reduce((s, e) => s + e.data.fractionLost, 0) / this.audioUpRing.length;
			const avgRttMs =
				(this.audioUpRing.reduce((s, e) => s + e.data.roundTripTime, 0) / this.audioUpRing.length) *
				1000;
			uplinkScore = calcUplinkAudioVote({ lossRate: avgLoss, rttMs: avgRttMs });
		}

		// downlink: compute deltas over the 5 s window
		let downlinkScore = 10;
		if (downSnap != null) {
			winPush(this.audioDownRing, now, downSnap as AudioDownSnap);
			const base = this.audioDownRing[0].data;
			const cur = downSnap as AudioDownSnap;
			const dConcealed = Math.max(0, cur.concealedSamples - base.concealedSamples);
			const dTotalSamples = Math.max(0, cur.totalSamplesReceived - base.totalSamplesReceived);
			const dJbDelay = Math.max(0, cur.jbDelay - base.jbDelay);
			const dJbEmitted = Math.max(0, cur.jbEmitted - base.jbEmitted);
			const concealmentRatio = dTotalSamples > 0 ? dConcealed / dTotalSamples : 0;
			const jbDelayPerFrameSec = dJbEmitted > 0 ? dJbDelay / dJbEmitted : 0;
			downlinkScore = calcDownlinkAudioVote({ concealmentRatio, jbDelayPerFrameSec });
		}

		return { uplink: uplinkScore, downlink: downlinkScore };
	}

	private calcUplinkScreen(stats: RTCStatsReport): number {
		const now = Date.now();

		stats.forEach((r: RTCStats & { fractionLost?: number }) => {
			// remote-inbound-rtp carries the sender's view of loss (fractionLost 0..1)
			if (r.type === REMOTE_INBOUND_RTP) {
				winPush(this.screenUpLossRing, now, r.fractionLost ?? 0);
			}
		});

		const lossRate =
			this.screenUpLossRing.length > 0
				? this.screenUpLossRing.reduce((s, e) => s + e.data, 0) / this.screenUpLossRing.length
				: 0;

		// bwFpsImpairment: omitted. A reliable fps target under 'bandwidth' limitation requires a
		// rolling max of framesPerSecond observed while unlimited, which is not yet tracked here.
		// Pass undefined (defaults to 0 in the vote function).
		return calcUplinkScreenVote({ lossRate });
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
		const windowSec = Math.max((now - this.screenDownRing[0].ts) / 1000, 0.1);

		const dFreeze = Math.max(0, cur.totalFreezesDuration - base.totalFreezesDuration);
		const dQpSum = Math.max(0, cur.qpSum - base.qpSum);
		const dFrames = Math.max(0, cur.framesDecoded - base.framesDecoded);
		const dPktLost = Math.max(0, cur.packetsLost - base.packetsLost);
		const dPktRecv = Math.max(0, cur.packetsReceived - base.packetsReceived);

		const freezeFraction = dFreeze / windowSec;
		const qp = dFrames > 0 ? dQpSum / dFrames : undefined;
		const lossRate = dPktLost + dPktRecv > 0 ? dPktLost / (dPktLost + dPktRecv) : undefined;

		return calcDownlinkScreenVote({ freezeFraction, qp, lossRate });
	}
}
