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
			this.videoPrev.bytesSent = {};
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

		return calcUplinkWebcamVote({ producibleRungs, topActiveRung, limited });
	}

	// Audio up and down are scored from getStats: inbound-rtp for the downlink mix (loss/concealment/
	// jitter) and the far end's remote-inbound-rtp report for the uplink (fractionLost). Which of the two
	// is actually included is decided by the caller from app state (mic on / others present); until a
	// direction has real samples the numbers default to clean.
	private calcAudioVotes(stats: RTCStatsReport): { uplink: number; downlink: number } {
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

					this.audioPrev.packetsLost = lost;
					this.audioPrev.packetsReceived = recv;
					this.audioPrev.concealedSamples = concealed;
					this.audioPrev.totalSamplesReceived = totalSamples;
				}
				if (r.type === 'remote-inbound-rtp' && r.kind === 'audio') {
					upLossRate = r.fractionLost ?? 0;
				}
			}
		);

		return {
			uplink: calcUplinkAudioVote({ lossRate: upLossRate }),
			downlink: calcDownlinkAudioVote({ lossRate: downLossRate, concealmentRatio, jitterMs })
		};
	}

	private calcUplinkScreen(stats: RTCStatsReport): number {
		let lossRate = 0;

		stats.forEach((r: RTCStats & { fractionLost?: number }) => {
			// remote-inbound-rtp carries the sender's view of loss (fractionLost 0..1)
			if (r.type === 'remote-inbound-rtp') {
				lossRate = Math.max(lossRate, r.fractionLost ?? 0);
			}
		});

		return calcUplinkScreenVote({ lossRate });
	}

	private calcDownlinkScreen(stats: RTCStatsReport): number {
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

		return calcDownlinkScreenVote({ lossRate, freezesPerMin });
	}
}
