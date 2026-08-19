/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import {
	aggregateQuality,
	audioVote,
	ConnectionQuality,
	screenshareVote,
	StreamVotes,
	webcamDownVote,
	webcamUpVote
} from './connectionQualityScore';
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

type AudioPrevStats = {
	packetsLost: number;
	packetsReceived: number;
	concealedSamples: number;
	totalSamplesReceived: number;
};

type ScreenPrevStats = {
	packetsLost: number;
	packetsReceived: number;
	freezeCount: number;
};

type VideoPrevStats = {
	bytesSent: Record<string, number>;
};

// Exported for testing: determines the next committed quality level given the current raw level and
// the previous committed level. Returns the new committed level (may be unchanged) and the updated
// betterStreak counter.
export function stepHysteresis(
	raw: ConnectionQuality,
	committed: ConnectionQuality | null,
	betterStreak: number
): { next: ConnectionQuality | null; streak: number; changed: boolean } {
	if (committed == null) {
		return { next: raw, streak: 0, changed: true };
	}
	if (raw === 'lost') {
		const changed = committed !== 'lost';
		return { next: 'lost', streak: 0, changed };
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

	private readonly audioConn: IBidirectionalConnectionAudioInOut;

	private readonly videoOut: IVideoOutConnection;

	private readonly videoIn: IVideoScreenInConnection;

	private readonly screenOut: IScreenOutConnection;

	private intervalId: ReturnType<typeof setInterval> | null = null;

	committed: ConnectionQuality | null = null;

	changedAt = 0;

	private betterStreak = 0;

	private audioPrev: AudioPrevStats = {
		packetsLost: 0,
		packetsReceived: 0,
		concealedSamples: 0,
		totalSamplesReceived: 0
	};

	private screenPrev: ScreenPrevStats = {
		packetsLost: 0,
		packetsReceived: 0,
		freezeCount: 0
	};

	private videoPrev: VideoPrevStats = { bytesSent: {} };

	constructor(
		meetingId: string,
		audioConn: IBidirectionalConnectionAudioInOut,
		videoOut: IVideoOutConnection,
		videoIn: IVideoScreenInConnection,
		screenOut: IScreenOutConnection
	) {
		this.meetingId = meetingId;
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

	async emitInitial(): Promise<void> {
		const level = await this.computeQuality();
		// bypass hysteresis for the initial broadcast
		this.committed = level;
		this.changedAt = Date.now();
		wsClient.sendConnectionQuality(this.meetingId, level, this.changedAt);
	}

	async resyncTo(userId: string): Promise<void> {
		if (this.committed == null) {
			await this.emitInitial();
		}
		if (this.committed != null) {
			wsClient.sendConnectionQuality(this.meetingId, this.committed, this.changedAt, userId);
		}
	}

	private async evaluate(): Promise<void> {
		const level = await this.computeQuality();
		const { next, streak, changed } = stepHysteresis(level, this.committed, this.betterStreak);
		this.betterStreak = streak;
		if (next != null && changed) {
			this.committed = next;
			this.changedAt = Date.now();
			wsClient.sendConnectionQuality(this.meetingId, next, this.changedAt);
		} else if (next != null) {
			this.committed = next;
		}
	}

	private async computeQuality(): Promise<ConnectionQuality> {
		const votes: StreamVotes = {};

		// iceConnected: audio PC connection state must not be failed/disconnected/closed
		const audioState = this.audioConn.peerConn?.connectionState;
		const iceConnected = !audioState || !['failed', 'disconnected', 'closed'].includes(audioState);

		// webcamUp: only if we have an active video sender
		if (this.videoOut.rtpSender != null) {
			try {
				const stats = await this.videoOut.rtpSender.getStats();
				votes.webcamUp = this.computeWebcamUp(stats);
			} catch {
				// defensive: browser may refuse getStats when PC is closing; omit the vote
			}
		}

		// webcamDown: from the in-connection's per-feed quality states
		const videoFeeds = this.videoIn.getVideoFeedsForQuality();
		if (videoFeeds.length > 0) {
			votes.webcamDown = webcamDownVote(videoFeeds);
		}

		// audio: always active in a meeting
		try {
			if (this.audioConn.peerConn != null) {
				const stats = await this.audioConn.peerConn.getStats();
				votes.audio = this.computeAudioVote(stats);
			} else {
				votes.audio = audioVote({
					downLossRate: 0,
					concealmentRatio: 0,
					jitterMs: 0,
					upLossRate: 0
				});
			}
		} catch {
			votes.audio = audioVote({ downLossRate: 0, concealmentRatio: 0, jitterMs: 0, upLossRate: 0 });
		}

		// screenshare: active if I'm sending OR receiving a screen feed
		const isSendingScreen = this.screenOut.rtpSender != null;
		const isReceivingScreen = this.videoIn.hasScreenFeed();
		if (isSendingScreen || isReceivingScreen) {
			try {
				if (isSendingScreen) {
					const stats = await this.screenOut.rtpSender!.getStats();
					votes.screenshare = this.computeScreenshareOutVote(stats);
				} else {
					const receiver = this.videoIn.getScreenReceiver();
					if (receiver != null) {
						const stats = await receiver.getStats();
						votes.screenshare = this.computeScreenshareInVote(stats);
					}
				}
			} catch {
				// defensive: omit screenshare vote on error
			}
		}

		return aggregateQuality(votes, iceConnected);
	}

	private computeWebcamUp(stats: RTCStatsReport): number {
		const track = this.videoOut.rtpSender?.track;
		let producibleRungs = 1;
		if (track && typeof (track as MediaStreamTrack).getSettings === 'function') {
			const height = (track as MediaStreamTrack).getSettings().height ?? 0;
			if (height >= 720) producibleRungs = 3;
			else if (height >= 360) producibleRungs = 2;
		}

		const ridToIndex: Record<string, 0 | 1 | 2> = { l: 0, m: 1, h: 2 };
		let topActiveRung = -1;
		let limited = false;

		stats.forEach(
			(
				r: RTCStats & {
					rid?: string;
					bytesSent?: number;
					active?: boolean;
					qualityLimitationReason?: string;
				}
			) => {
				if (r.type !== 'outbound-rtp') return;
				if (r.qualityLimitationReason === 'bandwidth' || r.qualityLimitationReason === 'cpu') {
					limited = true;
				}
				const rid = r.rid ?? '';
				const idx = ridToIndex[rid];
				if (idx == null) return;
				const prevBytes = this.videoPrev.bytesSent[rid] ?? 0;
				const currentBytes = r.bytesSent ?? 0;
				this.videoPrev.bytesSent[rid] = currentBytes;
				const growing = currentBytes > prevBytes;
				if (r.active !== false && growing && idx > topActiveRung) {
					topActiveRung = idx;
				}
			}
		);

		return webcamUpVote({ producibleRungs, topActiveRung, limited });
	}

	private computeAudioVote(stats: RTCStatsReport): number {
		let downLossRate = 0;
		let concealmentRatio = 0;
		let jitterMs = 0;
		let upLossRate = 0;

		stats.forEach(
			(
				r: RTCStats & {
					kind?: string;
					packetsLost?: number;
					packetsReceived?: number;
					concealedSamples?: number;
					totalSamplesReceived?: number;
					jitter?: number;
					fractionLost?: number;
				}
			) => {
				if (r.type === 'inbound-rtp' && r.kind === 'audio') {
					const lost = r.packetsLost ?? 0;
					const recv = r.packetsReceived ?? 0;
					const concealed = r.concealedSamples ?? 0;
					const totalSamples = r.totalSamplesReceived ?? 0;

					const dConcealed = Math.max(0, concealed - this.audioPrev.concealedSamples);
					const dTotalSamples = Math.max(0, totalSamples - this.audioPrev.totalSamplesReceived);

					downLossRate = deltaLossRate(
						lost,
						recv,
						this.audioPrev.packetsLost,
						this.audioPrev.packetsReceived
					);
					concealmentRatio = dTotalSamples > 0 ? dConcealed / dTotalSamples : 0;
					jitterMs = (r.jitter ?? 0) * 1000;

					this.audioPrev = {
						packetsLost: lost,
						packetsReceived: recv,
						concealedSamples: concealed,
						totalSamplesReceived: totalSamples
					};
				}
				if (r.type === 'remote-inbound-rtp' && r.kind === 'audio') {
					upLossRate = r.fractionLost ?? 0;
				}
			}
		);

		return audioVote({ downLossRate, concealmentRatio, jitterMs, upLossRate });
	}

	private computeScreenshareOutVote(stats: RTCStatsReport): number {
		let lossRate = 0;

		stats.forEach(
			(
				r: RTCStats & {
					fractionLost?: number;
					kind?: string;
				}
			) => {
				// remote-inbound-rtp carries the sender's view of loss (fractionLost 0..1)
				if (r.type === 'remote-inbound-rtp') {
					lossRate = Math.max(lossRate, r.fractionLost ?? 0);
				}
			}
		);

		return screenshareVote({ lossRate, freezesPerMin: 0 });
	}

	private computeScreenshareInVote(stats: RTCStatsReport): number {
		let lossRate = 0;
		let freezesPerMin = 0;

		stats.forEach(
			(
				r: RTCStats & {
					kind?: string;
					packetsLost?: number;
					packetsReceived?: number;
					freezeCount?: number;
				}
			) => {
				if (r.type === 'inbound-rtp' && r.kind === 'video') {
					const lost = r.packetsLost ?? 0;
					const recv = r.packetsReceived ?? 0;
					const freeze = r.freezeCount ?? 0;

					lossRate = deltaLossRate(
						lost,
						recv,
						this.screenPrev.packetsLost,
						this.screenPrev.packetsReceived
					);
					const dFreeze = Math.max(0, freeze - this.screenPrev.freezeCount);
					// tick is 2 s → ×30 to scale to per-minute
					freezesPerMin = dFreeze * 30;

					this.screenPrev = { packetsLost: lost, packetsReceived: recv, freezeCount: freeze };
				}
			}
		);

		return screenshareVote({ lossRate, freezesPerMin });
	}
}
