/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export type ConnectionQuality = 'lost' | 'terrible' | 'poor' | 'medium' | 'high' | 'optimal';

const clamp01 = (x: number): number => Math.max(0, Math.min(1, x));
const round1 = (x: number): number => Math.round(x * 10) / 10;
const avg = (xs: number[]): number => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

// Every stream vote is DEGRADATION x delay(rtt, w): a degradation signal specific to the stream,
// scaled by a per-stream RTT delay factor. Two disjoint mechanisms, never counted twice: the
// degradation is a MEASURED OUTCOME where we can see it (concealment/loss/freeze — already containing
// RTT's recovery damage) or the adaptation loop's output where we can't (webcam tier); the delay
// factor is the separate INTERACTIVITY cost (clean media arriving late), which has no media footprint
// and can only be read from RTT. Latency matters everywhere, weighted by how much it hurts the medium
// (never zero). Loss/RTT are always measured on OUR OWN leg to Janus. Every constant is empirical/tunable.

// RTT delay factor: 1 at good RTT (no penalty), falling toward (1 - weight) at bad RTT along a convex
// knee (E-model Id shape). weight = how much latency matters for this medium. rttMs undefined -> 1.
const RTT_GOOD_MS = 200;
const RTT_BAD_MS = 700;
const W_AUDIO_DOWN = 1.0; // hearing others late breaks turn-taking — the harshest latency cost
const W_AUDIO_UP = 0.6; // my voice reaching others late — same round-trip as audio down, so weighted below it
const W_WEBCAM = 0.3; // video late = lip-sync/reaction lag — real but far milder than audio
const W_SCREEN = 0.15; // presentation, mostly non-interactive — smallest, but never zero (remote control)

export function delayFactor(rttMs: number | undefined, weight: number): number {
	if (rttMs === undefined) return 1;
	const x = clamp01((RTT_BAD_MS - rttMs) / (RTT_BAD_MS - RTT_GOOD_MS));
	return 1 - weight * (1 - x * x);
}

export function activeAudioKbps(i: {
	payloadBytesDelta: number;
	packetsDelta: number;
}): number | undefined {
	const OPUS_PACKETS_PER_SEC = 50; // 20 ms Opus ptime; our stack never renegotiates it
	if (i.packetsDelta <= 0) return undefined;
	const bytesPerPacket = i.payloadBytesDelta / i.packetsDelta;
	return (bytesPerPacket * OPUS_PACKETS_PER_SEC * 8) / 1000;
}

// Opus mono-voice fidelity curve: encoded kbps -> how good the voice sounds. Concave (log): the bottom
// of the range carries far more perceptual change per kbps than the top. FLOOR = Opus useful floor (0);
// TRANSPARENT = no further perceptual gain from more bits for mono voice (1).
const AUDIO_FLOOR_KBPS = 6;
const AUDIO_TRANSPARENT_KBPS = 24;
export function audioQualityFactor(activeKbps: number): number {
	return clamp01(
		Math.log(activeKbps / AUDIO_FLOOR_KBPS) / Math.log(AUDIO_TRANSPARENT_KBPS / AUDIO_FLOOR_KBPS)
	);
}

// Audio uplink — fidelity from OUR encoded bitrate, but ARMED only when the BWE says the network is
// capping the send rate (networkConstrained). A low bitrate on a clean link is just VBR being efficient
// on easy speech, not degradation -> fidelity ceiling. Silence (activeKbps undefined) -> ceiling too.
// Then x the uplink delay factor (my voice reaching others late).
export function calcUplinkAudioVote(i: {
	activeKbps?: number;
	networkConstrained?: boolean;
	rttMs?: number;
}): number {
	const fidelity =
		i.activeKbps !== undefined && i.networkConstrained ? audioQualityFactor(i.activeKbps) : 1;
	return round1(10 * fidelity * delayFactor(i.rttMs, W_AUDIO_UP));
}

// Audio downlink — loss/concealment on our own leg is the degradation (a measured outcome, already
// folding loss + jitter + late-discards). Exponential decay (IQX / E-model shape): quality collapses
// early then flattens. Then x the full conversational delay factor.
const AUDIO_LOSS_K = 6;
export function calcDownlinkAudioVote(i: { lossRate: number; rttMs?: number }): number {
	return round1(10 * Math.exp(-AUDIO_LOSS_K * i.lossRate) * delayFactor(i.rttMs, W_AUDIO_DOWN));
}

// Screen loss decay constant — ~5% loss already reads unusable for real-time video (steep, front-loaded).
const SCREEN_LOSS_K = 0.02;
// Screen freeze tolerance — fraction of the window spent frozen at which the vote hits ~1/e of its range.
const SCREEN_FREEZE_TOL = 0.15;

// Screen uplink — as sender we cannot see the receiver's freezes, only the loss it reports
// (remote-inbound fractionLost). Exponential loss x the small screen delay factor.
export function calcUplinkScreenVote(i: { lossRate: number; rttMs?: number }): number {
	return round1(10 * Math.exp(-i.lossRate / SCREEN_LOSS_K) * delayFactor(i.rttMs, W_SCREEN));
}

// Screen downlink — degradation is the FREEZE RATIO (a post-recovery measured outcome: RTT's recovery
// damage is already inside it), not raw loss. ~0 on static content. Exponential x the small delay factor
// (the separate interactivity mechanism, clean-but-late).
export function calcDownlinkScreenVote(i: { freezeRatio: number; rttMs?: number }): number {
	return round1(10 * Math.exp(-i.freezeRatio / SCREEN_FREEZE_TOL) * delayFactor(i.rttMs, W_SCREEN));
}

// Webcam uplink — the simulcast tier our send-GCC keeps under BANDWIDTH pressure only (CPU/weak-camera
// excluded). Discrete tier ratio over producible rungs, x the mild webcam delay factor.
export function calcUplinkWebcamVote(i: {
	topActiveRung: number;
	producibleRungs: number;
	bwLimitedFraction: number;
	cpuLimitedFraction?: number;
	rttMs?: number;
}): number {
	if (i.producibleRungs <= 0) return round1(10 * delayFactor(i.rttMs, W_WEBCAM));
	if (i.topActiveRung < 0) return 0;
	const ratio = Math.min(1, (i.topActiveRung + 1) / i.producibleRungs);
	const scaledDown = ratio < 1;
	const byCpu = scaledDown && (i.cpuLimitedFraction ?? 0) > i.bwLimitedFraction;
	const tier = scaledDown && !byCpu ? ratio * 10 : 10;
	return round1(tier * delayFactor(i.rttMs, W_WEBCAM));
}

// Webcam downlink — the resolution tier & framerate our downlink controller chose per feed, normalized
// by what the SENDER offers, averaged over feeds, x the mild webcam delay factor.
export function calcDownlinkWebcamVote(
	feeds: Array<{
		shownTierIdx: number;
		senderMaxTierIdx: number;
		temporalReduced?: boolean;
	}>,
	rttMs?: number
): number {
	// A network-forced framerate drop (our controller shed the VP8 temporal layer) — a small, flat,
	// freeze-free penalty on top of the resolution ceiling, much milder than a resolution step.
	const TEMPORAL_DROP_PENALTY = 0.15;
	if (feeds.length === 0) return round1(10 * delayFactor(rttMs, W_WEBCAM));
	const feedVotes = feeds.map((f) => {
		const spatialCeiling =
			f.senderMaxTierIdx < 0
				? 10
				: Math.min(1, (f.shownTierIdx + 1) / (f.senderMaxTierIdx + 1)) * 10;
		return spatialCeiling * (f.temporalReduced ? 1 - TEMPORAL_DROP_PENALTY : 1);
	});
	return round1(avg(feedVotes) * delayFactor(rttMs, W_WEBCAM));
}

export type StreamVotes = {
	uplinkWebcam?: number;
	downlinkWebcam?: number;
	uplinkAudio?: number;
	downlinkAudio?: number;
	uplinkScreen?: number;
	downlinkScreen?: number;
};

export function scoreToLevel(s: number): ConnectionQuality {
	if (s < 2) return 'terrible';
	if (s < 4.5) return 'poor';
	if (s < 6.5) return 'medium';
	if (s < 8.5) return 'high';
	return 'optimal';
}

// Per-stream IMPORTANCE weight for the aggregate: audio carries ~60-70% of conversational QoE, so it
// weighs 2x video. Importance lives here (the mean), never in the votes.
const AGG_WEIGHTS: Record<keyof StreamVotes, number> = {
	uplinkAudio: 2,
	downlinkAudio: 2,
	uplinkWebcam: 1,
	downlinkWebcam: 1,
	uplinkScreen: 1,
	downlinkScreen: 1
};

export function aggregateQuality(votes: StreamVotes, iceConnected: boolean): ConnectionQuality {
	// Worst-aware blend: (1-LAMBDA)*weightedMean + LAMBDA*min. The weighted mean applies importance
	// (audio 2x); LAMBDA floors the worst stream's say so one clearly-bad stream stops the level reading
	// 'optimal', without a pure min's tyranny. RTT is no longer a peer vote — it is folded into each
	// stream as its own delay factor.
	const LAMBDA = 0.4;
	if (!iceConnected) return 'lost';
	const keys = (Object.keys(votes) as (keyof StreamVotes)[]).filter((k) => votes[k] !== undefined);
	if (keys.length === 0) return 'optimal';
	let weightSum = 0;
	let weightedAcc = 0;
	const values: number[] = [];
	keys.forEach((k) => {
		const v = votes[k] as number;
		const w = AGG_WEIGHTS[k];
		weightedAcc += v * w;
		weightSum += w;
		values.push(v);
	});
	const weightedMean = weightedAcc / weightSum;
	return scoreToLevel((1 - LAMBDA) * weightedMean + LAMBDA * Math.min(...values));
}
