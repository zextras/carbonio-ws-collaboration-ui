/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export type ConnectionQuality = 'lost' | 'terrible' | 'poor' | 'medium' | 'high' | 'optimal';

const clamp01 = (x: number): number => Math.max(0, Math.min(1, x));
const round1 = (x: number): number => Math.round(x * 10) / 10;
const avg = (xs: number[]): number => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

// One vote (0..10) per active stream + one global RTT vote. Each measures the QUALITY of its stream,
// sensed the way that stream actually degrades: where an adaptation loop exists (webcam up/down, audio
// up) we read the OUTPUT of the loop (the tier/bitrate we were forced down to) — loss self-erases as
// the loop trades it for quality, so the operating point is the persistent record; where NO loop exists
// (audio down, screenshare) loss IS the quality (freeze/gaps, nothing to scale). Loss/RTT are always
// measured on OUR OWN leg to Janus, never another participant's channel. The final level is a simple
// worst-aware mean of these votes (see aggregateQuality). Every threshold below is empirical/tunable.

export function activeAudioKbps(i: {
	payloadBytesDelta: number;
	packetsDelta: number;
}): number | undefined {
	const OPUS_PACKETS_PER_SEC = 50; // 20 ms Opus ptime; our stack never renegotiates it
	if (i.packetsDelta <= 0) return undefined;
	const bytesPerPacket = i.payloadBytesDelta / i.packetsDelta;
	return (bytesPerPacket * OPUS_PACKETS_PER_SEC * 8) / 1000;
}

// Empirical Opus mono-voice fidelity curve: encoded kbps -> how good the voice sounds. Linear between
// the two anchors, flat outside. >= FULL_KBPS = healthy wideband voice (1); <= MIN_KBPS = the network
// is compressing real voice (0; Opus floor ~6). Calibrated to real WebRTC mono Opus (VBR+DTX ~16-24
// kbps active on a healthy call).
export function audioQualityFactor(activeKbps: number): number {
	const FULL_KBPS = 16;
	const MIN_KBPS = 8;
	return clamp01((activeKbps - MIN_KBPS) / (FULL_KBPS - MIN_KBPS));
}

// Audio uplink — fidelity from OUR encoded bitrate (Opus lowers it for bandwidth, not CPU: a clean
// network signal). Scored only while the local mic shows real speech (VAD upstream); silence or an
// unavailable counter -> activeKbps undefined -> ceiling 1 (no false "muffled" on a quiet good call).
export function calcUplinkAudioVote(i: { activeKbps?: number }): number {
	const quality = i.activeKbps === undefined ? 1 : audioQualityFactor(i.activeKbps);
	return round1(10 * quality);
}

// Audio downlink — loss on our own leg IS the quality (no tier/bitrate to read: fixed AudioBridge mix,
// no subscriber BWE). TOL_AUDIO is the loss fraction at which it hits 0; audio+PLC rides out ~50% loss,
// so its tolerance is far higher than video's (see TOL_SCREEN). 50% loss ≈ vote 1.
export function calcDownlinkAudioVote(i: { lossRate: number }): number {
	const TOL_AUDIO = 0.55;
	return round1(10 * (1 - clamp01(i.lossRate / TOL_AUDIO)));
}

// Screen loss tolerance — shared by both screen votes, so it lives at module level. Video is MUCH more
// loss-fragile than audio (one lost packet freezes a frame until the next keyframe), so this is far
// lower than TOL_AUDIO: ~20% loss already reads 0. (Audio's greater IMPORTANCE is a separate concept,
// deferred; it would weight the final mean, not this curve.)
const TOL_SCREEN = 0.2;

// Screen up/down — no adaptation loop (screenshare is never scaled), so loss on our own leg is the
// quality. Uplink loss = remote-inbound fractionLost (Janus's view of our send leg); downlink loss =
// our inbound packetsLost delta.
export function calcUplinkScreenVote(i: { lossRate: number }): number {
	return round1(10 * (1 - clamp01(i.lossRate / TOL_SCREEN)));
}

export function calcDownlinkScreenVote(i: { lossRate: number }): number {
	return round1(10 * (1 - clamp01(i.lossRate / TOL_SCREEN)));
}

// Webcam uplink — the simulcast tier our send-GCC keeps under BANDWIDTH pressure only (CPU/weak-camera
// excluded, so a weak cam at its best still scores 10). Discrete: tier ratio over producible rungs.
export function calcUplinkWebcamVote(i: {
	topActiveRung: number;
	producibleRungs: number;
	bwLimitedFraction: number;
	cpuLimitedFraction?: number;
}): number {
	if (i.producibleRungs <= 0) return 10;
	if (i.topActiveRung < 0) return 0;
	const ratio = Math.min(1, (i.topActiveRung + 1) / i.producibleRungs);
	const scaledDown = ratio < 1;
	const byCpu = scaledDown && (i.cpuLimitedFraction ?? 0) > i.bwLimitedFraction;
	return round1(scaledDown && !byCpu ? ratio * 10 : 10);
}

// Webcam downlink — the resolution tier & framerate our downlink controller chose per feed, normalized
// by what the SENDER offers (a sender who never publishes a higher tier is never counted against us).
// Averaged over the received feeds.
export function calcDownlinkWebcamVote(
	feeds: Array<{
		shownTierIdx: number;
		senderMaxTierIdx: number;
		temporalReduced?: boolean;
	}>
): number {
	// A network-forced framerate drop (our controller shed the VP8 temporal layer) — a small, flat,
	// freeze-free penalty on top of the resolution ceiling, much milder than a resolution step.
	const TEMPORAL_DROP_PENALTY = 0.15;
	if (feeds.length === 0) return 10;
	const feedVotes = feeds.map((f) => {
		const spatialCeiling =
			f.senderMaxTierIdx < 0
				? 10
				: Math.min(1, (f.shownTierIdx + 1) / (f.senderMaxTierIdx + 1)) * 10;
		return spatialCeiling * (f.temporalReduced ? 1 - TEMPORAL_DROP_PENALTY : 1);
	});
	return round1(avg(feedVotes));
}

// Global RTT vote — one number for the whole me<->Janus pipe. Linear between the two anchors: <= GOOD is
// imperceptible (10), >= BAD makes the back-and-forth painful (0). Round-trip is the right unit for
// interactivity; it can't be split up/down but it is ours alone (others have separate pipes to Janus).
export function calcRttVote(rttMs: number): number {
	const RTT_GOOD_MS = 200;
	const RTT_BAD_MS = 700;
	return round1(10 * clamp01((RTT_BAD_MS - rttMs) / (RTT_BAD_MS - RTT_GOOD_MS)));
}

export type StreamVotes = {
	uplinkWebcam?: number;
	downlinkWebcam?: number;
	uplinkAudio?: number;
	downlinkAudio?: number;
	uplinkScreen?: number;
	downlinkScreen?: number;
	rtt?: number;
};

export function scoreToLevel(s: number): ConnectionQuality {
	if (s < 2) return 'terrible';
	if (s < 4.5) return 'poor';
	if (s < 6.5) return 'medium';
	if (s < 8.5) return 'high';
	return 'optimal';
}

export function aggregateQuality(votes: StreamVotes, iceConnected: boolean): ConnectionQuality {
	// Worst-aware blend: (1-LAMBDA)*mean + LAMBDA*min. A plain mean dilutes one bad stream by 1/N
	// (hiding it as good streams grow); LAMBDA floors the worst stream's say so one clearly-bad stream
	// stops the level reading 'optimal', without a pure min's tyranny. Per-stream IMPORTANCE (audio >
	// screen) is a separate concept, still deferred; when added it goes here as weights, not in the votes.
	const LAMBDA = 0.4;
	if (!iceConnected) return 'lost';
	const active = (Object.keys(votes) as (keyof StreamVotes)[])
		.filter((k) => votes[k] !== undefined)
		.map((k) => votes[k] as number);
	if (active.length === 0) return 'optimal';
	return scoreToLevel((1 - LAMBDA) * avg(active) + LAMBDA * Math.min(...active));
}
