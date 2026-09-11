/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export type ConnectionQuality = 'lost' | 'terrible' | 'poor' | 'medium' | 'high' | 'optimal';

const clamp01 = (x: number): number => Math.max(0, Math.min(1, x));
const round1 = (x: number): number => Math.round(x * 10) / 10;

// TWO INDEPENDENT PIPELINES that share no input and no smoothing mechanism (simplified design):
//
//   A · SCORE (the badge / indicator) — how well is OUR OWN link to Janus bearing the meeting right
//       now. THREE clean own-leg signals only, each me<->Janus so no other participant can contaminate
//       them: RTT, uplink jitter, uplink loss. Each is turned into a 0..10 curve value, combined
//       worst-aware into one flat score (no latency/loss grouping), then smoothed by a median of the
//       last N raw bars in the VoteWindow. NO downlink signal enters the badge.
//   B · VIDEO controller (the received webcam tier) — driven by ONE signal only: downlink VIDEO loss
//       (the consistency-gated Janus RTCP-SR escape, immune to the sender's uplink). It has its OWN
//       curve and is read RAW (the controller's DOWN/UP N-of-M count is its only smoothing).
//
// A missing/unreadable signal ⇒ curveScore(undefined) = 10 (off, no harm): it goes blind on that axis
// instead of dragging the result. This is what lets RTT stay in the badge even on FF-ESR (< 142) that
// lacks candidate-pair RTT, and what makes a loss-blind controller tick a non-event.

// A · badge curves.
const RTT_GOOD_MS = 200; // at/under this, latency costs nothing
const RTT_BAD_MS = 700; // at/over this, interactivity is gone
const JITTER_GOOD_MS = 30; // at/under this, the jitter buffer hides it for free
const JITTER_BAD_MS = 120; // at/over this, the buffer can no longer hide it
// Uplink loss deadband: at/below this the loss is treated as noise (score stays 10). 2% is GCC's
// "increase" edge (draft-ietf-rmcat-gcc-02 §6). Knee reaches a hard 0 at 22%.
const LOSS_HEALTHY = 0.02;
const LOSS_BAD_UP = 0.22;
const LAMBDA = 0.5; // worst-aware blend: 1 = pure worst (min), 0 = mean, 0.5 = the middle ground

// B · downlink video-loss controller curve — SEPARATE from the badge (its own deadband/bad point).
const DOWNLINK_LOSS_HEALTHY = 0.02;
const DOWNLINK_LOSS_BAD = 0.42; // video tolerates ~2× the uplink knee before the score reaches 0

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

// Downlink VIDEO loss score (video controller ONLY — never the badge). Its own curve.
export function downlinkVideoLossScore(loss: number | undefined): number {
	return curveScore(loss, DOWNLINK_LOSS_HEALTHY, DOWNLINK_LOSS_BAD);
}

// The 0..10 score maps DIRECTLY onto the 5-bar indicator: bars = round(score / 2), half-up (score 9→5
// bars, 7→4, 5→3, 3→2, 1→1).
export function scoreToBars(s: number): number {
	return Math.max(0, Math.min(5, Math.round(s / 2)));
}

// The level names ARE those bar counts (terrible = 0-1 bars; 'lost' is a separate ICE-down state, not a score).
export function scoreToLevel(s: number): ConnectionQuality {
	const bars = scoreToBars(s);
	return (['terrible', 'terrible', 'poor', 'medium', 'high', 'optimal'] as const)[bars];
}

// The connection indicator only surfaces an UNSTABLE link: quality strictly below 'medium' (poor /
// terrible / lost — under 3 on the 5-bar scale). At 'medium' and above the badge stays hidden.
export function isUnstableQuality(q: ConnectionQuality): boolean {
	return q === 'poor' || q === 'terrible' || q === 'lost';
}

// Raw per-leg link sample the monitor measures over its window; loss values are fractions (0..1),
// rttMs/jitterMs are milliseconds. undefined = not measurable this window (muted / nothing on that leg).
// rttMs/jitterMs/lossUp feed the badge; lossDownVideoOwn (consistency-gated SR-escape) feeds the video
// controller; lossDownVideo stays for the own-tile hover display only. These same raw numbers are what
// the own-tile hover shows.
export type LinkSample = {
	rttMs?: number;
	jitterMs?: number;
	lossUp?: number;
	// Raw Janus->me webcam downlink loss (SR-escape), kept for the own-tile hover display only.
	lossDownVideo?: number;
	// Consistency-gated our-fault video downlink loss: SR-escape accepted only when it does not exceed
	// TOTAL loss (packetsLost = our loss + sender loss >= 0). The ONLY input to the video controller.
	lossDownVideoOwn?: number;
};

// Combine the three badge signals into one 0..10 value (rounded to 1 decimal). λ balances worst-aware
// (min) vs mean — a flat 3-signal blend, no latency/loss two-axis grouping.
export function combineVote(rtt: number, jitter: number, loss: number): number {
	const mean = (rtt + jitter + loss) / 3;
	const score = (1 - LAMBDA) * mean + LAMBDA * Math.min(rtt, jitter, loss);
	return round1(score);
}
