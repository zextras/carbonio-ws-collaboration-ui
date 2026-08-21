/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export type ConnectionQuality = 'lost' | 'terrible' | 'poor' | 'medium' | 'high' | 'optimal';

const clamp01 = (x: number): number => Math.max(0, Math.min(1, x));
const round1 = (x: number): number => Math.round(x * 10) / 10;
const avg = (xs: number[]): number => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

// Calibration constants — per-type UX severity, tunable:
const TOL_AUDIO = 0.5; // audio+PLC stays usable to ~50% loss
const TOL_SCREEN = 0.15; // video-like: artifacts persist to next keyframe
const TOL_WEBCAM = 0.3; // adaptive: loss is secondary, the tier ceiling carries congestion
// Uplink jitter (RFC3550 interarrival, seconds) -> 0..1 impairment via a "perceptibly-bad" threshold.
// Loss and jitter count DISJOINT packets (a packet is either never-arrived=loss, or arrived-late=jitter
// — never both), so their harms fall on different packets and ADD (never max'd). Video tolerates timing.
const JITTER_AUDIO = 0.1; // s — audio jitter this large ≈ unusable (buffer grows / concealment)
const JITTER_SCREEN = 0.2; // s — video absorbs more timing before frames arrive too late to show
// A network-forced FRAMERATE drop (our controller shed the VP8 temporal layer to relieve congestion)
// lowers the webcam-down vote, but by a small FIXED amount — much less than a RESOLUTION step, which
// already scales the ceiling by the tier ratio. A framerate cut is a milder, freeze-free degradation
// than a resolution cut, so it should show on the indicator without dominating it. Discrete because
// our controller uses a binary full/base temporal target; make it proportional if that becomes graduated.
const TEMPORAL_DROP_PENALTY = 0.15;

// Audio uplink — two DIFFERENT effects that ADD: loss -> voice gaps/choppiness; jitter -> conversational
// lag + roughness. Jitter weighs HALF of loss (arbitrary UX call: a dropout hurts intelligibility more
// than added latency), so jitter alone caps its impairment at 0.5.
export function calcUplinkAudioVote(i: { fractionLost: number; jitter: number }): number {
	const impair = clamp01(i.fractionLost / TOL_AUDIO + 0.5 * clamp01(i.jitter / JITTER_AUDIO));
	return round1(10 * (1 - impair));
}

// Downlink audio/screen score ONLY loss on the Janus->us leg (inbound packetsLost). A sender's own
// freezes / jitter / bitrate cuts are network-caused on THEIR uplink and surface on THEIR uplink
// vote (via remote-inbound-rtp), not ours — so loss-only here is deliberate: it keeps attribution
// to our own downlink and avoids measuring someone else's channel.
export function calcDownlinkAudioVote(i: { lossRate: number }): number {
	return round1(10 * (1 - clamp01(i.lossRate / TOL_AUDIO)));
}

// Screen uplink — loss and jitter cause the SAME effect (receiver freeze: loss = missing frame data,
// jitter = frames arriving too late), so they ADD with EQUAL weight.
export function calcUplinkScreenVote(i: { fractionLost: number; jitter: number }): number {
	const impair = clamp01(i.fractionLost / TOL_SCREEN + i.jitter / JITTER_SCREEN);
	return round1(10 * (1 - impair));
}

export function calcDownlinkScreenVote(i: { lossRate: number }): number {
	return round1(10 * (1 - clamp01(i.lossRate / TOL_SCREEN)));
}

// Webcam uplink — network-health only, CPU/capture excluded.
// ceiling reflects simulcast tier health under bandwidth pressure only;
// loss/TOL_WEBCAM compounds residual packet damage on top.
export function calcUplinkWebcamVote(i: {
	topActiveRung: number;
	producibleRungs: number;
	bwLimitedFraction: number;
	cpuLimitedFraction?: number;
	lossRate?: number;
}): number {
	let ceiling: number;
	if (i.producibleRungs <= 0) {
		ceiling = 10;
	} else if (i.topActiveRung < 0) {
		ceiling = 0;
	} else {
		const ratio = Math.min(1, (i.topActiveRung + 1) / i.producibleRungs);
		const scaledDown = ratio < 1;
		const byCpu = scaledDown && (i.cpuLimitedFraction ?? 0) > i.bwLimitedFraction;
		ceiling = scaledDown && !byCpu ? ratio * 10 : 10;
	}
	return round1(ceiling * (1 - clamp01((i.lossRate ?? 0) / TOL_WEBCAM)));
}

// Webcam downlink — network-health only, remote-low publisher excluded.
// ceiling = shown tier / sender's offered top -> a sender who never offers a higher tier is never penalized; loss/TOL_WEBCAM = residual congestion we could not escape by dropping.
// temporalReduced = our controller forced the framerate down (network-driven) -> a small extra penalty
// on top of the resolution ceiling (see TEMPORAL_DROP_PENALTY). Only OUR forced framerate cut is
// penalized; a sender who simply produces one temporal layer never reaches this (we stay at full).
export function calcDownlinkWebcamVote(
	feeds: Array<{
		shownTierIdx: number;
		senderMaxTierIdx: number;
		inboundLossRate: number;
		temporalReduced?: boolean;
	}>
): number {
	if (feeds.length === 0) return 10;
	const feedVotes = feeds.map((f) => {
		const spatialCeiling =
			f.senderMaxTierIdx < 0
				? 10
				: Math.min(1, (f.shownTierIdx + 1) / (f.senderMaxTierIdx + 1)) * 10;
		const ceiling = spatialCeiling * (f.temporalReduced ? 1 - TEMPORAL_DROP_PENALTY : 1);
		return ceiling * (1 - clamp01(f.inboundLossRate / TOL_WEBCAM));
	});
	return round1(avg(feedVotes));
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

// Worst-aware aggregation: convex blend (1-LAMBDA)*mean + LAMBDA*min.
// LAMBDA is the minimum say the single worst stream keeps regardless of how many good streams
// surround it: a plain mean dilutes one bad stream by 1/N as N grows (hiding it), whereas here the
// worst stream's deficit keeps an effective weight floored at LAMBDA. It biases the score downward
// just enough that one clearly-bad stream stops the level reading 'optimal', without letting the
// worst dominate the way a pure min (LAMBDA=1) would. Per-stream IMPORTANCE (audio > screen) is a
// separate concept, still NOT applied; when added it goes HERE as weights, never in the votes.
const LAMBDA = 0.4;

export function aggregateQuality(votes: StreamVotes, iceConnected: boolean): ConnectionQuality {
	if (!iceConnected) return 'lost';
	const active = (Object.keys(votes) as (keyof StreamVotes)[])
		.filter((k) => votes[k] !== undefined)
		.map((k) => votes[k] as number);
	if (active.length === 0) return 'optimal';
	return scoreToLevel((1 - LAMBDA) * avg(active) + LAMBDA * Math.min(...active));
}
