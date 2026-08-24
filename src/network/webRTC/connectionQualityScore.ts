/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export type ConnectionQuality = 'lost' | 'terrible' | 'poor' | 'medium' | 'high' | 'optimal';

const clamp01 = (x: number): number => Math.max(0, Math.min(1, x));
const round1 = (x: number): number => Math.round(x * 10) / 10;

// Network-health model: absolute link conditions on OUR OWN legs to Janus. One question — is this
// participant's own network hurting the call? Two clean, per-leg-isolatable signals:
//   - RTT: round-trip me<->Janus (candidate-pair). A convex interactivity knee (E-model Id shape).
//   - loss: worst of uplink (Janus's fractionLost on my sends, always clean me->Janus) and downlink
//           (the Janus RTCP-SR escape: forwarded-count vs received-count, immune to the publisher's
//           own uplink loss). Concave decay (IQX / E-model shape): collapses early, then flattens.
// Green = link clean OR the browser is compensating; red = network damage adaptation cannot hide.
// Jitter is deliberately excluded (not cleanly per-leg isolatable on downlink). Constants are tunable.

const RTT_GOOD_MS = 200; // at/under this, latency costs nothing
const RTT_BAD_MS = 700; // at/over this, interactivity is gone
const K_LOSS = 0.05; // loss decay scale: ~1/e of the range per 5% loss
const LAMBDA = 0.5; // blend knob: 1 = worst-aware min, 0 = mean, 0.5 = the middle ground

export function rttScore(rttMs: number | undefined): number {
	if (rttMs === undefined) return 10;
	const x = clamp01((RTT_BAD_MS - rttMs) / (RTT_BAD_MS - RTT_GOOD_MS));
	return 10 * x * x;
}

export function lossScore(loss: number | undefined): number {
	if (loss === undefined) return 10;
	return 10 * Math.exp(-loss / K_LOSS);
}

export function scoreToLevel(s: number): ConnectionQuality {
	if (s < 2) return 'terrible';
	if (s < 4.5) return 'poor';
	if (s < 6.5) return 'medium';
	if (s < 8.5) return 'high';
	return 'optimal';
}

// Raw per-leg link sample the monitor measures over its window; the vote normalizes it internally.
// loss values are fractions (0..1). undefined = not measurable this window (muted / nothing on that leg).
export type LinkSample = {
	rttMs?: number;
	lossUp?: number;
	lossDown?: number;
};

// The single vote. loss = max(up, down): the worse direction is the leg's loss. Not ICE-connected ->
// 'lost'. No signal at all (RTT unknown and no traffic either way) -> 'optimal' (no evidence of harm).
export function computeConnectionQuality(
	sample: LinkSample,
	iceConnected: boolean
): ConnectionQuality {
	if (!iceConnected) return 'lost';
	const hasLoss = sample.lossUp !== undefined || sample.lossDown !== undefined;
	if (sample.rttMs === undefined && !hasLoss) return 'optimal';
	const loss = hasLoss ? Math.max(sample.lossUp ?? 0, sample.lossDown ?? 0) : undefined;
	const rtt = rttScore(sample.rttMs);
	const los = lossScore(loss);
	const mean = (rtt + los) / 2;
	const score = (1 - LAMBDA) * mean + LAMBDA * Math.min(rtt, los);
	return scoreToLevel(round1(score));
}
