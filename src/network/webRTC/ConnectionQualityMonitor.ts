/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import {
	aggregateUplinkQuality,
	audioUplinkVote,
	ConnectionQuality,
	screenUplinkVote,
	UplinkVotes,
	webcamUplinkVote
} from './connectionQualityScore';
import useStore from '../../store/Store';
import {
	IBidirectionalConnectionAudioInOut,
	IScreenOutConnection,
	IVideoOutConnection
} from '../../types/network/webRTC/webRTC';
import { UplinkBreakdown } from '../../types/store/ActiveMeetingTypes';
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

const OUTBOUND_RTP = 'outbound-rtp';
const MEDIA_SOURCE = 'media-source';

const FPS_LOG_DELTA = 5; // minimum |fps - lastLoggedFps| to emit a fps-only log (avoids 30↔31 spam)

// 5-second sliding window for cumulative-delta signals.
const WINDOW_MS = 5000;

type Timed<T> = { ts: number; data: T };

function winPrune<T>(ring: Timed<T>[], now: number): void {
	while (ring.length > 0 && now - ring[0].ts > WINDOW_MS) ring.shift();
}

function winPush<T>(ring: Timed<T>[], ts: number, data: T): void {
	ring.push({ ts, data });
	winPrune(ring, ts);
}

// Number of simulcast rungs the current capture resolution can produce.
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

// Cumulative outbound-rtp state for the webcam sender (aggregated across simulcast rids).
type VideoOutCumulative = {
	framesEncoded: Record<string, number>;
	qldBandwidth: number;
	qldCpu: number;
};

// Cumulative outbound-rtp state for the screen sender.
type ScreenOutCumulative = {
	qldBandwidth: number;
	qldCpu: number;
};

// Previous tick state for audio byte-rate computation.
type AudioPrev = {
	bytesSent: number;
	ts: number;
};

export default class ConnectionQualityMonitor {
	private readonly meetingId: string;

	// My own quality is computed locally and is authoritative for my own tile, so it is written straight
	// to the store immediately (no round-trip). The WS broadcast still carries it to other clients.
	private readonly myUserId: string | undefined;

	private readonly audioConn: IBidirectionalConnectionAudioInOut;

	private readonly videoOut: IVideoOutConnection;

	private readonly screenOut: IScreenOutConnection;

	private intervalId: ReturnType<typeof setInterval> | null = null;

	committed: ConnectionQuality | null = null;

	changedAt = 0;

	private betterStreak = 0;

	// Sliding-window rings for cumulative-delta signals (qualityLimitationDurations).
	private videoOutRing: Timed<VideoOutCumulative>[] = [];

	private screenOutRing: Timed<ScreenOutCumulative>[] = [];

	// Previous-tick state for per-tick deltas.
	private videoOutPrevCum: VideoOutCumulative | null = null;

	private audioPrev: AudioPrev | null = null;

	// Diagnostic: sender change detection for tier log.
	private lastVideoSender: RTCRtpSender | null = null;

	private lastTopActiveRung = -2;

	// null = no baseline yet; set on first fps reading or on tier-change log.
	private lastLoggedFpsUplink: number | null = null;

	constructor(
		meetingId: string,
		audioConn: IBidirectionalConnectionAudioInOut,
		videoOut: IVideoOutConnection,
		screenOut: IScreenOutConnection
	) {
		this.meetingId = meetingId;
		this.myUserId = useStore.getState().session?.id;
		this.audioConn = audioConn;
		this.videoOut = videoOut;
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
		const { sample, level } = await this.computeQuality();
		// bypass hysteresis for the initial broadcast
		this.committed = level;
		this.changedAt = Math.max(Date.now(), this.changedAt + 1);
		useStore.getState().setConnectionScoreDetail(sample);
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
		const { sample, level } = await this.computeQuality();
		const { next, streak, changed } = stepHysteresis(level, this.committed, this.betterStreak);
		this.betterStreak = streak;
		useStore.getState().setConnectionScoreDetail(sample);
		const tierChanged = this.lastTopActiveRung !== prevTier;
		if (changed || tierChanged) {
			if (changed) {
				this.committed = next;
				this.changedAt = Math.max(Date.now(), this.changedAt + 1);
			}
			wsClient.sendConnectionStatusUpdate(
				this.meetingId,
				this.committed ?? next,
				this.changedAt,
				this.currentMaxTier()
			);
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

	// Uplink-only quality: one vote per PUBLISHED stream, aggregated by importance weight.
	// ICE/presence gating: inactive streams are OMITTED from votes — never injected as 10 or 0.
	private async computeQuality(): Promise<{ sample: UplinkBreakdown; level: ConnectionQuality }> {
		const audioState = this.audioConn.peerConn?.connectionState;
		const iceConnected = !audioState || !['failed', 'disconnected', 'closed'].includes(audioState);

		// Presence gates — an inactive stream is entirely omitted from the vote set.
		const webcamActive = this.videoOut.rtpSender != null;
		const screenActive = this.screenOut.rtpSender != null;
		const audioActive = this.audioConn.rtpSender?.track?.enabled === true;

		const now = Date.now();

		const [audioStats, videoUpStats, screenUpStats] = await Promise.all([
			this.safeStats(this.audioConn.peerConn),
			webcamActive ? this.safeStats(this.videoOut.rtpSender) : Promise.resolve(null),
			screenActive ? this.safeStats(this.screenOut.rtpSender) : Promise.resolve(null)
		]);

		const votes: UplinkVotes = {};

		if (webcamActive && videoUpStats != null) {
			votes.webcam = this.computeWebcamVote(videoUpStats, now);
		} else {
			this.videoOutRing = [];
			this.videoOutPrevCum = null;
		}

		if (screenActive && screenUpStats != null) {
			votes.screen = this.computeScreenVote(screenUpStats, now);
		} else {
			this.screenOutRing = [];
		}

		if (audioActive && audioStats != null) {
			const audioVote = this.computeAudioVote(audioStats, now);
			if (audioVote !== undefined) votes.audio = audioVote;
		} else {
			this.audioPrev = null;
		}

		const level = aggregateUplinkQuality(votes, iceConnected);
		// Only include keys that are present in votes — absent key means the stream is inactive.
		const sample: UplinkBreakdown = {};
		if (votes.webcam !== undefined) sample.webcam = votes.webcam;
		if (votes.screen !== undefined) sample.screen = votes.screen;
		if (votes.audio !== undefined) sample.audio = votes.audio;

		return { sample, level };
	}

	private computeWebcamVote(stats: RTCStatsReport, now: number): number {
		// Reset accumulated state when the sender changes (new camera started).
		if (this.videoOut.rtpSender !== this.lastVideoSender) {
			this.videoOutRing = [];
			this.videoOutPrevCum = null;
			this.lastTopActiveRung = -2;
			this.lastLoggedFpsUplink = null;
			this.lastVideoSender = this.videoOut.rtpSender;
		}

		const cum: VideoOutCumulative = { framesEncoded: {}, qldBandwidth: 0, qldCpu: 0 };
		const ridToIndex: Record<string, number> = { l: 0, m: 1, h: 2 };
		const ridFps: Record<string, number> = {};

		stats.forEach(
			(
				r: RTCStats & {
					rid?: string;
					framesEncoded?: number;
					qualityLimitationDurations?: Record<string, number>;
					framesPerSecond?: number;
					scalabilityMode?: string;
				}
			) => {
				if (r.type !== OUTBOUND_RTP) return;
				const rid = r.rid ?? '';
				if (r.framesEncoded != null) cum.framesEncoded[rid] = r.framesEncoded;
				cum.qldBandwidth += r.qualityLimitationDurations?.bandwidth ?? 0;
				cum.qldCpu += r.qualityLimitationDurations?.cpu ?? 0;
				if (r.framesPerSecond != null) ridFps[rid] = r.framesPerSecond;
			}
		);

		// topActiveRung: highest rid with Δframing > 0 relative to the previous tick.
		const prevCum = this.videoOutPrevCum;
		this.videoOutPrevCum = cum;

		let topActiveRung = -1;
		Object.entries(cum.framesEncoded).forEach(([rid, currentFrames]) => {
			const prevFrames = prevCum?.framesEncoded[rid] ?? 0;
			if (currentFrames > prevFrames) {
				const idx = ridToIndex[rid] ?? -1;
				if (idx > topActiveRung) topActiveRung = idx;
			}
		});

		// Published fps of the top active rid (for log context).
		const indexToRid: Record<number, string> = { 0: 'l', 1: 'm', 2: 'h' };
		const topFps = topActiveRung >= 0 ? (ridFps[indexToRid[topActiveRung]] ?? 0) : 0;

		// Diagnostic log on tier change; fps-only log when fps moves >= FPS_LOG_DELTA.
		if (topActiveRung !== this.lastTopActiveRung) {
			const tierName = (r: number): string => ['low', 'medium', 'high'][r] ?? 'none';
			rtcDebug(
				`UPLINK WEBCAM CHANGE: ${tierName(this.lastTopActiveRung)} -> ${tierName(topActiveRung)} @${Math.round(topFps)}fps`
			);
			this.lastTopActiveRung = topActiveRung;
			this.lastLoggedFpsUplink = topFps;
		} else if (topFps > 0) {
			if (this.lastLoggedFpsUplink === null) {
				this.lastLoggedFpsUplink = topFps; // establish baseline on first reading, no log
			} else if (Math.abs(topFps - this.lastLoggedFpsUplink) >= FPS_LOG_DELTA) {
				rtcDebug(
					`UPLINK WEBCAM FPS: ${Math.round(this.lastLoggedFpsUplink)} -> ${Math.round(topFps)}fps`
				);
				this.lastLoggedFpsUplink = topFps;
			}
		}

		// bandwidthLimited: Δbandwidth > Δcpu AND Δbandwidth > 0 over the 5 s window.
		const oldestCum = this.videoOutRing[0]?.data;
		winPush(this.videoOutRing, now, cum);
		const dBandwidth = cum.qldBandwidth - (oldestCum?.qldBandwidth ?? cum.qldBandwidth);
		const dCpu = cum.qldCpu - (oldestCum?.qldCpu ?? cum.qldCpu);
		const bandwidthLimited = dBandwidth > dCpu && dBandwidth > 0;

		const track = this.videoOut.rtpSender?.track;
		const captureHeight =
			track && typeof track.getSettings === 'function' ? (track.getSettings().height ?? 0) : 0;
		const producibleRungs = producibleRungsFor(
			captureHeight,
			useStore.getState().session.attributes?.videoSimulcastTiers
		);

		return webcamUplinkVote({ producibleRungs, topActiveRung, bandwidthLimited });
	}

	private computeScreenVote(stats: RTCStatsReport, now: number): number {
		const cum: ScreenOutCumulative = { qldBandwidth: 0, qldCpu: 0 };
		let encodedFps = 0;

		stats.forEach(
			(
				r: RTCStats & {
					framesPerSecond?: number;
					qualityLimitationDurations?: Record<string, number>;
				}
			) => {
				if (r.type !== OUTBOUND_RTP) return;
				encodedFps = r.framesPerSecond ?? encodedFps;
				cum.qldBandwidth += r.qualityLimitationDurations?.bandwidth ?? 0;
				cum.qldCpu += r.qualityLimitationDurations?.cpu ?? 0;
			}
		);

		const oldestCum = this.screenOutRing[0]?.data;
		winPush(this.screenOutRing, now, cum);
		const dBandwidth = cum.qldBandwidth - (oldestCum?.qldBandwidth ?? cum.qldBandwidth);
		const dCpu = cum.qldCpu - (oldestCum?.qldCpu ?? cum.qldCpu);
		const bandwidthLimited = dBandwidth > dCpu && dBandwidth > 0;

		const captureFps =
			this.screenOut.rtpSender?.track != null &&
			typeof this.screenOut.rtpSender.track.getSettings === 'function'
				? this.screenOut.rtpSender.track.getSettings().frameRate
				: undefined;

		return screenUplinkVote({ bandwidthLimited, captureFps, encodedFps });
	}

	// Returns undefined when no meaningful kbps can be computed yet (first tick, no targetBitrate).
	private computeAudioVote(stats: RTCStatsReport, now: number): number | undefined {
		let speaking = false;
		let targetBitrateKbps: number | undefined;
		let bytesSent = 0;

		stats.forEach(
			(
				r: RTCStats & {
					kind?: string;
					audioLevel?: number;
					bytesSent?: number;
					targetBitrate?: number;
				}
			) => {
				if (r.type === MEDIA_SOURCE && r.kind === 'audio') {
					speaking = (r.audioLevel ?? 0) > 0.05;
				}
				if (r.type === OUTBOUND_RTP && r.kind === 'audio') {
					bytesSent = r.bytesSent ?? bytesSent;
					if (r.targetBitrate != null) targetBitrateKbps = r.targetBitrate / 1000;
				}
			}
		);

		let actualKbps: number | undefined;
		const prev = this.audioPrev;
		this.audioPrev = { bytesSent, ts: now };

		if (prev != null) {
			const dtSec = Math.max(0.001, (now - prev.ts) / 1000);
			const bytesKbps = (Math.max(0, bytesSent - prev.bytesSent) * 8) / 1000 / dtSec;
			actualKbps =
				targetBitrateKbps !== undefined ? Math.min(targetBitrateKbps, bytesKbps) : bytesKbps;
		} else {
			// First tick: use targetBitrate alone if available; skip the vote otherwise.
			actualKbps = targetBitrateKbps;
		}

		if (actualKbps === undefined) return undefined;

		return audioUplinkVote({ speaking, actualKbps });
	}
}
