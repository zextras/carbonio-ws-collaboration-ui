/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/*
 * Downlink quality selection — driven ENTIRELY by the stability vote (computed client-side on purpose).
 *
 * In an SFU topology the only entity that could estimate a subscriber's downlink is the SFU itself (it is
 * the RTP sender toward us), NOT this browser. Janus v1.4.0 (our pinned engine) implements NO subscriber-side
 * bandwidth estimation: it parses then DISCARDS the subscriber's transport-cc feedback (rtcp.c,
 * janus_rtcp_incoming_transport_cc: "TODO ...") and IGNORES the subscriber's REMB (janus_videoroom.c:
 * "FIXME ... should we do something about it?"). So the receiver cannot MEASURE its downlink capacity.
 *
 * DESIGN (2026-08-27 / revised 2026-09-01): the received quality FOLLOWS a single GLOBAL targetRung.
 * WHY global: the subscriber's downlink is ONE shared pipe; a congested downlink must lower ALL feeds
 * uniformly and it scales O(1) regardless of how many participants are on screen.
 *
 * Per-feed EFFECTIVE rung = min(targetRung, senderMax[feed]).  A feed whose sender only publishes a
 * lower tier stays at its cap; all others track the global target.
 *
 * RUNG EVIDENCE (Phase-3 core fix): the DOWN/UP decision uses a RESETTABLE per-rung evidence buffer
 * that is wiped on every rung change.  WHY: lowering/raising quality changes the measured loss, so
 * votes gathered BEFORE a change are stale; each rung step must be justified by evidence gathered AFTER
 * the previous change — otherwise the same votes cascade multiple steps and over-shoot.
 *
 * DOWN: evidenceBuf atLeast(3/4, bars <= 2)  → targetRung--; apply to ALL feeds; reset evidenceBuf.
 * At targetRung 0 + still DOWN → AUTO-OFF all feeds.
 * UP:   evidenceBuf atLeast(7/8, bars === 5) → targetRung++ (with cooldown-backoff); apply to all.
 * From AUTO-OFF + UP → re-subscribe all feeds at targetRung 1.
 *
 * SNACKBAR stays on its OWN window (warnVote 8/10 / restoreVote 10/13 from OfficialVoteWindow in
 * ConnectionQualityMonitor) — it is NEVER reset on a rung change, so the user always sees a warning
 * when the link is persistently poor regardless of how many rung steps already happened.
 *
 * TWO-DIMENSIONAL rung ladder (resolution before framerate). Each of the 3 VP8 simulcast substreams
 * (spatial: 720/360/144) is split into a FULL and a BASE (temporal) rung, giving one ordered ladder 5..0.
 */

import { atLeast } from './officialVoteWindow';

export const TOP_RUNG = 5; // best rung (720, full fps)

// Evidence thresholds for the resettable rung-change tracker (counts since last rung change).
export const EVIDENCE_DOWN_N = 3; // need ≥3 poor bars in the last…
export const EVIDENCE_DOWN_M = 4; // …4 ticks since last change
export const EVIDENCE_UP_N = 7; // need ≥7 optimal bars in the last…
export const EVIDENCE_UP_M = 8; // …8 ticks since last change
const EVIDENCE_CAP = EVIDENCE_UP_M; // max entries kept in evidenceBuf

// UP cooldown-backoff constants (units: ticks; 1 tick = 2 s).
export const COOLDOWN_BASE = 8; // 16 s — initial / reset cooldown length
export const COOLDOWN_MAX = 32; // 64 s — maximum cooldown after repeated failed climbs
export const RESET_STABLE = 32; // 64 s — no-DOWN ticks required to reset cooldown to base

// Never let a FRAMERATE (temporal) step land below this — a slideshow is worse than lower resolution, so
// when the base rung would fall below it we drop resolution instead.
export const FPS_FLOOR = 14;

// rung -> (substream, Janus temporal target). temporal 2 = all layers (native fps), 1 = the MID temporal
// layer (~half fps). We deliberately never request the base-only layer (0 ≈ quarter fps = slideshow).
export function layersOf(rung: number): { substream: 0 | 1 | 2; temporal: 1 | 2 } {
	return {
		substream: Math.floor(rung / 2) as 0 | 1 | 2,
		temporal: (rung % 2 === 1 ? 2 : 1) as 1 | 2
	};
}

function changeFields(
	toRung: number,
	fromRung: number
): { changeSubstream: 0 | 1 | 2; changeTemporal: 1 | 2; substreamChanged: boolean } {
	const { substream, temporal } = layersOf(toRung);
	return {
		changeSubstream: substream,
		changeTemporal: temporal,
		substreamChanged: layersOf(fromRung).substream !== substream
	};
}

// PER-FEED state: effective rung = min(targetRung, senderMax) — updated on every DOWN/UP event.
// ticksSinceChange is kept so logs can attribute how long a feed has been at a given rung.
export type FeedState = {
	rung: number; // current effective rung (min of global target and sender cap)
	ticksSinceChange: number;
};

export function initialFeedState(rung: number): FeedState {
	return { rung, ticksSinceChange: 0 };
}

export type CentralDownlinkState = {
	targetRung: number; // 0..TOP_RUNG — global rung target for all feeds
	allAutoOff: boolean; // true when all feeds have been suppressed (targetRung was 0 + DOWN fired)
	feeds: Map<string, FeedState>;
	tick: number;
	// Resettable evidence buffer: display-bars since the last rung change.
	// Reset (emptied) on every targetRung change or auto-off event.
	evidenceBuf: number[];
	// UP cooldown-backoff state.
	cooldownLen: number; // current cooldown length (ticks); doubles on a failed climb
	upBlockedFor: number; // ticks remaining before UP is allowed (0 = unblocked)
	ticksSinceUp: number; // ticks elapsed since the last UP fired
	ticksSinceDown: number; // ticks elapsed since the last DOWN fired
};

export type DownlinkChange = {
	key: string;
	fromRung: number;
	rung: number;
	changeSubstream?: 0 | 1 | 2;
	changeTemporal?: 1 | 2;
	substreamChanged?: boolean;
	off?: true;
};

export function initialCentralState(): CentralDownlinkState {
	return {
		targetRung: TOP_RUNG,
		allAutoOff: false,
		feeds: new Map(),
		tick: 0,
		evidenceBuf: [],
		cooldownLen: COOLDOWN_BASE,
		upBlockedFor: 0,
		ticksSinceUp: COOLDOWN_MAX + 1,
		ticksSinceDown: RESET_STABLE + 1
	};
}

// Compute the new effective rung for a feed given the global targetRung and senderMax (if known).
function effectiveRung(targetRung: number, senderMax: number | undefined): number {
	return senderMax !== undefined ? Math.min(targetRung, senderMax) : targetRung;
}

/**
 * Centralized tick: reads per-tick display-vote bars and returns ALL rung changes across all feeds.
 * The returned state is a fresh clone — the caller replaces its reference.
 *
 * DOWN/UP decisions use a resettable evidenceBuf (reset on every rung change) so stale pre-change
 * votes cannot cascade multiple steps. Priority: DOWN > UP > HOLD.
 */
export function decideDownlink(
	prev: CentralDownlinkState,
	// Received fps per on-screen webcam feed this tick — for the FPS_FLOOR resolution-vs-framerate
	// choice on a down-step. Feeds absent here have unknown fps.
	fpsByFeed: Map<string, number>,
	// Display-vote bars this tick (0-5) — appended to evidenceBuf for the rung-change decision.
	bars: number,
	// senderMaxRung per feed key — min(targetRung, senderMax) = per-feed effective rung.
	senderMaxByFeed: Map<string, number>
): { state: CentralDownlinkState; changes: DownlinkChange[] } {
	const state: CentralDownlinkState = {
		targetRung: prev.targetRung,
		allAutoOff: prev.allAutoOff,
		feeds: new Map(
			Array.from(prev.feeds.entries()).map(([k, v]) => [
				k,
				{ rung: v.rung, ticksSinceChange: v.ticksSinceChange + 1 }
			])
		),
		tick: prev.tick + 1,
		evidenceBuf: prev.evidenceBuf.slice(), // clone
		cooldownLen: prev.cooldownLen,
		upBlockedFor: Math.max(0, prev.upBlockedFor - 1),
		ticksSinceUp: prev.ticksSinceUp + 1,
		ticksSinceDown: prev.ticksSinceDown + 1
	};

	// Accumulate display-vote bars into the resettable evidence buffer (capped at EVIDENCE_CAP).
	state.evidenceBuf.push(bars);
	if (state.evidenceBuf.length > EVIDENCE_CAP) state.evidenceBuf.shift();

	const rungDown = atLeast(state.evidenceBuf, EVIDENCE_DOWN_N, EVIDENCE_DOWN_M, (b) => b <= 2);
	const rungUp = atLeast(state.evidenceBuf, EVIDENCE_UP_N, EVIDENCE_UP_M, (b) => b === 5);

	// (1) DOWN — apply to ALL feeds at once. DOWN is NEVER blocked by the cooldown.
	if (rungDown) {
		if (state.allAutoOff) {
			// Already fully suppressed; no further action. Evidence keeps accumulating.
			state.ticksSinceDown = 0;
			return { state, changes: [] };
		}

		const changes: DownlinkChange[] = [];

		if (state.targetRung === 0) {
			// Floor reached — AUTO-OFF every active feed.
			state.allAutoOff = true;
			state.feeds.forEach((fs, key) => {
				const fromRung = fs.rung;
				state.feeds.set(key, { rung: 0, ticksSinceChange: 0 });
				changes.push({ key, fromRung, rung: 0, off: true });
			});
		} else {
			// Step the global target down one rung.
			const fromTarget = state.targetRung;
			let newTarget = fromTarget - 1;

			// FPS floor: if the step is a temporal (same-substream) step and the minimum fps across
			// feeds would fall below FPS_FLOOR after halving, skip the temporal rung entirely.
			const isTemporalStep = layersOf(fromTarget).substream === layersOf(newTarget).substream;
			if (isTemporalStep && fpsByFeed.size > 0) {
				const minFps = Math.min(...fpsByFeed.values());
				if (minFps / 2 < FPS_FLOOR && newTarget - 1 >= 0) {
					newTarget -= 1;
				}
			}

			state.targetRung = newTarget;

			// Apply the new effective rung to every feed.
			state.feeds.forEach((fs, key) => {
				const fromRung = fs.rung;
				const senderMax = senderMaxByFeed.get(key);
				const newRung = effectiveRung(newTarget, senderMax);
				state.feeds.set(key, { rung: newRung, ticksSinceChange: 0 });
				if (newRung !== fromRung) {
					changes.push({ key, fromRung, rung: newRung, ...changeFields(newRung, fromRung) });
				}
			});
		}

		// FAILED CLIMB: a DOWN soon after an UP doubles the cooldown exactly once per climb-then-drop
		// event. ticksSinceUp is reset to COOLDOWN_MAX+1 so subsequent cascade steps don't re-double.
		if (state.ticksSinceUp <= state.cooldownLen) {
			state.cooldownLen = Math.min(state.cooldownLen * 2, COOLDOWN_MAX);
			state.upBlockedFor = state.cooldownLen;
			state.ticksSinceUp = COOLDOWN_MAX + 1;
		}
		state.ticksSinceDown = 0;
		// Fresh evidence window: the next rung decision needs bars gathered AFTER this change.
		state.evidenceBuf = [];
		return { state, changes };
	}

	// (2) UP — apply to ALL feeds at once. Gated by the UP cooldown.
	if (rungUp && state.upBlockedFor === 0) {
		const changes: DownlinkChange[] = [];

		if (state.allAutoOff) {
			// Re-enable from AUTO-OFF: jump targetRung to 1 and re-subscribe all feeds.
			state.allAutoOff = false;
			state.targetRung = 1;
			state.feeds.forEach((fs, key) => {
				const fromRung = fs.rung;
				const senderMax = senderMaxByFeed.get(key);
				const newRung = effectiveRung(1, senderMax);
				state.feeds.set(key, { rung: newRung, ticksSinceChange: 0 });
				changes.push({ key, fromRung, rung: newRung, ...changeFields(newRung, fromRung) });
			});
		} else if (state.targetRung < TOP_RUNG) {
			state.targetRung += 1;
			state.feeds.forEach((fs, key) => {
				const fromRung = fs.rung;
				const senderMax = senderMaxByFeed.get(key);
				const newRung = effectiveRung(state.targetRung, senderMax);
				state.feeds.set(key, { rung: newRung, ticksSinceChange: 0 });
				if (newRung !== fromRung) {
					changes.push({ key, fromRung, rung: newRung, ...changeFields(newRung, fromRung) });
				}
			});
		}

		if (changes.length > 0) {
			state.ticksSinceUp = 0;
			// RESET: if no DOWN for RESET_STABLE ticks, return cooldown to base.
			if (state.ticksSinceDown >= RESET_STABLE) {
				state.cooldownLen = COOLDOWN_BASE;
				state.upBlockedFor = 0;
			}
			// Fresh evidence window after a rung change.
			state.evidenceBuf = [];
		}
		return { state, changes };
	}

	// (3) HOLD (or UP blocked) — nothing moves.
	if (state.ticksSinceDown >= RESET_STABLE) {
		state.cooldownLen = COOLDOWN_BASE;
		state.upBlockedFor = 0;
	}
	return { state, changes: [] };
}
