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
 * (clear < 2%, hold 2-10%, congested > 10%) with asymmetric hysteresis (drop fast, climb slow
 * with an escalating patience that doubles after a failed climb) so it does not oscillate.
 * Up-climbing is inherently a probe (try the higher rung, watch for loss) because the receiver
 * has no way to measure headroom in advance. If Janus ever ships subscriber BWE (cf. unmerged
 * PR meetecho/janus-gateway#3278) this belongs server-side and this controller should be revisited.
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
 */

export type QualityState = {
	// combined ladder position: 5 = best (sub2, full fps) down to 0 = (sub0, base fps); OFF is below 0
	rung: number;
	goodStreak: number;
	badStreak: number;
	// consecutive-ish high-loss pressure; forces a drop when a lossy link plateaus (jbd not rising)
	highLossStreak: number;
	// escalating up-patience per boundary b (climb rung b -> b+1), 5 boundaries [0..4]
	failCount: number[];
	ticksSinceChange: number;
	lastChangeUp: boolean;
	// set on a tick that changed the rung: the desired substream/temporal target to relay to Janus,
	// and whether the SUBSTREAM changed (a resolution switch => keyframe => the caller must mask ticks).
	changeSubstream?: 0 | 1 | 2;
	changeTemporal?: 0 | 2;
	substreamChanged?: boolean;
	off?: boolean;
};

// GCC loss bands (draft-ietf-rmcat-gcc-02 s6): standard, not arbitrary.
const LOSS_LOW = 0.02; // < 2% => clear, may climb
const LOSS_HIGH = 0.1; // > 10% => congested (with Wi-Fi guard), must drop
const LOSS_CATA = 0.25; // > 25% => catastrophic, drop even without the guard
const DOWN_TICKS = 2; // consecutive congested ticks before dropping (or turning off at the bottom)
const UP_BASE = 4; // base clean-tick streak to climb one rung
const UP_MAX = 32; // cap for the escalating patience
const OBSERVE = 4; // a drop within this many ticks of a climb = the climb failed
const FAIL_MAX = 5;
// consecutive high-loss ticks that force a drop even without a rising jitter buffer, so a link
// stuck at a stable-but-lossy level (jbdRising false) does not hold its rung forever.
const FORCE_DROP_TICKS = 4;

const TOP_RUNG = 5;
const N_BOUNDARIES = 5;

// rung -> (substream, Janus temporal target). temporal 2 = all layers (native fps), 0 = base only.
export function layersOf(rung: number): { substream: 0 | 1 | 2; temporal: 0 | 2 } {
	return {
		substream: Math.floor(rung / 2) as 0 | 1 | 2,
		temporal: rung % 2 === 1 ? 2 : 0
	};
}

// true on the BASE (framerate-reduced) rungs — used by the connection-quality vote.
export const isReducedFramerate = (rung: number): boolean => rung % 2 === 0;

const upNeed = (boundary: number, failCount: number[]): number =>
	Math.min(UP_BASE * 2 ** failCount[boundary], UP_MAX);

export const initialQualityState = (startRung: number = TOP_RUNG): QualityState => ({
	rung: startRung,
	goodStreak: 0,
	badStreak: 0,
	highLossStreak: 0,
	failCount: new Array(N_BOUNDARIES).fill(0),
	ticksSinceChange: 0,
	lastChangeUp: false
});

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

// Congested tick: count it; drop one rung (or turn off at the bottom) after DOWN_TICKS in a row.
// A drop within OBSERVE ticks of a climb means that climb failed -> raise that boundary's patience.
function applyCongested(prev: QualityState): QualityState {
	const st: QualityState = { ...prev, failCount: [...prev.failCount] };
	st.badStreak += 1;
	st.goodStreak = 0;
	if (st.badStreak < DOWN_TICKS) return st;
	st.badStreak = 0;
	if (st.rung === 0) {
		st.off = true;
		return st;
	}
	if (st.lastChangeUp && st.ticksSinceChange <= OBSERVE) {
		const b = st.rung - 1;
		st.failCount[b] = Math.min(st.failCount[b] + 1, FAIL_MAX);
	}
	const from = st.rung;
	st.rung -= 1;
	Object.assign(st, changeFields(st.rung, from));
	st.ticksSinceChange = 0;
	st.lastChangeUp = false;
	return st;
}

// Clear tick: count it; a climb that has survived OBSERVE ticks forgives one failure on its
// boundary; climb one rung once the (escalating) clean streak is met and the buffer is not rising.
function applyClear(prev: QualityState, jbdRising: boolean): QualityState {
	const st: QualityState = { ...prev, failCount: [...prev.failCount] };
	st.goodStreak += 1;
	st.badStreak = 0;
	if (st.lastChangeUp && st.ticksSinceChange >= OBSERVE && st.rung > 0) {
		const b = st.rung - 1;
		st.failCount[b] = Math.max(0, st.failCount[b] - 1);
		st.lastChangeUp = false; // climb survived; a later drop is fresh congestion, not this climb failing
	}
	if (st.rung >= TOP_RUNG || jbdRising) return st;
	const b = st.rung;
	if (st.goodStreak < upNeed(b, st.failCount)) return st;
	const from = st.rung;
	st.rung += 1;
	Object.assign(st, changeFields(st.rung, from));
	st.goodStreak = 0;
	st.ticksSinceChange = 0;
	st.lastChangeUp = true;
	return st;
}

/**
 * One evaluation tick. `lossRate` is the delta loss fraction over the tick; `jbdRising` is
 * true when the receiver's jitter-buffer delay is trending up (a congestion confirmer that
 * lets us reject Wi-Fi/cellular random loss — direction only, no magnitude threshold).
 * Returns the next state; `changeSubstream`/`changeTemporal` are set to the desired layers when
 * the rung changed (so the caller relays them to Janus), `substreamChanged` flags a resolution
 * switch (keyframe -> mask), `off` is set when a feed at the lowest rung is still unusable.
 */
export function decideQuality(
	prev: QualityState,
	sample: { lossRate: number; jbdRising: boolean }
): QualityState {
	const base: QualityState = {
		...prev,
		failCount: [...prev.failCount],
		changeSubstream: undefined,
		changeTemporal: undefined,
		substreamChanged: undefined,
		off: undefined
	};
	base.ticksSinceChange += 1;

	const highLoss = sample.lossRate > LOSS_HIGH;
	// build on high loss, decay slowly through the dead band, reset on a genuinely clean tick
	if (highLoss) base.highLossStreak = prev.highLossStreak + 1;
	else if (sample.lossRate < LOSS_LOW) base.highLossStreak = 0;
	else base.highLossStreak = Math.max(0, prev.highLossStreak - 1);

	const congested =
		highLoss &&
		(sample.jbdRising || sample.lossRate > LOSS_CATA || base.highLossStreak >= FORCE_DROP_TICKS);
	const clear = sample.lossRate < LOSS_LOW;

	if (congested) return applyCongested(base);
	if (clear) return applyClear(base, sample.jbdRising);
	// dead band (2-10%): hold, require a fresh clean run before climbing again.
	return { ...base, badStreak: 0, goodStreak: 0 };
}
