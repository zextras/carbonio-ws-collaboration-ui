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

// Shared piecewise-linear loss vote: 10 at/below ok, 0 at/above bad, linear between.
export function lossVote(loss: number, ok: number, bad: number): number {
	return 10 * clamp01((bad - loss) / (bad - ok));
}

// Webcam artifacts are the most tolerable — forgiving floor before penalty starts.
export const WEBCAM_LOSS_OK = 0.05;
// Wide band keeps the webcam vote gentle; collapses only at heavy packet loss.
export const WEBCAM_LOSS_BAD = 0.35;

// Broken text/code becomes unreadable fast — steep knee starts at 3% loss.
export const SCREEN_LOSS_OK = 0.03;
// Narrow band; 13% loss already destroys legibility of code/slides.
export const SCREEN_LOSS_BAD = 0.13;

// PLC masks early loss — hold until 10% before penalising voice quality.
export const AUDIO_LOSS_OK = 0.1;
// PLC fails above ~28% loss; voice becomes unusable — the cliff end.
export const AUDIO_LOSS_BAD = 0.28;

// Opus useful floor for mono voice; below this fidelity is effectively 0.
export const AUDIO_FLOOR_KBPS = 6;
// No perceptual gain beyond 24 kbps for mono speech — the ceiling.
export const AUDIO_TRANSPARENT_KBPS = 24;

// Importance weights: audio dominates QoE (2×); screen text legibility > webcam motion (1 vs 0.5).
export const AGG_WEIGHTS = { webcam: 0.5, screen: 1.0, audio: 2.0 } as const;

// 0.6 weighted-mean + 0.4 min — min floor stops a single bad stream hiding behind good others.
export const BLEND_MEAN = 0.6;
export const BLEND_MIN = 0.4;

export interface WebcamUplinkSignals {
	producibleRungs: number;
	topActiveRung: number;
	bandwidthLimited: boolean;
	fractionLost: number;
}

export interface ScreenUplinkSignals {
	bandwidthLimited: boolean;
	captureFps: number | undefined;
	encodedFps: number;
	fractionLost: number;
}

export interface AudioUplinkSignals {
	speaking: boolean;
	actualKbps: number;
	fractionLost: number;
}

export function webcamUplinkVote(s: WebcamUplinkSignals): number {
	// Gate first: only the NETWORK counts. Without bandwidth limitation a low/absent rung is CPU,
	// weak hardware or an easy scene — not our network's fault → full marks even if topActiveRung < 0.
	let quality: number;
	if (!s.bandwidthLimited) {
		quality = 10;
	} else if (s.topActiveRung < 0) {
		quality = 0;
	} else {
		quality = (10 * (s.topActiveRung + 1)) / s.producibleRungs;
	}
	return Math.min(quality, lossVote(s.fractionLost, WEBCAM_LOSS_OK, WEBCAM_LOSS_BAD));
}

export function screenUplinkVote(s: ScreenUplinkSignals): number {
	let quality: number;
	if (s.bandwidthLimited) {
		quality = s.captureFps ? 10 * clamp01(s.encodedFps / s.captureFps) : 10;
	} else {
		quality = 10;
	}
	return Math.min(quality, lossVote(s.fractionLost, SCREEN_LOSS_OK, SCREEN_LOSS_BAD));
}

export function audioUplinkVote(s: AudioUplinkSignals): number {
	let quality: number;
	if (s.speaking) {
		quality =
			s.actualKbps <= 0
				? 0
				: 10 *
					clamp01(
						Math.log(s.actualKbps / AUDIO_FLOOR_KBPS) /
							Math.log(AUDIO_TRANSPARENT_KBPS / AUDIO_FLOOR_KBPS)
					);
	} else {
		quality = 10;
	}
	return Math.min(quality, lossVote(s.fractionLost, AUDIO_LOSS_OK, AUDIO_LOSS_BAD));
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
