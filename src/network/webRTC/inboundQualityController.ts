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
 * (clear < 2%, hold 2-10%, congested > 10%) to pick one of the 3 simulcast substreams, with
 * asymmetric hysteresis (drop fast, climb slow with an escalating patience that doubles after
 * a failed climb) so it does not oscillate. Up-climbing is inherently a probe (try the higher
 * layer, watch for loss) because the receiver has no way to measure headroom in advance.
 * If Janus ever ships subscriber BWE (cf. unmerged PR meetecho/janus-gateway#3278) this
 * belongs server-side and this whole client controller should be revisited.
 */

export type QualityState = {
	substream: 0 | 1 | 2;
	goodStreak: number;
	badStreak: number;
	// consecutive-ish high-loss pressure; forces a drop when a lossy link plateaus (jbd not rising)
	highLossStreak: number;
	// escalating up-patience per boundary: failCount[0] = 0->1, failCount[1] = 1->2
	failCount: [number, number];
	ticksSinceChange: number;
	lastChangeUp: boolean;
	change?: 0 | 1 | 2;
	off?: boolean;
};

// GCC loss bands (draft-ietf-rmcat-gcc-02 s6): standard, not arbitrary.
const LOSS_LOW = 0.02; // < 2% => clear, may climb
const LOSS_HIGH = 0.1; // > 10% => congested (with Wi-Fi guard), must drop
const LOSS_CATA = 0.25; // > 25% => catastrophic, drop even without the guard
const DOWN_TICKS = 2; // consecutive congested ticks before dropping (or turning off at 0)
const UP_BASE = 4; // base clean-tick streak to climb one layer
const UP_MAX = 32; // cap for the escalating patience
const OBSERVE = 4; // a drop within this many ticks of a climb = the climb failed
const FAIL_MAX = 5;
// consecutive high-loss ticks that force a drop even without a rising jitter buffer, so a link
// stuck at a stable-but-lossy level (jbdRising false) does not hold its layer forever.
const FORCE_DROP_TICKS = 4;

const upNeed = (boundary: 0 | 1, failCount: [number, number]): number =>
	Math.min(UP_BASE * 2 ** failCount[boundary], UP_MAX);

export const initialQualityState = (start: 0 | 1 | 2 = 2): QualityState => ({
	substream: start,
	goodStreak: 0,
	badStreak: 0,
	highLossStreak: 0,
	failCount: [0, 0],
	ticksSinceChange: 0,
	lastChangeUp: false
});

// Congested tick: count it; drop one layer (or turn off at the bottom) after DOWN_TICKS in a row.
// A drop within OBSERVE ticks of a climb means that climb failed -> raise that boundary's patience.
function applyCongested(prev: QualityState): QualityState {
	const st: QualityState = { ...prev, failCount: [prev.failCount[0], prev.failCount[1]] };
	st.badStreak += 1;
	st.goodStreak = 0;
	if (st.badStreak < DOWN_TICKS) return st;
	st.badStreak = 0;
	if (st.substream === 0) {
		st.off = true;
		return st;
	}
	if (st.lastChangeUp && st.ticksSinceChange <= OBSERVE) {
		const b = (st.substream - 1) as 0 | 1;
		st.failCount[b] = Math.min(st.failCount[b] + 1, FAIL_MAX);
	}
	st.substream = (st.substream - 1) as 0 | 1 | 2;
	st.change = st.substream;
	st.ticksSinceChange = 0;
	st.lastChangeUp = false;
	return st;
}

// Clear tick: count it; a climb that has survived OBSERVE ticks forgives one failure on its
// boundary; climb one layer once the (escalating) clean streak is met and the buffer is not rising.
function applyClear(prev: QualityState, jbdRising: boolean): QualityState {
	const st: QualityState = { ...prev, failCount: [prev.failCount[0], prev.failCount[1]] };
	st.goodStreak += 1;
	st.badStreak = 0;
	if (st.lastChangeUp && st.ticksSinceChange >= OBSERVE && st.substream > 0) {
		const b = (st.substream - 1) as 0 | 1;
		st.failCount[b] = Math.max(0, st.failCount[b] - 1);
		st.lastChangeUp = false; // climb survived; a later drop is fresh congestion, not this climb failing
	}
	if (st.substream >= 2 || jbdRising) return st;
	const b = st.substream as 0 | 1;
	if (st.goodStreak < upNeed(b, st.failCount)) return st;
	st.substream = (st.substream + 1) as 0 | 1 | 2;
	st.change = st.substream;
	st.goodStreak = 0;
	st.ticksSinceChange = 0;
	st.lastChangeUp = true;
	return st;
}

/**
 * One evaluation tick. `lossRate` is the delta loss fraction over the tick; `jbdRising` is
 * true when the receiver's jitter-buffer delay is trending up (a congestion confirmer that
 * lets us reject Wi-Fi/cellular random loss — direction only, no magnitude threshold).
 * Returns the next state; `change` is set to the new substream when it changed (so the caller
 * relays it to Janus), `off` is set when a feed at the lowest layer is still unusable.
 */
export function decideSubstream(
	prev: QualityState,
	sample: { lossRate: number; jbdRising: boolean }
): QualityState {
	const base: QualityState = {
		...prev,
		failCount: [prev.failCount[0], prev.failCount[1]],
		change: undefined,
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
