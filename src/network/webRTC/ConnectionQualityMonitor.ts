/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { computeConnectionQuality, ConnectionQuality, LinkSample } from './connectionQualityScore';
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
const REMOTE_OUTBOUND_RTP = 'remote-outbound-rtp';
const OUTBOUND_RTP = 'outbound-rtp';
const CANDIDATE_PAIR = 'candidate-pair';

// 5-second sliding window. Loss is smoothed over it and RTT is a windowed mean; hysteresis (below)
// only debounces the committed level.
const WINDOW_MS = 5000;
// Minimum forwarded packets in a tick's delta before we trust a downlink-loss ratio (noise floor).
const MIN_DOWNLINK_SAMPLES = 5;

type Timed<T> = { ts: number; data: T };

function winPrune<T>(ring: Timed<T>[], now: number): void {
	while (ring.length > 0 && now - ring[0].ts > WINDOW_MS) ring.shift();
}

// Push a sample then drop anything older than the window (keeps the just-pushed entry).
function winPush<T>(ring: Timed<T>[], ts: number, data: T): void {
	ring.push({ ts, data });
	winPrune(ring, ts);
}

const ringMean = (ring: Timed<number>[]): number =>
	ring.reduce((s, e) => s + e.data, 0) / ring.length;

// The Janus RTCP-SR escape for clean per-leg DOWNLINK loss. Janus strips each publisher's SR and
// generates its OWN per-subscriber SR whose packet count is what it actually forwarded to ME; the
// browser surfaces that as remote-outbound-rtp.packetsSent. So (forwarded - received)/forwarded is the
// Janus->me loss, immune to the publisher's own uplink loss (which is neither in packetsSent nor does it
// reduce packetsReceived). Pooled over every received stream that has a paired SR. NEVER use
// inbound-rtp.packetsLost: Janus forwards publisher seqnums with a linear offset, so its gaps leak the
// publisher's uplink loss into ours.
function poolSrEscape(stats: RTCStatsReport): { sent: number; recv: number } {
	const forwarded = new Map<string, number>();
	const received: Array<{ remoteId?: string; recv: number }> = [];
	stats.forEach(
		(r: RTCStats & { remoteId?: string; packetsSent?: number; packetsReceived?: number }) => {
			if (r.type === REMOTE_OUTBOUND_RTP) forwarded.set(r.id, r.packetsSent ?? 0);
			if (r.type === INBOUND_RTP) {
				received.push({ remoteId: r.remoteId, recv: r.packetsReceived ?? 0 });
			}
		}
	);
	let sent = 0;
	let recv = 0;
	received.forEach((inb) => {
		if (inb.remoteId != null && forwarded.has(inb.remoteId)) {
			sent += forwarded.get(inb.remoteId) ?? 0;
			recv += inb.recv;
		}
	});
	return { sent, recv };
}

// Worst uplink fractionLost (0..1) across the remote-inbound reports in a stats set — Janus's view of
// loss on MY send leg (always clean: me->Janus, no other participant involved). Undefined if I sent
// nothing (no remote-inbound report).
function readMaxFractionLost(stats: RTCStatsReport): number | undefined {
	let worst: number | undefined;
	stats.forEach((r: RTCStats & { fractionLost?: number }) => {
		if (r.type === REMOTE_INBOUND_RTP && r.fractionLost != null) {
			worst = worst === undefined ? r.fractionLost : Math.max(worst, r.fractionLost);
		}
	});
	return worst;
}

// Number of simulcast rungs the current capture resolution can produce (for the uplink tier log).
function producibleRungsFor(captureHeight: number, tiers?: Array<{ height: number }>): number {
	if (tiers && tiers.length > 0) return tiers.filter((t) => captureHeight >= t.height).length;
	if (captureHeight >= 720) return 3;
	if (captureHeight >= 360) return 2;
	return 1;
}

// Exported for testing: next committed level given the raw level and the previous committed level.
// Worse commits immediately; better needs 3 consecutive ticks; 'lost' is instant either way.
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
		return { next: raw, streak: 0, changed: true };
	}
	if (rawRank > committedRank) {
		const newStreak = betterStreak + 1;
		if (newStreak >= 3) {
			return { next: raw, streak: 0, changed: true };
		}
		return { next: committed, streak: newStreak, changed: false };
	}
	return { next: committed, streak: 0, changed: false };
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

	// candidate-pair currentRoundTripTime (ms) samples — the me<->Janus round-trip, windowed mean.
	private rttRing: Timed<number>[] = [];

	// worst uplink fractionLost across my sent streams (audio/video/screen), per tick, windowed mean.
	private uplinkLossRing: Timed<number>[] = [];

	// per-tick downlink loss ratio from the SR escape, windowed mean.
	private downlinkLossRing: Timed<number>[] = [];

	// previous pooled SR counters, for the per-tick downlink delta.
	private prevDownPool: { sent: number; recv: number } | null = null;

	// diagnostic-only uplink simulcast tier tracking: framesEncoded per rid + last logged top rung.
	private videoFramesEncoded: Record<string, number> = {};

	private lastTopActiveRung = -2;

	private lastVideoSender: RTCRtpSender | null = null;

	constructor(
		meetingId: string,
		audioConn: IBidirectionalConnectionAudioInOut,
		videoOut: IVideoOutConnection,
		videoIn: IVideoScreenInConnection,
		screenOut: IScreenOutConnection
	) {
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

	// Re-assert my own quality straight into the store. Idempotent thanks to the setter's changedAt guard.
	private applyLocalQuality(level: ConnectionQuality): void {
		if (this.myUserId == null) return;
		useStore
			.getState()
			.setParticipantConnectionQuality(this.meetingId, this.myUserId, level, this.changedAt);
	}

	async emitInitial(): Promise<void> {
		const { sample, level } = await this.computeQuality();
		// bypass hysteresis for the initial broadcast
		this.committed = level;
		this.changedAt = Math.max(Date.now(), this.changedAt + 1);
		useStore.getState().setConnectionScoreDetail(sample);
		wsClient.sendConnectionScore(this.meetingId, level, this.changedAt);
		this.applyLocalQuality(level);
	}

	async resyncTo(userId: string): Promise<void> {
		if (this.committed == null) {
			await this.emitInitial();
		}
		if (this.committed != null) {
			wsClient.sendConnectionScore(this.meetingId, this.committed, this.changedAt, userId);
		}
	}

	rebroadcast(): void {
		if (this.committed != null) {
			wsClient.sendConnectionScore(this.meetingId, this.committed, this.changedAt);
		}
	}

	private async evaluate(): Promise<void> {
		const { sample, level } = await this.computeQuality();
		const { next, streak, changed } = stepHysteresis(level, this.committed, this.betterStreak);
		this.betterStreak = streak;
		useStore.getState().setConnectionScoreDetail(sample);
		if (changed) {
			this.committed = next;
			this.changedAt = Math.max(Date.now(), this.changedAt + 1);
			wsClient.sendConnectionScore(this.meetingId, this.committed ?? next, this.changedAt);
		}
		this.applyLocalQuality(next);
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

	// The whole measurement: RTT + loss on MY legs to Janus only. iceConnected from the always-up audio
	// PC. loss = max(uplink fractionLost, downlink SR-escape). Nothing app-state driven — muted/idle legs
	// simply produce no packets and drop out of the loss aggregation.
	private async computeQuality(): Promise<{ sample: LinkSample; level: ConnectionQuality }> {
		const audioState = this.audioConn.peerConn?.connectionState;
		const iceConnected = !audioState || !['failed', 'disconnected', 'closed'].includes(audioState);

		const now = Date.now();
		const audioStats = await this.safeStats(this.audioConn.peerConn);
		const videoUpStats = await this.safeStats(this.videoOut.rtpSender);
		const screenUpStats = await this.safeStats(this.screenOut.rtpSender);
		const videoInStats = await this.safeStats(this.videoIn.peerConn);

		// diagnostic side-effect: log uplink simulcast tier changes (downlink is logged in VideoScreenIn)
		if (videoUpStats != null) this.logUplinkWebcamTier(videoUpStats);

		const rttMs = audioStats != null ? this.readRttMs(audioStats) : undefined;

		// uplink loss: worst fractionLost across my sent legs (audio/video/screen)
		const tickUplink = [audioStats, videoUpStats, screenUpStats]
			.map((s) => (s != null ? readMaxFractionLost(s) : undefined))
			.filter((v): v is number => v !== undefined);
		const lossUp = this.windowUplinkLoss(
			tickUplink.length > 0 ? Math.max(...tickUplink) : undefined,
			now
		);

		// downlink loss: pooled SR-escape over the streams I receive (audio mix + video/screen feeds)
		const pools = [audioStats, videoInStats]
			.filter((s): s is RTCStatsReport => s != null)
			.map((s) => poolSrEscape(s));
		const poolSent = pools.reduce((acc, p) => acc + p.sent, 0);
		const poolRecv = pools.reduce((acc, p) => acc + p.recv, 0);
		const lossDown = this.windowDownlinkLoss(poolSent, poolRecv, now);

		const sample: LinkSample = { rttMs, lossUp, lossDown };
		return { sample, level: computeConnectionQuality(sample, iceConnected) };
	}

	// Smoothed worst uplink fractionLost; undefined once I have sent nothing within the window.
	private windowUplinkLoss(tick: number | undefined, now: number): number | undefined {
		if (tick !== undefined) winPush(this.uplinkLossRing, now, tick);
		else winPrune(this.uplinkLossRing, now);
		return this.uplinkLossRing.length > 0 ? ringMean(this.uplinkLossRing) : undefined;
	}

	// Per-tick SR-escape delta (handles the ~1 Hz SR cadence and stream-set changes), smoothed over the
	// window; undefined once I have received nothing measurable.
	private windowDownlinkLoss(poolSent: number, poolRecv: number, now: number): number | undefined {
		const prev = this.prevDownPool;
		this.prevDownPool = { sent: poolSent, recv: poolRecv };
		const dSent = prev != null ? Math.max(0, poolSent - prev.sent) : 0;
		if (prev != null && dSent >= MIN_DOWNLINK_SAMPLES) {
			const dRecv = Math.max(0, poolRecv - prev.recv);
			winPush(this.downlinkLossRing, now, Math.max(0, Math.min(1, (dSent - dRecv) / dSent)));
		} else {
			winPrune(this.downlinkLossRing, now);
		}
		return this.downlinkLossRing.length > 0 ? ringMean(this.downlinkLossRing) : undefined;
	}

	// Diagnostic only (not part of the score): log uplink simulcast tier changes — the top layer the
	// encoder is actually producing (framesEncoded is the reliable signal; RTX/padding keep bytes flowing
	// on GCC-disabled layers). Mirrors the downlink tier log in VideoScreenInConnection.
	private logUplinkWebcamTier(stats: RTCStatsReport): void {
		if (this.videoOut.rtpSender !== this.lastVideoSender) {
			this.videoFramesEncoded = {};
			this.lastTopActiveRung = -2;
			this.lastVideoSender = this.videoOut.rtpSender;
		}
		const track = this.videoOut.rtpSender?.track;
		const captureHeight =
			track && typeof track.getSettings === 'function' ? (track.getSettings().height ?? 0) : 0;
		const producibleRungs = producibleRungsFor(
			captureHeight,
			useStore.getState().session.attributes?.videoSimulcastTiers
		);

		const ridToIndex: Record<string, 0 | 1 | 2> = { l: 0, m: 1, h: 2 };
		let topActiveRung = -1;
		const scal: Record<string, string> = {};
		stats.forEach(
			(
				r: RTCStats & {
					rid?: string;
					framesEncoded?: number;
					framesPerSecond?: number;
					scalabilityMode?: string;
					active?: boolean;
				}
			) => {
				if (r.type !== OUTBOUND_RTP) return;
				const rid = r.rid ?? '';
				const idx = ridToIndex[rid];
				if (idx == null) return;
				scal[rid] = `${r.scalabilityMode ?? '?'}@${Math.round(r.framesPerSecond ?? 0)}fps`;
				const prevFrames = this.videoFramesEncoded[rid] ?? 0;
				const currentFrames = r.framesEncoded ?? 0;
				this.videoFramesEncoded[rid] = currentFrames;
				if (r.active !== false && currentFrames > prevFrames && idx > topActiveRung) {
					topActiveRung = idx;
				}
			}
		);

		if (topActiveRung === this.lastTopActiveRung) return;
		const tierName = (r: number): string => ['low', 'medium', 'high'][r] ?? 'none';
		const ridName: Record<string, string> = { h: 'high', m: 'medium', l: 'low' };
		const bestPossible = producibleRungs > 0 ? tierName(producibleRungs - 1) : 'none';
		const temporal = Object.keys(scal)
			.map((r) => `${ridName[r] ?? r}:${scal[r]}`)
			.join(' ');
		rtcDebug(
			`UPLINK WEBCAM CHANGE: best tier possible ${bestPossible}, uploaded ${tierName(this.lastTopActiveRung)} -> ${tierName(topActiveRung)} | temporal ${temporal}`
		);
		this.lastTopActiveRung = topActiveRung;
	}

	// RTT (ms) from the selected candidate-pair of the always-up audio PC — the whole me<->Janus
	// round-trip, averaged over the window. Ours alone: other participants have separate pipes to Janus.
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
		return ringMean(this.rttRing);
	}
}
