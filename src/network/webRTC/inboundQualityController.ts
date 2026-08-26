/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/*
 * Passive, loss-driven downlink quality selection — computed CLIENT-SIDE on purpose.
 *
 * In an SFU topology the only entity that could estimate a subscriber's downlink is the
 * SFU itself (it is the RTP sender toward us), NOT this browser. But Janus — v1.4.0, our
 * pinned engine — implements NO subscriber-side bandwidth estimation: it parses then
 * DISCARDS the subscriber's transport-cc feedback (rtcp.c, janus_rtcp_incoming_transport_cc:
 * "TODO Update the context with the feedback we got") and IGNORES the subscriber's REMB
 * (janus_videoroom.c, janus_videoroom_incoming_rtcp: "FIXME ... should we do something
 * about it?"). No standard WebRTC channel hands a server-computed downlink estimate to a
 * receiving browser either. Consequence: the receiver cannot MEASURE its available downlink
 * capacity; it can only INFER it passively from packet loss. This controller is a deliberate
 * hand-rolled stand-in for the missing GCC: it applies the classic GCC loss-controller bands
 * (clear < 2%, hold 2-5%, congested > 5%) — dropping one rung immediately on a congested tick
 * and climbing only after an escalating clean streak (exponential backoff: UP_BASE * 2^failCount
 * capped at UP_MAX) so it does not oscillate. A drop within OBSERVE ticks of a climb marks that
 * climb as failed and raises the patience on that boundary. A climb that survives OBSERVE ticks
 * forgives one failure. Up-climbing is inherently a probe (try the higher rung, watch for loss)
 * because the receiver has no way to measure headroom in advance. If Janus ever ships subscriber
 * BWE (cf. unmerged PR meetecho/janus-gateway#3278) this belongs server-side and this controller
 * should be revisited.
 *
 * TWO-DIMENSIONAL rung ladder (resolution before framerate). Each of the 3 VP8 simulcast
 * substreams (spatial: 720/360/144) is split into a FULL and a BASE (temporal) rung, giving a
 * single ordered ladder rung 5..0. A FRAMERATE step (drop the temporal layer, Janus temporal
 * target 0 = base only) is FREEZE-FREE — the VP8 base layer stays decodable, no keyframe — so
 * it is spent FIRST on every substream; a RESOLUTION step (change the substream) needs a
 * keyframe and briefly freezes, so it is spent only after the framerate step is used up.
 * Resolution is treated as more valuable than framerate: rung 4 (720@base fps) ranks ABOVE
 * rung 3 (360@full fps). Cross-browser: if a publisher's VP8 encoder emits a single temporal
 * layer (some Safari/iOS, hardware encoders), Janus silently clamps the temporal request and
 * the BASE rungs behave like their FULL sibling — the ladder degrades gracefully to
 * resolution-only, per-sender, never room-wide.
 *
 * CENTRALIZED CONTROLLER: one CentralDownlinkState covers ALL on-screen webcam feeds.
 * Benefits: ordered degradation (drop the HIGHEST feed first → equalized tiles), staggered
 * climbs (one at a time → no keyframe burst), and a SHARED per-boundary backoff (the room
 * learns "HIGH doesn't fit" once instead of each feed re-probing). One change per tick makes
 * the log fully traceable.
 */

// GCC loss bands (draft-ietf-rmcat-gcc-02 s6): standard, not arbitrary.
const LOSS_LOW = 0.02; // < 2% => clear, may climb
const LOSS_HIGH = 0.05; // > 5% => congested — drop downlink webcam EARLY to protect un-adaptable audio
const UP_BASE = 8; // base clean-tick streak to climb one rung — slow climb-back avoids oscillation
const UP_MAX = 32; // cap for the escalating patience
const OBSERVE = 4; // a drop within this many ticks of a climb = the climb failed
const FAIL_MAX = 5; // ceiling for per-boundary failCount
export const TOP_RUNG = 5; // best rung (720, full fps)
const N_BOUNDARIES = 5; // boundaries 0..4 (climb rung b -> b+1)

// Minimum |fps - lastLogged| to emit a fps-only log entry (avoids 30↔31 spam).
export const FPS_LOG_DELTA = 5;

// rung -> (substream, Janus temporal target). temporal 2 = all layers (native fps), 0 = base only.
export function layersOf(rung: number): { substream: 0 | 1 | 2; temporal: 0 | 2 } {
	return {
		substream: Math.floor(rung / 2) as 0 | 1 | 2,
		temporal: (rung % 2 === 1 ? 2 : 0) as 0 | 2
	};
}

// true on the BASE (framerate-reduced) rungs — used by the connection-quality vote.
export const isReducedFramerate = (rung: number): boolean => rung % 2 === 0;

const upNeed = (boundary: number, failCount: number[]): number =>
	Math.min(UP_BASE * 2 ** failCount[boundary], UP_MAX);

function changeFields(
	toRung: number,
	fromRung: number
): { changeSubstream: 0 | 1 | 2; changeTemporal: 0 | 2; substreamChanged: boolean } {
	const { substream, temporal } = layersOf(toRung);
	return {
		changeSubstream: substream,
		changeTemporal: temporal,
		substreamChanged: layersOf(fromRung).substream !== substream
	};
}

export type CentralDownlinkState = {
	// PER-FEED: rung (5..0) and ticks since the last rung change (tiebreaker).
	feeds: Map<string, { rung: number; ticksSinceChange: number }>;
	// SHARED: consecutive link-clean ticks.
	cleanStreak: number;
	// SHARED: per-boundary backoff (boundary b = climb rung b -> b+1). 5 boundaries [0..4].
	failCount: number[];
	// SHARED: the single in-flight climb being confirmed (probe lock).
	probing?: { key: string; boundary: number; tick: number };
	tick: number;
};

export type DownlinkChange = {
	key: string;
	fromRung: number;
	rung: number;
	changeSubstream?: 0 | 1 | 2;
	changeTemporal?: 0 | 2;
	substreamChanged?: boolean;
	off?: true;
};

export function initialCentralState(): CentralDownlinkState {
	return {
		feeds: new Map(),
		cleanStreak: 0,
		failCount: new Array(N_BOUNDARIES).fill(0),
		tick: 0
	};
}

/**
 * Centralized tick: consumes one sample per on-screen webcam feed and returns AT MOST ONE
 * rung change across the whole room. The returned state is a fresh clone — the caller replaces
 * its reference. Decision priority: DROP (highest congested, immediate) > CLIMB (lowest
 * eligible, probe-locked) > dead band / jbdRising (hold).
 */
export function decideDownlink(
	prev: CentralDownlinkState,
	samplesByFeed: Map<string, { lossRate: number; jbdRising: boolean }>
): { state: CentralDownlinkState; change?: DownlinkChange } {
	// Clone state; increment ticksSinceChange for every feed in the same pass.
	const state: CentralDownlinkState = {
		feeds: new Map(
			Array.from(prev.feeds.entries()).map(([k, v]) => [
				k,
				{ rung: v.rung, ticksSinceChange: v.ticksSinceChange + 1 }
			])
		),
		cleanStreak: prev.cleanStreak,
		failCount: [...prev.failCount],
		probing: prev.probing ? { ...prev.probing } : undefined,
		tick: prev.tick + 1
	};

	// Classify feeds from this tick's samples.
	const congestedKeys: string[] = [];
	let maxLossRate = 0;
	let anyJbdRising = false;

	samplesByFeed.forEach((sample, key) => {
		if (!state.feeds.has(key)) return;
		if (sample.lossRate > LOSS_HIGH) congestedKeys.push(key);
		if (sample.lossRate > maxLossRate) maxLossRate = sample.lossRate;
		if (sample.jbdRising) anyJbdRising = true;
	});

	const linkClean = maxLossRate < LOSS_LOW && !anyJbdRising;

	// (1) DROP — highest-rung congested feed, one per tick, immediate.
	if (congestedKeys.length > 0) {
		// If an in-flight climb failed (drop arrived within OBSERVE ticks), penalize that boundary.
		if (state.probing && state.tick - state.probing.tick <= OBSERVE) {
			state.failCount[state.probing.boundary] = Math.min(
				state.failCount[state.probing.boundary] + 1,
				FAIL_MAX
			);
			state.probing = undefined;
		}
		state.cleanStreak = 0;

		// Target: highest rung; tie-break: largest ticksSinceChange (round-robin fairness).
		const targetKey = congestedKeys.reduce((best, key) => {
			const a = state.feeds.get(key)!;
			const b = state.feeds.get(best)!;
			return a.rung > b.rung || (a.rung === b.rung && a.ticksSinceChange > b.ticksSinceChange)
				? key
				: best;
		});

		const feedState = state.feeds.get(targetKey)!;
		const fromRung = feedState.rung;
		feedState.ticksSinceChange = 0;
		if (feedState.rung === 0) {
			return { state, change: { key: targetKey, fromRung, rung: 0, off: true } };
		}
		feedState.rung -= 1;
		return {
			state,
			change: {
				key: targetKey,
				fromRung,
				rung: feedState.rung,
				...changeFields(feedState.rung, fromRung)
			}
		};
	}

	// (2) CLIMB — one feed at a time, CONFIRMED before the next.
	if (linkClean) {
		state.cleanStreak += 1;
		if (state.probing) {
			if (state.tick - state.probing.tick >= OBSERVE) {
				// Probe survived: decay failCount at that boundary, unlock for next climb.
				state.failCount[state.probing.boundary] = Math.max(
					0,
					state.failCount[state.probing.boundary] - 1
				);
				state.probing = undefined;
			}
			// Whether just confirmed or still in flight, no new climb this tick.
			return { state };
		}

		// Eligible: not yet at top AND clean streak meets the (possibly elevated) upNeed.
		const climbTarget = Array.from(state.feeds.entries())
			.filter(
				([, fs]) => fs.rung < TOP_RUNG && state.cleanStreak >= upNeed(fs.rung, state.failCount)
			)
			.reduce<{ key: string; rung: number; ticks: number } | undefined>((acc, [key, feedState]) => {
				if (
					acc === undefined ||
					feedState.rung < acc.rung ||
					(feedState.rung === acc.rung && feedState.ticksSinceChange > acc.ticks)
				) {
					return { key, rung: feedState.rung, ticks: feedState.ticksSinceChange };
				}
				return acc;
			}, undefined);

		if (climbTarget !== undefined) {
			const feedState = state.feeds.get(climbTarget.key)!;
			const fromRung = feedState.rung;
			const boundary = feedState.rung;
			feedState.rung += 1;
			feedState.ticksSinceChange = 0;
			state.probing = { key: climbTarget.key, boundary, tick: state.tick };
			return {
				state,
				change: {
					key: climbTarget.key,
					fromRung,
					rung: feedState.rung,
					...changeFields(feedState.rung, fromRung)
				}
			};
		}

		return { state };
	}

	// (3) Dead band (LOSS_LOW..LOSS_HIGH) or jbdRising: hold, reset clean streak.
	state.cleanStreak = 0;
	return { state };
}
