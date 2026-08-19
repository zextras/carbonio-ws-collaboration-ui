/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export type ConnectionQuality = 'lost' | 'terrible' | 'poor' | 'medium' | 'high' | 'optimal';

const clamp01 = (x: number): number => Math.max(0, Math.min(1, x));
const round1 = (x: number): number => Math.round(x * 10) / 10;
const avg = (xs: number[]): number => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

// Each vote scores a single stream direction on its own; how the directions are weighed and combined
// is decided in aggregateQuality, not here. A direction that is not flowing is omitted by the caller
// (left undefined), never scored 10: an idle channel is "not measured", not "perfect".

// Webcam uplink: top actively-sent simulcast rung vs the top the capture can produce. Only a
// bandwidth/cpu limitation lowers it; a capture-limited small camera still sends its best, so it stays 10.
export function calcUplinkWebcamVote(i: {
	producibleRungs: number;
	topActiveRung: number;
	limited: boolean;
}): number {
	if (i.producibleRungs <= 0) return 10;
	if (!i.limited) return 10;
	if (i.topActiveRung < 0) return 0;
	return round1(Math.min(1, (i.topActiveRung + 1) / i.producibleRungs) * 10);
}

// Webcam downlink: per feed, the substream my controller settled on vs the top (2); a suppressed feed
// is 0. Averaged across the feeds I am receiving.
export function calcDownlinkWebcamVote(
	feeds: Array<{ substream: 0 | 1 | 2; off: boolean }>
): number {
	return round1(avg(feeds.map((f) => (f.off ? 0 : ((f.substream + 1) / 3) * 10))));
}

// Audio uplink: the far end's RTCP loss report on what I send (fractionLost). Audio has no simulcast,
// so it never adapts; the score is pure impairment.
export function calcUplinkAudioVote(i: { lossRate: number }): number {
	return round1((1 - clamp01(i.lossRate)) * 10);
}

// Audio downlink: impairment from received loss, concealment and jitter. Audio never adapts.
export function calcDownlinkAudioVote(i: {
	lossRate: number;
	concealmentRatio: number;
	jitterMs: number;
}): number {
	const impairment = Math.max(
		clamp01(i.lossRate),
		clamp01(i.concealmentRatio),
		clamp01(i.jitterMs / 200)
	);
	return round1((1 - impairment) * 10);
}

// Screen uplink: the far end's RTCP loss report on what I share. Screen has no simulcast, so it never
// loses resolution; the score is pure impairment.
export function calcUplinkScreenVote(i: { lossRate: number }): number {
	return round1((1 - clamp01(i.lossRate / 0.15)) * 10);
}

// Screen downlink: impairment from received loss and freezes. Screen never adapts.
export function calcDownlinkScreenVote(i: { lossRate: number; freezesPerMin: number }): number {
	const impairment = Math.max(clamp01(i.lossRate / 0.15), clamp01(i.freezesPerMin / 6));
	return round1((1 - impairment) * 10);
}

export type StreamVotes = {
	uplinkWebcam?: number;
	downlinkWebcam?: number;
	uplinkAudio?: number;
	downlinkAudio?: number;
	uplinkScreen?: number;
	downlinkScreen?: number;
};

// In/out share equal weight per stream; the split between streams matches the single-vote weights it
// replaces (audio 0.4 -> 0.2/0.2, screenshare 0.2 -> 0.1/0.1).
const WEIGHTS: Record<keyof StreamVotes, number> = {
	uplinkWebcam: 0.15,
	downlinkWebcam: 0.25,
	uplinkAudio: 0.2,
	downlinkAudio: 0.2,
	uplinkScreen: 0.1,
	downlinkScreen: 0.1
};
const LAMBDA = 0.4;

export function scoreToLevel(s: number): ConnectionQuality {
	if (s < 2) return 'terrible';
	if (s < 4.5) return 'poor';
	if (s < 6.5) return 'medium';
	if (s < 8.5) return 'high';
	return 'optimal';
}

// Combines the present per-direction votes: worst-aware convex blend of the weighted mean and the
// minimum. !iceConnected -> 'lost'. Connected with nothing flowing -> 'optimal' (I send and receive
// nothing, so nothing is limited).
export function aggregateQuality(votes: StreamVotes, iceConnected: boolean): ConnectionQuality {
	if (!iceConnected) return 'lost';
	const active = (Object.keys(WEIGHTS) as (keyof StreamVotes)[])
		.filter((k) => votes[k] !== undefined)
		.map((k) => ({ v: votes[k] as number, w: WEIGHTS[k] }));
	if (active.length === 0) return 'optimal';
	const wsum = active.reduce((s, e) => s + e.w, 0);
	const wmean = active.reduce((s, e) => s + e.v * e.w, 0) / wsum;
	const wmin = Math.min(...active.map((e) => e.v));
	return scoreToLevel((1 - LAMBDA) * wmean + LAMBDA * wmin);
}
