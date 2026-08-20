/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export type ConnectionQuality = 'lost' | 'terrible' | 'poor' | 'medium' | 'high' | 'optimal';

const clamp01 = (x: number): number => Math.max(0, Math.min(1, x));
const round1 = (x: number): number => Math.round(x * 10) / 10;
const avg = (xs: number[]): number => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

// score: maps a network impairment in [0,1] to a vote in [0,10] (0 = unusable, 10 = perfect).
const score = (iNet: number): number => round1((1 - clamp01(iNet)) * 10);

// Calibration constants — per-type UX severity (NOT cross-stream weights; severity lives here,
// importance/weighting lives only in aggregateQuality):

// With PLC, audio stays intelligible up to ~30% loss.
const LOSS_AUDIO = 0.3;
// Video artifacts propagate to the next keyframe — unusable earlier than audio.
const LOSS_VIDEO = 0.15;
// ~20% concealed samples ≈ choppy/robotic speech.
const CONCEAL_UNUSABLE = 0.2;
// ~20% of the observation window frozen ≈ unusable screenshare.
const FREEZE_UNUSABLE = 0.2;
// Conversational lag onset (300 ms) → subjectively unusable (1000 ms).
const RTT_OK = 300;
const RTT_BAD = 1000;
// VP8 quantizer: crisp (50) → heavily blurred (100).
const QP_OK = 50;
const QP_BAD = 100;
// Jitter-buffer added latency per frame: imperceptible (0.10 s/frame) → very noticeable (0.50 s/frame).
const JB_OK = 0.1;
const JB_BAD = 0.5;

// Webcam uplink — network-health only, CPU/capture excluded.
// Composed: tierVote × (1 − lossFactor).
// tierVote = quality of the simulcast tier MY encoder is currently sending, ONLY when that tier
// is lower because of BANDWIDTH pressure (not CPU — CPU is local encode, not a network fact;
// a small camera sending its top rung is also perfect). bwLimitedFraction and cpuLimitedFraction
// are windowed (Δ qualityLimitationDurations / windowSec), not the flapping instantaneous reason.
// lossFactor = proportional raw loss: 0 → keep tierVote as-is, 1 → the tier is completely
// unusable. Adaptation is PRIMARY (tier already captures quality); loss compounds on top.
export function calcUplinkWebcamVote(i: {
	topActiveRung: number;
	producibleRungs: number;
	bwLimitedFraction: number;
	cpuLimitedFraction?: number;
	lossRate?: number;
}): number {
	let tierVote: number;
	if (i.producibleRungs <= 0) {
		// capture capabilities unknown — do not penalize
		tierVote = 10;
	} else if (i.topActiveRung < 0) {
		// sending nothing despite being active
		tierVote = 0;
	} else {
		const ratio = Math.min(1, (i.topActiveRung + 1) / i.producibleRungs);
		const scaledDown = ratio < 1;
		// CPU-dominant scale-down is not a network fact — excluded
		const byCpu = scaledDown && (i.cpuLimitedFraction ?? 0) > i.bwLimitedFraction;
		tierVote = scaledDown && !byCpu ? ratio * 10 : 10;
	}
	return round1(tierVote * (1 - clamp01(i.lossRate ?? 0)));
}

// Webcam downlink — network-health only, remote-low publisher excluded.
// Composed: tierVote × (1 − lossFactor), averaged across active feeds.
// tierVote = quality tier MY controller requested for this feed — it only drops on MY own
// loss/jitter (not because the remote publishes low); requestedRung 0..2 maps to 3.3/6.7/10.
// lossFactor = max of proportional inbound loss and freeze fraction: the feed tier already
// reflects substream decisions, loss and freezes compound on the frames that actually arrive.
// Active feeds only; empty list → nothing to receive → 10.
export function calcDownlinkWebcamVote(
	feeds: Array<{ requestedRung: number; inboundLossRate: number; freezeFraction: number }>
): number {
	if (feeds.length === 0) return 10;
	const feedVotes = feeds.map((f) => {
		const tierVote = ((f.requestedRung + 1) / 3) * 10;
		const lossFactor = Math.max(clamp01(f.inboundLossRate), clamp01(f.freezeFraction));
		return tierVote * (1 - lossFactor);
	});
	return round1(avg(feedVotes));
}

// Audio uplink — calibrated impairment because audio does not adapt.
// Audio tolerates more loss than video due to PLC (LOSS_AUDIO 0.30 vs LOSS_VIDEO 0.15).
// RTT hurts conversational flow at the far end; both signals windowed and averaged.
export function calcUplinkAudioVote(i: { lossRate: number; rttMs?: number }): number {
	const rttImp = clamp01(((i.rttMs ?? 0) - RTT_OK) / (RTT_BAD - RTT_OK));
	return score(Math.max(clamp01(i.lossRate / LOSS_AUDIO), rttImp));
}

// Audio downlink — calibrated impairment because audio does not adapt.
// Concealment ratio is the ear's actual experience: it folds in loss + late packets after PLC,
// so raw packet loss is intentionally excluded here. JB delay adds perceptible latency.
export function calcDownlinkAudioVote(i: {
	concealmentRatio: number;
	jbDelayPerFrameSec?: number;
}): number {
	const jbImp = clamp01(((i.jbDelayPerFrameSec ?? 0) - JB_OK) / (JB_BAD - JB_OK));
	return score(Math.max(clamp01(i.concealmentRatio / CONCEAL_UNUSABLE), jbImp));
}

// Screen uplink — calibrated impairment; screen never adapts (no simulcast).
// Loss from remote RTCP; optional BW-fps impairment when the fps drop is reliably attributable
// to bandwidth (not CPU), e.g. framesPerSecond vs rolling unlimited max.
export function calcUplinkScreenVote(i: { lossRate: number; bwFpsImpairment?: number }): number {
	return score(Math.max(clamp01(i.lossRate / LOSS_VIDEO), clamp01(i.bwFpsImpairment ?? 0)));
}

// Screen downlink — calibrated impairment; screen never adapts.
// Freezes are the dominant screenshare UX killer (already discount NACK-recovered packets);
// QP captures blur; inbound loss is the underlying network signal.
export function calcDownlinkScreenVote(i: {
	freezeFraction?: number;
	qp?: number;
	lossRate?: number;
}): number {
	const qpImp = clamp01(((i.qp ?? QP_OK) - QP_OK) / (QP_BAD - QP_OK));
	return score(
		Math.max(
			clamp01((i.freezeFraction ?? 0) / FREEZE_UNUSABLE),
			qpImp,
			clamp01((i.lossRate ?? 0) / LOSS_VIDEO)
		)
	);
}

export type StreamVotes = {
	uplinkWebcam?: number;
	downlinkWebcam?: number;
	uplinkAudio?: number;
	downlinkAudio?: number;
	uplinkScreen?: number;
	downlinkScreen?: number;
};

export function scoreToLevel(s: number): ConnectionQuality {
	if (s < 2) return 'terrible';
	if (s < 4.5) return 'poor';
	if (s < 6.5) return 'medium';
	if (s < 8.5) return 'high';
	return 'optimal';
}

// Plain unweighted mean — every stream's absolute UX counts equally for now.
// Per-stream IMPORTANCE (a bad audio matters more than a bad screen) is a different concept from
// the per-stream SEVERITY that already lives in the votes, and is intentionally NOT applied yet;
// when added it goes HERE as weights (or as a worst-aware min term), never in the votes.
export function aggregateQuality(votes: StreamVotes, iceConnected: boolean): ConnectionQuality {
	if (!iceConnected) return 'lost';
	const active = (Object.keys(votes) as (keyof StreamVotes)[])
		.filter((k) => votes[k] !== undefined)
		.map((k) => votes[k] as number);
	if (active.length === 0) return 'optimal';
	return scoreToLevel(avg(active));
}
