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
 */

export type QualityState = {
	// combined ladder position: 5 = best (sub2, full fps) down to 0 = (sub0, base fps); OFF is below 0
	rung: number;
	cleanStreak: number;
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
const LOSS_HIGH = 0.05; // > 5% => congested — drop downlink webcam EARLY to protect the un-adaptable audio (over-eager on purpose)
const UP_BASE = 8; // base clean-tick streak to climb one rung — slow climb-back to avoid the medium<->high bounce
const UP_MAX = 32; // cap for the escalating patience
const OBSERVE = 4; // a drop within this many ticks of a climb = the climb failed

const FAIL_MAX = 5;
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
	cleanStreak: 0,
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

/**
 * One evaluation tick. `lossRate` is the delta loss fraction over the tick; `jbdRising` is
 * true when the receiver's jitter-buffer delay is trending up (a congestion confirmer used to
 * gate climbs). Returns the next state; `changeSubstream`/`changeTemporal` are set to the
 * desired layers when the rung changed (so the caller relays them to Janus), `substreamChanged`
 * flags a resolution switch (keyframe -> mask), `off` is set when a feed at the lowest rung is
 * still unusable.
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

	const congested = sample.lossRate > LOSS_HIGH;
	const clean = sample.lossRate < LOSS_LOW;

	if (congested) {
		if (base.lastChangeUp && base.ticksSinceChange <= OBSERVE && base.rung > 0) {
			base.failCount[base.rung - 1] = Math.min(base.failCount[base.rung - 1] + 1, FAIL_MAX);
		}
		base.cleanStreak = 0;
		base.lastChangeUp = false;
		if (base.rung === 0) {
			base.off = true;
			return base;
		}
		const from = base.rung;
		base.rung -= 1;
		Object.assign(base, changeFields(base.rung, from));
		base.ticksSinceChange = 0;
		return base;
	}

	if (clean && !sample.jbdRising) {
		base.cleanStreak += 1;
		if (base.lastChangeUp && base.ticksSinceChange >= OBSERVE && base.rung > 0) {
			base.failCount[base.rung - 1] = Math.max(0, base.failCount[base.rung - 1] - 1);
			base.lastChangeUp = false;
		}
		if (base.rung < TOP_RUNG && base.cleanStreak >= upNeed(base.rung, base.failCount)) {
			const from = base.rung;
			base.rung += 1;
			Object.assign(base, changeFields(base.rung, from));
			base.cleanStreak = 0;
			base.lastChangeUp = true;
			base.ticksSinceChange = 0;
		}
		return base;
	}

	// dead band (LOSS_LOW..LOSS_HIGH) OR jbdRising: hold, reset the clean streak
	base.cleanStreak = 0;
	return base;
}
