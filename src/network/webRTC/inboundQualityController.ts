/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/*
 * Downlink quality controller (simplified) — one GLOBAL targetRung for all feeds, driven ENTIRELY by
 * downlink VIDEO loss.
 *
 * In an SFU topology only the SFU can estimate a subscriber's downlink capacity, and Janus v1.4.0 (our
 * pinned engine) implements NO subscriber-side BWE (it parses then DISCARDS transport-cc, and IGNORES
 * the subscriber's REMB). So the receiver cannot MEASURE its downlink capacity; the clean thing it CAN
 * measure is downlink VIDEO packet loss (the RTCP-SR escape, immune to the sender's uplink).
 *
 * STATELESS per feed (2026-09): we keep ONE global targetRung and request it for EVERY feed; Janus
 * clamps each feed to min(requested, what the publisher actually publishes) automatically — a probe for
 * a tier a sender doesn't publish is a free no-op (one rate-limited PLI, no gap). So there is NO per-feed
 * tracking, NO senderMax, NO effective-rung bookkeeping here: the subscriber's downlink is ONE shared
 * pipe and a congested downlink lowers ALL feeds uniformly, O(1).
 *
 * SIGNAL: the controller reads `downlinkVideoLossScore` (0..10, its own curve) RAW — no median. The
 * DOWN/UP N-of-M count IS its only smoothing. Evidence resets on every rung change (a step changes the
 * measured loss, so pre-change readings are stale). Thresholds are on the decimal score directly:
 *   DOWN: >= DOWN_N of the last DOWN_M raw readings have score < 5   → targetRung-- (never below floor).
 *   UP:   >= UP_N of the last UP_M raw readings have score > 9       → targetRung++ (with backoff).
 * Floor is 144p (rung 0, no "off"); top is 720p (rung 2). Every step-up is a blind probe (no BWE), so we
 * raise only on a clear margin and back off (double the wait) after a failed climb — a DOWN that follows
 * an UP inside the wait window. A failed probe for a non-existent higher tier is INVISIBLE (Janus keeps
 * forwarding the current substream, downlink loss unchanged, no DOWN follows) so the backoff never
 * triggers on it — it only reacts to a real capacity failure.
 */

import { atLeast } from './officialVoteWindow';

// 3-rung substream ladder (no temporal): 0 = 144p, 1 = 360p, 2 = 720p. Floor 0, no "off".
export const TOP_RUNG = 2;

// Evidence thresholds on the raw downlink-loss score (0..10), counted since the last rung change.
export const EVIDENCE_DOWN_N = 4; // need >= 4 readings with score < 5 in the last…
export const EVIDENCE_DOWN_M = 5; // …5 raw readings since the last change
export const EVIDENCE_UP_N = 9; // need >= 9 readings with score > 9 in the last…
export const EVIDENCE_UP_M = 10; // …10 raw readings since the last change
const EVIDENCE_CAP = 13; // >= max(DOWN_M, UP_M); bounds the buffer

const DOWN_SCORE = 5; // score strictly below this counts toward a DOWN
const UP_SCORE = 9; // score strictly above this counts toward an UP

// UP cooldown-backoff constants (units: ticks; 1 tick = 2 s).
export const COOLDOWN_BASE = 8; // 16 s — initial / reset cooldown length
export const COOLDOWN_MAX = 32; // 64 s — maximum cooldown after repeated failed climbs
export const RESET_STABLE = 32; // 64 s — no-DOWN ticks required to reset cooldown to base

export type DownlinkSignal = 'DOWN' | 'UP' | 'HOLD';

export type CentralDownlinkState = {
	targetRung: number; // 0..TOP_RUNG — the single global rung requested for every feed
	tick: number;
	// Resettable evidence: raw downlink-loss scores (0..10) since the last rung change.
	evidenceBuf: number[];
	// UP cooldown-backoff state.
	cooldownLen: number; // current cooldown length (ticks); doubles on a failed climb
	upBlockedFor: number; // ticks remaining before UP is allowed (0 = unblocked)
	ticksSinceUp: number; // ticks elapsed since the last UP fired
	ticksSinceDown: number; // ticks elapsed since the last DOWN fired
};

export function initialCentralState(): CentralDownlinkState {
	return {
		targetRung: TOP_RUNG,
		tick: 0,
		evidenceBuf: [],
		cooldownLen: COOLDOWN_BASE,
		upBlockedFor: 0,
		ticksSinceUp: COOLDOWN_MAX + 1,
		ticksSinceDown: RESET_STABLE + 1
	};
}

export type DownlinkDecision = {
	state: CentralDownlinkState;
	targetRung: number;
	changed: boolean; // the global targetRung moved this tick
	signal: DownlinkSignal;
};

/**
 * One tick of the global downlink controller. Reads the RAW downlink-loss score (0..10) and returns the
 * (possibly moved) global targetRung. Priority: DOWN > UP > HOLD. The returned state is a fresh object.
 */
export function decideDownlink(prev: CentralDownlinkState, dlScore: number): DownlinkDecision {
	const state: CentralDownlinkState = {
		targetRung: prev.targetRung,
		tick: prev.tick + 1,
		evidenceBuf: prev.evidenceBuf.slice(),
		cooldownLen: prev.cooldownLen,
		upBlockedFor: Math.max(0, prev.upBlockedFor - 1),
		ticksSinceUp: prev.ticksSinceUp + 1,
		ticksSinceDown: prev.ticksSinceDown + 1
	};

	// Accumulate the raw score into the resettable evidence buffer (capped).
	state.evidenceBuf.push(dlScore);
	if (state.evidenceBuf.length > EVIDENCE_CAP) state.evidenceBuf.shift();

	const downVote = atLeast(
		state.evidenceBuf,
		EVIDENCE_DOWN_N,
		EVIDENCE_DOWN_M,
		(s) => s < DOWN_SCORE
	);
	const upVote = atLeast(state.evidenceBuf, EVIDENCE_UP_N, EVIDENCE_UP_M, (s) => s > UP_SCORE);

	let signal: DownlinkSignal = 'HOLD';
	let changed = false;

	if (downVote && state.targetRung > 0) {
		// DOWN one rung — never blocked by the cooldown.
		state.targetRung -= 1;
		signal = 'DOWN';
		changed = true;
		state.evidenceBuf = []; // fresh window after a change
		// FAILED CLIMB: a DOWN inside the wait window after an UP doubles the cooldown exactly once.
		if (state.ticksSinceUp <= state.cooldownLen) {
			state.cooldownLen = Math.min(state.cooldownLen * 2, COOLDOWN_MAX);
			state.upBlockedFor = state.cooldownLen;
			state.ticksSinceUp = COOLDOWN_MAX + 1;
		}
		state.ticksSinceDown = 0;
	} else if (upVote && state.upBlockedFor === 0 && state.targetRung < TOP_RUNG) {
		// UP one rung — gated by the backoff.
		state.targetRung += 1;
		signal = 'UP';
		changed = true;
		state.evidenceBuf = []; // fresh window after a change
		state.ticksSinceUp = 0;
		if (state.ticksSinceDown >= RESET_STABLE) {
			state.cooldownLen = COOLDOWN_BASE;
			state.upBlockedFor = 0;
		}
	}

	// Stability reset: after RESET_STABLE ticks with no DOWN, return the cooldown to base.
	if (state.ticksSinceDown >= RESET_STABLE && state.cooldownLen > COOLDOWN_BASE) {
		state.cooldownLen = COOLDOWN_BASE;
		state.upBlockedFor = 0;
	}

	return { state, targetRung: state.targetRung, changed, signal };
}
