/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export type ConnectionQuality = 'lost' | 'terrible' | 'poor' | 'medium' | 'high' | 'optimal';

// Loss deadband: at/below this the downlink loss is treated as noise (score stays 10). 2% is GCC's
// "increase" edge (draft-ietf-rmcat-gcc-02 §6). Only the vote uses it now — the downlink controller is
// vote-driven and reads no loss of its own.
const LOSS_HEALTHY = 0.02;

const clamp01 = (x: number): number => Math.max(0, Math.min(1, x));
const round1 = (x: number): number => Math.round(x * 10) / 10;

// Network-carrying estimate: how well is OUR OWN link to Janus bearing the meeting we are ACTUALLY
// running right now — NOT the perceived quality of that meeting. Every signal is read on our own legs
// (me<->Janus) and rides the LIVE traffic, so the vote is inherently RELATIVE and self-scaling: push
// more than the link can carry and RTT/loss/jitter climb -> low vote; once GCC (or our own downlink
// controller) scale the streams down to what fits, the link drains and the SAME link reads high. A
// quality drop the link now copes with is therefore a GOOD signal, by design — the opposite of an
// "how good does it look" vote. Perceived-quality reporting is deliberately NOT here: it lives only in
// the downlink snackbar. Three clean, per-leg-isolatable axes (all constants tunable):
//   - RTT    : round-trip me<->Janus. Convex interactivity knee (E-model Id shape).
//   - jitter : inter-arrival variance on OUR SEND leg only (remote-inbound-rtp.jitter, Janus's view of
//              our uplink). Clean by construction — it never folds in another participant's send path,
//              unlike DOWNLINK jitter which is contaminated by the sender's own network and is excluded.
//   - loss   : worst of uplink (remote-inbound fractionLost, me->Janus) and downlink (the Janus RTCP-SR
//              escape, immune to a publisher's own uplink loss). Convex knee — audio and video use
//              different bad-point tolerances so audio loss weighs ~2× video loss.
// latency = min(rtt, jitter): the worst interactivity signal. The vote blends latency vs loss.

const RTT_GOOD_MS = 200; // at/under this, latency costs nothing
const RTT_BAD_MS = 700; // at/over this, interactivity is gone
const JITTER_GOOD_MS = 30; // at/under this, the jitter buffer hides it for free
const JITTER_BAD_MS = 120; // at/over this, the buffer can no longer hide it
// Audio loss: knee hits 0 at 22% — where the old exponential (K=0.05) had already decayed to ~0.2,
// so the curve is visually similar but reaches a hard 0 (not asymptotic). Video uses ~2× the tolerance
// (bad 0.42) so audio loss weighs ~2× video loss in the min-scored loss axis.
const LOSS_BAD_AUDIO = 0.22;
export const LOSS_BAD_VIDEO = 0.42;
const LAMBDA = 0.5; // blend knob: 1 = worst-aware min, 0 = mean, 0.5 = the middle ground

// Shared convex knee: score = 10 when v is undefined (no evidence of harm); 10*(clamp01((bad-v)/(bad-good)))^2
// otherwise. Returns 10 at/below `good`, 0 at/above `bad`, quadratic in between.
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

// Deadband = LOSS_HEALTHY: below it loss is noise (score stays 10). Kills most of the spurious vote flicker
// (E2E: most fired at lossDown 1–2%) and maps the loss term to the GCC bands — green < 2%, ~medium at ~8%.
// `bad` defaults to LOSS_BAD_AUDIO; pass LOSS_BAD_VIDEO for video downlink streams.
export function lossScore(loss: number | undefined, bad: number = LOSS_BAD_AUDIO): number {
	return curveScore(loss, LOSS_HEALTHY, bad);
}

// The 0..10 score maps DIRECTLY onto the 5-bar indicator: bars = round(score / 2), half-up (score 9→5 bars,
// 7→4, 5→3, 3→2, 1→1). No arbitrary per-level cut-points — the level names ARE those bar counts (terrible =
// the bottom, 0-1 bars; 'lost' is a separate ICE-down state, not a score). Our only job is to make the 0..10
// score realistic; the display is a plain ÷2.
export function scoreToLevel(s: number): ConnectionQuality {
	const bars = Math.max(0, Math.min(5, Math.round(s / 2)));
	return (['terrible', 'terrible', 'poor', 'medium', 'high', 'optimal'] as const)[bars];
}

// The connection indicator and the downlink snackbar only surface an UNSTABLE link: quality strictly
// below 'medium' (poor / terrible / lost — under 3 on the 5-bar scale). At 'medium' and above the link is
// treated as stable and both stay hidden, so the UI is silent on a healthy or merely-throttled call.
export function isUnstableQuality(q: ConnectionQuality): boolean {
	return q === 'poor' || q === 'terrible' || q === 'lost';
}

// Raw per-leg link sample the monitor measures over its window; the vote normalizes it internally.
// loss values are fractions (0..1); rttMs/jitterMs are milliseconds. undefined = not measurable this
// window (muted / nothing on that leg). lossDown = max(audio, video) kept for log/hover display;
// lossDownAudio and lossDownVideo are kept separate for split-tolerance scoring. These same raw numbers
// are what the own-tile hover shows.
export type LinkSample = {
	rttMs?: number;
	jitterMs?: number;
	lossUp?: number;
	lossDown?: number;
	lossDownAudio?: number;
	lossDownVideo?: number;
	// Consistency-gated our-fault video downlink loss: SR-escape (Janus->me hop) accepted only when it
	// does not exceed TOTAL loss (packetsLost = our loss + sender loss >= 0). SR-escape > packetsLost
	// implies a negative sender loss => counters corrupted. This is the ONLY video signal in the vote;
	// raw lossDownVideo stays for the own-tile hover display only.
	lossDownVideoOwn?: number;
};

// Two axes (0..10). latency folds RTT and uplink jitter into the single worst interactivity score; loss
// is the minimum (worst) of uplink loss, AUDIO downlink loss (both LOSS_BAD_AUDIO), and the
// consistency-gated our-fault video downlink loss (lossDownVideoOwn, LOSS_BAD_VIDEO). Raw lossDownVideo
// is excluded: only the invariant-gated lossDownVideoOwn enters the vote.
export type AxisScores = { latency: number; loss: number };

// Blend the per-axis scores into a single 0..10 value (rounded to 1 decimal). λ balances worst-aware vs mean.
export function combineScoreValue(scores: AxisScores): number {
	const mean = (scores.latency + scores.loss) / 2;
	const score = (1 - LAMBDA) * mean + LAMBDA * Math.min(scores.latency, scores.loss);
	return round1(score);
}
