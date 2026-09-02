/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// Clean-downlink-loss primitives used by the stability vote (ConnectionQualityMonitor), computed per SSRC
// over all my receiving PCs.
//
// The Janus RTCP-SR escape: Janus strips each publisher's SR and generates its OWN per-subscriber SR
// whose packet count is what it actually forwarded to ME; the browser surfaces that as
// remote-outbound-rtp.packetsSent. So (forwarded - received)/forwarded is the Janus->me loss, IMMUNE to
// the publisher's own uplink loss. NEVER use inbound-rtp.packetsLost for forwarded video: Janus forwards
// the publisher's seqnums with a linear offset, so its gaps leak the publisher's uplink loss into ours.
//
// The vote computes per-SSRC deltas (via srEscapeStreams + a per-SSRC baseline map in the monitor). A
// per-SSRC baseline is required because an SSRC discontinuity (unsubscribe→resubscribe / AUTO-OFF→ON /
// new outbound SSRC) would otherwise compare mismatched cumulative baselines and produce a spurious
// ~100% spike for that window.

const REMOTE_OUTBOUND_RTP = 'remote-outbound-rtp';
const INBOUND_RTP = 'inbound-rtp';

// Per-stream cumulative SR-escape counters for one matched forwarding pair (remote-outbound-rtp ↔
// inbound-rtp). Key = `${remoteId}:${inboundId}` — unique per SSRC pair across a stats report.
export type SrEscapeStream = { key: string; sent: number; recv: number };

// One entry per matched pair (remote-outbound-rtp ↔ inbound-rtp). Used by the monitor's per-SSRC delta so
// each SSRC accumulates its own baseline: a disappearing / reappearing SSRC (subscribe→resubscribe,
// AUTO-OFF→ON) seeds a fresh baseline and does not contribute on the first tick, which avoids the spurious
// ~100% spike that pooling-then-diffing produces.
export function srEscapeStreams(stats: RTCStatsReport): SrEscapeStream[] {
	const forwarded = new Map<string, number>();
	const received: Array<{ id: string; remoteId?: string; recv: number }> = [];
	stats.forEach(
		(r: RTCStats & { remoteId?: string; packetsSent?: number; packetsReceived?: number }) => {
			if (r.type === REMOTE_OUTBOUND_RTP) forwarded.set(r.id, r.packetsSent ?? 0);
			if (r.type === INBOUND_RTP) {
				received.push({ id: r.id, remoteId: r.remoteId, recv: r.packetsReceived ?? 0 });
			}
		}
	);
	const result: SrEscapeStream[] = [];
	received.forEach((inb) => {
		if (inb.remoteId != null && forwarded.has(inb.remoteId)) {
			result.push({
				key: `${inb.remoteId}:${inb.id}`,
				sent: forwarded.get(inb.remoteId) ?? 0,
				recv: inb.recv
			});
		}
	});
	return result;
}

// Pool the receiver-side loss counters of an ORIGINATED inbound stream (e.g. the Janus AudioBridge mix,
// which Janus encodes itself). This reads inbound-rtp.packetsLost directly: valid ONLY where Janus is the
// SOURCE (its own contiguous seqnums) — NOT for forwarded video, whose seqnum offset would leak the
// publisher's uplink loss. A single monotonic pair, so a per-window delta is self-consistent with no
// SR-vs-live (~1 Hz vs 2 s) quantization skew.
export function poolInboundLoss(stats: RTCStatsReport | null): { lost: number; recv: number } {
	let lost = 0;
	let recv = 0;
	stats?.forEach((r: RTCStats & { packetsLost?: number; packetsReceived?: number }) => {
		if (r.type === INBOUND_RTP) {
			lost += Math.max(0, r.packetsLost ?? 0);
			recv += r.packetsReceived ?? 0;
		}
	});
	return { lost, recv };
}

// Volume gate (packets): losing 1-of-N packets gives N% loss — quantizes hard for small N (1-of-5 = 20%).
// A sample is only produced when enough packets flowed in the 2 s window; fewer → undefined (no penalty).
// Audio (~100 pkt/2 s) always passes in practice; this only removes noisy few-packet VIDEO readings.
// 20 packets is also enough to confirm the SR (which advances ~1 Hz vs our 2 s tick) has clearly moved.
export const MIN_EXPECTED_PACKETS = 20;

// Clean loss fraction from a per-tick SR-escape delta, or undefined when fewer than MIN_EXPECTED_PACKETS
// were forwarded this window (noisy few-packet sample). Used for FORWARDED VIDEO feeds; the vote de-noises
// the reading with its median window.
export function srEscapeLoss(dSent: number, dRecv: number): number | undefined {
	if (dSent < MIN_EXPECTED_PACKETS) return undefined;
	return Math.max(0, Math.min(1, (dSent - Math.max(0, dRecv)) / dSent));
}
