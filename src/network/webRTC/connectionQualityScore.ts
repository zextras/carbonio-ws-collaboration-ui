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

export function calcUplinkAudioVote(i: { fractionLost: number }): number {
	return round1(10 * (1 - clamp01(i.fractionLost / TOL_AUDIO)));
}

// Downlink audio/screen score ONLY loss on the Janus->us leg (inbound packetsLost). A sender's own
// freezes / jitter / bitrate cuts are network-caused on THEIR uplink and surface on THEIR uplink
// vote (via remote-inbound-rtp), not ours — so loss-only here is deliberate: it keeps attribution
// to our own downlink and avoids measuring someone else's channel.
export function calcDownlinkAudioVote(i: { lossRate: number }): number {
	return round1(10 * (1 - clamp01(i.lossRate / TOL_AUDIO)));
}

export function calcUplinkScreenVote(i: { fractionLost: number }): number {
	return round1(10 * (1 - clamp01(i.fractionLost / TOL_SCREEN)));
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
export function calcDownlinkWebcamVote(
	feeds: Array<{ shownTierIdx: number; senderMaxTierIdx: number; inboundLossRate: number }>
): number {
	if (feeds.length === 0) return 10;
	const feedVotes = feeds.map((f) => {
		const ceiling =
			f.senderMaxTierIdx < 0
				? 10
				: Math.min(1, (f.shownTierIdx + 1) / (f.senderMaxTierIdx + 1)) * 10;
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
