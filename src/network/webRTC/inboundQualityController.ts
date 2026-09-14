/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// Per-feed downlink controller. Janus v1.4.0 exposes no subscriber-side BWE, so every UP is a blind
// probe guarded by N-of-M fps evidence + exponential backoff on a failed climb.
// senderOK gates DOWN: fps low + sender bad → HOLD (their upload, not ours). undefined score → HOLD.

// 3-rung substream ladder: 0 = 144p, 1 = 360p, 2 = 720p. Floor 0, no "off".
export const TOP_RUNG = 2;

export const DOWN_SCORE = 2.7; // fps score <= this counts as "low fps" (~4 fps at HEALTHY_FPS 15)
export const UP_SCORE = 9; // fps score >= this counts as "clean" this tick
export const EVIDENCE_DOWN_N = 3; // low fps in >= 3 of the last 4 ticks -> shed (sustained, anti-blip)
export const EVIDENCE_DOWN_M = 4;
export const COOLDOWN_BASE = 12; // clean ticks required before an UP (24 s); doubles on a failed climb
export const COOLDOWN_MAX = 32; // 64 s; backoff is monotonic per feed — escalates on failed climb, never resets

export type DownlinkSignal = 'DOWN' | 'UP' | 'HOLD';

export type FeedDownlinkState = {
	targetRung: number;
	evidenceBuf: number[]; // recent fps scores, for the DOWN N-of-M
	cleanStreak: number; // consecutive ticks with fps score >= UP_SCORE, for the UP
	cooldownLen: number; // clean ticks needed before an UP (the backoff wait)
	ticksSinceUp: number;
};

export function initialFeedState(rung: number = TOP_RUNG): FeedDownlinkState {
	return {
		targetRung: rung,
		evidenceBuf: [],
		cleanStreak: 0,
		cooldownLen: COOLDOWN_BASE,
		ticksSinceUp: COOLDOWN_MAX + 1
	};
}

export type DownlinkDecision = {
	state: FeedDownlinkState;
	targetRung: number;
	changed: boolean;
	signal: DownlinkSignal;
};

const EVIDENCE_CAP = 5; // >= EVIDENCE_DOWN_M

export function decideFeedDownlink(
	prev: FeedDownlinkState,
	score: number | undefined,
	senderOK: boolean
): DownlinkDecision {
	const state: FeedDownlinkState = {
		targetRung: prev.targetRung,
		evidenceBuf: prev.evidenceBuf.slice(),
		cleanStreak: prev.cleanStreak,
		cooldownLen: prev.cooldownLen,
		ticksSinceUp: prev.ticksSinceUp + 1
	};

	if (score === undefined) {
		return { state, targetRung: state.targetRung, changed: false, signal: 'HOLD' };
	}

	state.evidenceBuf.push(score);
	if (state.evidenceBuf.length > EVIDENCE_CAP) state.evidenceBuf.shift();

	state.cleanStreak = score >= UP_SCORE ? prev.cleanStreak + 1 : 0;

	const last = state.evidenceBuf.slice(-EVIDENCE_DOWN_M);
	const frozenCount = last.filter((s) => s <= DOWN_SCORE).length;
	const downVote = frozenCount >= EVIDENCE_DOWN_N;
	const upVote = state.cleanStreak >= state.cooldownLen;

	let signal: DownlinkSignal = 'HOLD';
	let changed = false;

	if (downVote && state.targetRung > 0 && senderOK) {
		state.targetRung -= 1;
		signal = 'DOWN';
		changed = true;
		state.evidenceBuf = [];
		state.cleanStreak = 0;
		if (state.ticksSinceUp <= state.cooldownLen) {
			state.cooldownLen = Math.min(state.cooldownLen * 2, COOLDOWN_MAX);
			state.ticksSinceUp = COOLDOWN_MAX + 1;
		}
	} else if (upVote && state.targetRung < TOP_RUNG) {
		state.targetRung += 1;
		signal = 'UP';
		changed = true;
		state.evidenceBuf = [];
		state.cleanStreak = 0;
		state.ticksSinceUp = 0;
	}

	return { state, targetRung: state.targetRung, changed, signal };
}
