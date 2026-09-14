/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export type ConnectionQuality = 'lost' | 'terrible' | 'poor' | 'medium' | 'high' | 'optimal';

const clamp01 = (x: number): number => Math.max(0, Math.min(1, x));
const round1 = (x: number): number => Math.round(x * 10) / 10;

// Missing/unreadable signal => curveScore(undefined)=10: go blind on that axis instead of dragging the
// score to 0 (e.g. RTT stays in the badge on FF-ESR <142 which lacks candidate-pair RTT).

const RTT_GOOD_MS = 200;
const RTT_BAD_MS = 700;
const JITTER_GOOD_MS = 30;
const JITTER_BAD_MS = 120;
// Uplink loss deadband: at/below this the loss is treated as noise (score stays 10). 2% is GCC's
// "increase" edge (draft-ietf-rmcat-gcc-02 §6). Knee reaches a hard 0 at 22%.
const LOSS_HEALTHY = 0.02;
const LOSS_BAD_UP = 0.22;
const LAMBDA = 0.5; // worst-aware blend: 1 = pure worst (min), 0 = mean, 0.5 = the middle ground

// Shared convex knee: score = 10 when v is undefined (no evidence of harm); otherwise
// 10*(clamp01((bad-v)/(bad-good)))^2. Returns 10 at/below `good`, 0 at/above `bad`, quadratic between.
export function curveScore(v: number | undefined, good: number, bad: number): number {
	if (v === undefined) return 10;
	return 10 * clamp01((bad - v) / (bad - good)) ** 2;
}

export function rttScore(rttMs: number | undefined): number {
	return curveScore(rttMs, RTT_GOOD_MS, RTT_BAD_MS);
}

export function jitterScore(jitterMs: number | undefined): number {
	return curveScore(jitterMs, JITTER_GOOD_MS, JITTER_BAD_MS);
}

// Uplink loss score (badge). Deadband = LOSS_HEALTHY: below it loss is noise (score stays 10).
export function uplinkLossScore(loss: number | undefined): number {
	return curveScore(loss, LOSS_HEALTHY, LOSS_BAD_UP);
}

// Downlink video controller — decoded-frame-rate (liveness) curve. Input = frames-per-second decoded for a
// received webcam this tick (Δ framesDecoded / tick seconds). A freeze (loss breaks frames / bufferbloat
// stalls them) drives fps toward 0. Rising: 0 fps -> 0, at/above HEALTHY_FPS -> 10, linear between.
const HEALTHY_FPS = 15;
export function videoFpsScore(fps: number): number {
	return 10 * clamp01(fps / HEALTHY_FPS);
}

export function scoreToBars(s: number): number {
	return Math.max(0, Math.min(5, Math.round(s / 2)));
}

// The level names ARE those bar counts (terrible = 0-1 bars; 'lost' is a separate ICE-down state, not a score).
export function scoreToLevel(s: number): ConnectionQuality {
	const bars = scoreToBars(s);
	return (['terrible', 'terrible', 'poor', 'medium', 'high', 'optimal'] as const)[bars];
}

export function isUnstableQuality(q: ConnectionQuality): boolean {
	return q === 'poor' || q === 'terrible' || q === 'lost';
}

// Raw per-leg link sample the monitor measures over its window; loss values are fractions (0..1),
// rttMs/jitterMs are milliseconds. undefined = not measurable this window (muted / nothing on that leg).
// rttMs/jitterMs/lossUp feed the badge only. The own-tile hover shows these same raw numbers.
export type LinkSample = {
	rttMs?: number;
	jitterMs?: number;
	lossUp?: number;
};

// Combine the three badge signals into one 0..10 value (rounded to 1 decimal). λ balances worst-aware
// (min) vs mean — a flat 3-signal blend, no latency/loss two-axis grouping.
export function combineVote(rtt: number, jitter: number, loss: number): number {
	const mean = (rtt + jitter + loss) / 3;
	const score = (1 - LAMBDA) * mean + LAMBDA * Math.min(rtt, jitter, loss);
	return round1(score);
}
