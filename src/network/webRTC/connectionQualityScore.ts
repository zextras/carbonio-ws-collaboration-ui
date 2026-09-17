/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export type ConnectionQuality = 'lost' | 'terrible' | 'poor' | 'medium' | 'high' | 'optimal';

const clamp01 = (x: number): number => Math.max(0, Math.min(1, x));
export const round1 = (x: number): number => Math.round(x * 10) / 10;

// Missing/unreadable signal => curveScore(undefined)=10: go blind on that axis instead of dragging the
// score to 0 (e.g. RTT stays in the badge on FF-ESR <142 which lacks candidate-pair RTT).

// 150 (was 200): start reacting to rising delay/bufferbloat earlier — GCC's delay-based arm acts on a
// ~12.5ms queue gradient (RTT often 100-150ms), well before an absolute 200ms would move the badge.
const RTT_GOOD_MS = 150;
const RTT_BAD_MS = 700;
const JITTER_GOOD_MS = 30;
const JITTER_BAD_MS = 120;
// Uplink loss deadband: at/below this the loss is treated as noise (score stays 10). 2% is GCC's
// "increase" edge (draft-ietf-rmcat-gcc-02 §6). Knee reaches a hard 0 at 16% (>16% loss is unusable).
const LOSS_HEALTHY = 0.02;
const LOSS_BAD_UP = 0.16; // was 0.22 — a bit less gentle so the badge reddens inside GCC's 2-10% hold zone
// 0.7 (was 0.5): worst-aware blend, 1 = pure worst (min), 0 = mean. Higher lets the WORST axis dominate,
// so a single genuinely-bad signal (loss climbing / delay rising) is not diluted by two healthy axes.
const LAMBDA = 0.7;

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

// Max rung the CAMERA can produce, from the backend tier list + capture height. NO hardcoded heights.
// Rung scale: low=0, medium=1, high=2 (matches ridToIndex {l:0,m:1,h:2}).
export function producibleCeiling(
	tiers: { name: 'high' | 'medium' | 'low'; height: number }[] | undefined,
	captureHeight: number | undefined
): number | null {
	if (!tiers?.length || captureHeight == null) return null;
	const rung = { low: 0, medium: 1, high: 2 } as const;
	const producible = tiers.filter((t) => captureHeight >= t.height);
	if (!producible.length) return 0;
	return Math.max(...producible.map((t) => rung[t.name]));
}

export const TIER_PENALTY_RATIO = 0.63;

// Weight an already-computed vote score (0..10) by how far below the hardware ceiling we send.
// shortfall 0 (at or above hardware ceiling) -> penalty 1 (not punished). Both tiers null -> 1.
export function weightByTier(
	score: number,
	maxHardwareTier: number | null,
	maxUplinkTier: number | null
): number {
	if (maxHardwareTier == null || maxUplinkTier == null) return round1(score);
	const shortfall = Math.max(0, maxHardwareTier - maxUplinkTier);
	return round1(score * TIER_PENALTY_RATIO ** shortfall);
}

// Uplink shortfall: how many tier rungs below the hardware ceiling we are currently sending.
// Returns 0 when either tier is unknown (not penalised when webcam is off or tiers unsettled).
export function uplinkShortfall(
	maxHardwareTier: number | null | undefined,
	maxUplinkTier: number | null | undefined
): number {
	if (maxHardwareTier == null || maxUplinkTier == null) return 0;
	return Math.max(0, maxHardwareTier - maxUplinkTier);
}

// Multiplicative penalty coefficient for a given total tier shortfall (uplink + downlink combined).
export function tierPenalty(shortfall: number): number {
	return TIER_PENALTY_RATIO ** shortfall;
}

export const K_UP = 3;
export const K_DOWN = 3;

// Absolute score: relative penalised by uplink and downlink tier shortfalls (subtractive counterfactual).
// null when relative is null (LOST). Tiers apply instantly (no extra smoothing).
export function absoluteScore(
	relative: number | null,
	upShortfall: number,
	downShortfall: number
): number | null {
	if (relative == null) return null;
	return round1(Math.max(0, Math.min(10, relative - K_UP * upShortfall - K_DOWN * downShortfall)));
}
