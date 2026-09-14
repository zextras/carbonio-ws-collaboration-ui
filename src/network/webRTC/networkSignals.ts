/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// Reading primitives for the own-leg badge signals — uplink loss, RTT and jitter (all me<->Janus).

const REMOTE_INBOUND_RTP = 'remote-inbound-rtp';
const CANDIDATE_PAIR = 'candidate-pair';
const OUTBOUND_RTP = 'outbound-rtp';
const TRANSPORT = 'transport';

// RTT (ms) from the SELECTED candidate-pair of a PC's stats — the whole me<->Janus round-trip.
// Resolved by identity (transport.selectedCandidatePairId) so Firefox's multiple nominated+succeeded
// pairs cannot inject a stale 0 by being the last iterated entry. Returns undefined when the pair
// has currentRoundTripTime === 0 (treat 0/absent as "no reading", never a fake-zero injection).
export function readCandidatePairRttMs(stats: RTCStatsReport | null): number | undefined {
	if (stats == null) return undefined;

	type Pair = RTCStats & { currentRoundTripTime?: number; selected?: boolean };
	let selectedId: string | undefined;
	let firefoxSelected: Pair | undefined;
	const pairsById = new Map<string, Pair>();
	stats.forEach((r: RTCStats & { selectedCandidatePairId?: string; selected?: boolean }) => {
		if (r.type === TRANSPORT) selectedId = r.selectedCandidatePairId;
		else if (r.type === CANDIDATE_PAIR) {
			pairsById.set(r.id, r);
			if (r.selected === true) firefoxSelected = r;
		}
	});

	const pair = (selectedId != null ? pairsById.get(selectedId) : undefined) ?? firefoxSelected;
	if (pair == null) return undefined;
	const rtt = pair.currentRoundTripTime;
	return rtt != null && rtt > 0 ? rtt * 1000 : undefined;
}

// Outbound ssrcs with framesPerSecond > 0 (encoding). A simulcast layer GCC parks stops encoding (fps 0)
// and is excluded so its stale remote-inbound jitter/loss cannot pollute the vote. Non-video senders
// (audio) have no framesPerSecond and are always included.
export function sendingSsrcs(stats: RTCStatsReport | null): Set<number> {
	const active = new Set<number>();
	if (stats == null) return active;
	stats.forEach((r: RTCStats & { ssrc?: number; framesPerSecond?: number }) => {
		if (r.type !== OUTBOUND_RTP || r.ssrc == null) return;
		if (r.framesPerSecond === undefined || r.framesPerSecond > 0) active.add(r.ssrc);
	});
	return active;
}

// A real RTCP inter-arrival jitter never exceeds a couple of seconds; larger values are getStats
// glitches (seen: jitter 198361ms from a counter reset/wrap) and must not read as congestion.
const JITTER_SANITY_MAX_MS = 2000;

// Worst uplink jitter (ms) across remote-inbound reports. When activeSsrcs is provided, only actively-
// sending ssrcs are considered; parked simulcast layers hold stale jitter and are skipped.
export function readMaxJitterMs(
	stats: RTCStatsReport | null,
	activeSsrcs?: Set<number>
): number | undefined {
	if (stats == null) return undefined;
	let worst: number | undefined;
	stats.forEach((r: RTCStats & { jitter?: number; ssrc?: number }) => {
		if (r.type !== REMOTE_INBOUND_RTP || r.jitter == null) return;
		if (activeSsrcs !== undefined && (r.ssrc == null || !activeSsrcs.has(r.ssrc))) return;
		const ms = r.jitter * 1000;
		if (ms > JITTER_SANITY_MAX_MS) return; // reject absurd getStats jitter glitch
		worst = worst === undefined ? ms : Math.max(worst, ms);
	});
	return worst;
}

// Worst uplink fractionLost (0..1) across remote-inbound reports; undefined if nothing was sent.
// Parked simulcast layers hold a stale (potentially high) fractionLost and are skipped when activeSsrcs
// is provided.
export function readMaxFractionLost(
	stats: RTCStatsReport | null,
	activeSsrcs?: Set<number>
): number | undefined {
	if (stats == null) return undefined;
	let worst: number | undefined;
	stats.forEach((r: RTCStats & { fractionLost?: number; ssrc?: number }) => {
		if (r.type !== REMOTE_INBOUND_RTP || r.fractionLost == null) return;
		if (activeSsrcs !== undefined && (r.ssrc == null || !activeSsrcs.has(r.ssrc))) return;
		worst = worst === undefined ? r.fractionLost : Math.max(worst, r.fractionLost);
	});
	return worst;
}
