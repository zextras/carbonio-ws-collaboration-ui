/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export type ConnectionQuality = 'lost' | 'terrible' | 'poor' | 'medium' | 'high' | 'optimal';

const clamp01 = (x: number): number => Math.max(0, Math.min(1, x));
const round1 = (x: number): number => Math.round(x * 10) / 10;
const avg = (xs: number[]): number => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

// Webcam UP: top actively-sent simulcast rung vs the top the capture can produce.
// Only a bandwidth/cpu limitation lowers it; a capture-limited small camera stays 10.
export function webcamUpVote(i: {
	producibleRungs: number; // rungs the capture resolution supports, 1..3
	topActiveRung: number; // highest rung index actually sending (0-based), -1 if none
	limited: boolean; // qualityLimitationReason === 'bandwidth' | 'cpu'
}): number {
	if (i.producibleRungs <= 0) return 10;
	if (!i.limited) return 10;
	if (i.topActiveRung < 0) return 0;
	return round1(Math.min(1, (i.topActiveRung + 1) / i.producibleRungs) * 10);
}

// Webcam DOWN: per feed, the substream MY controller settled on vs the top (2); off = 0. Averaged.
export function webcamDownVote(feeds: Array<{ substream: 0 | 1 | 2; off: boolean }>): number {
	if (feeds.length === 0) return 10;
	return round1(avg(feeds.map((f) => (f.off ? 0 : ((f.substream + 1) / 3) * 10))));
}

// Audio does NOT adapt -> impairment from loss + concealment + jitter (down) and fractionLost (up).
export function audioVote(i: {
	downLossRate: number;
	concealmentRatio: number;
	jitterMs: number;
	upLossRate: number;
}): number {
	const impairment = Math.max(
		clamp01(i.downLossRate),
		clamp01(i.concealmentRatio),
		clamp01(i.jitterMs / 200),
		clamp01(i.upLossRate)
	);
	return round1((1 - impairment) * 10);
}

// Screenshare does NOT adapt -> impairment from loss + freezes (worst of up/down).
export function screenshareVote(i: { lossRate: number; freezesPerMin: number }): number {
	const impairment = Math.max(clamp01(i.lossRate / 0.15), clamp01(i.freezesPerMin / 6));
	return round1((1 - impairment) * 10);
}

export type StreamVotes = {
	webcamUp?: number;
	webcamDown?: number;
	audio?: number;
	screenshare?: number;
};
const WEIGHTS: Record<keyof StreamVotes, number> = {
	webcamUp: 0.15,
	webcamDown: 0.25,
	audio: 0.4,
	screenshare: 0.2
};
const LAMBDA = 0.4;

export function scoreToLevel(s: number): ConnectionQuality {
	if (s < 2) return 'terrible';
	if (s < 4.5) return 'poor';
	if (s < 6.5) return 'medium';
	if (s < 8.5) return 'high';
	return 'optimal';
}

// Connected + nothing active -> 'optimal' (nothing is being limited). !iceConnected -> 'lost'.
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
