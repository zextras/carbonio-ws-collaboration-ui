/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export type ConnectionQuality = 'lost' | 'terrible' | 'poor' | 'medium' | 'high' | 'optimal';

const clamp01 = (x: number): number => Math.max(0, Math.min(1, x));

// Cut-points fill 5 levels across 0–10; everyday calls land in 'high'/'optimal'.
export function scoreToLevel(s: number): ConnectionQuality {
	if (s < 2) return 'terrible';
	if (s < 4.5) return 'poor';
	if (s < 6.5) return 'medium';
	if (s < 8.5) return 'high';
	return 'optimal';
}

// Opus useful floor for mono voice; below this fidelity is effectively 0.
export const AUDIO_FLOOR_KBPS = 6;
// No perceptual gain beyond 24 kbps for mono speech — the ceiling.
export const AUDIO_TRANSPARENT_KBPS = 24;

// Importance weights: audio dominates QoE (2×); screen text legibility > webcam motion (1 vs 0.5).
export const AGG_WEIGHTS = { webcam: 0.5, screen: 1.0, audio: 2.0 } as const;

// 0.3 weighted-mean + 0.7 min — lower-voted stream dominates the dot (worst-aware),
// so a good silent-audio (10, weight 2) no longer masks a degraded webcam.
export const BLEND_MEAN = 0.3;
export const BLEND_MIN = 0.7;

export interface WebcamUplinkSignals {
	producibleRungs: number;
	topActiveRung: number;
	bandwidthLimited: boolean;
}

export interface ScreenUplinkSignals {
	bandwidthLimited: boolean;
	captureFps: number | undefined;
	encodedFps: number;
}

export interface AudioUplinkSignals {
	speaking: boolean;
	actualKbps: number;
}

export function webcamUplinkVote(s: WebcamUplinkSignals): number {
	// Gate first: only the NETWORK counts. Without bandwidth limitation a low/absent rung is CPU,
	// weak hardware or an easy scene — not our network's fault → full marks even if topActiveRung < 0.
	if (!s.bandwidthLimited) return 10;
	if (s.topActiveRung < 0) return 0;
	return (10 * (s.topActiveRung + 1)) / s.producibleRungs;
}

export function screenUplinkVote(s: ScreenUplinkSignals): number {
	if (s.bandwidthLimited) {
		return s.captureFps ? 10 * clamp01(s.encodedFps / s.captureFps) : 10;
	}
	return 10;
}

export function audioUplinkVote(s: AudioUplinkSignals): number {
	// Silent track is considered fine (like a static screenshare) — full marks when not speaking.
	if (!s.speaking) return 10;
	if (s.actualKbps <= 0) return 0;
	return (
		10 *
		clamp01(
			Math.log(s.actualKbps / AUDIO_FLOOR_KBPS) /
				Math.log(AUDIO_TRANSPARENT_KBPS / AUDIO_FLOOR_KBPS)
		)
	);
}

export interface UplinkVotes {
	webcam?: number;
	screen?: number;
	audio?: number;
}

export function aggregateUplinkQuality(
	votes: UplinkVotes,
	iceConnected: boolean
): ConnectionQuality {
	if (!iceConnected) return 'lost';
	const keys = (Object.keys(votes) as (keyof UplinkVotes)[]).filter((k) => votes[k] !== undefined);
	if (keys.length === 0) return 'optimal';
	let weightSum = 0;
	let weightedAcc = 0;
	let minVote = Infinity;
	keys.forEach((k) => {
		const v = votes[k] as number;
		const w = AGG_WEIGHTS[k];
		weightedAcc += v * w;
		weightSum += w;
		if (v < minVote) minVote = v;
	});
	const weightedMean = weightedAcc / weightSum;
	return scoreToLevel(BLEND_MEAN * weightedMean + BLEND_MIN * minVote);
}
