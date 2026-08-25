/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { layersOf } from './inboundQualityController';

export const CONFIRM_DOWN = 16000; // ms degraded must persist before yellow (skips a single transient drop+reclimb ~12s)
export const CONFIRM_UP = 6000; // ms fully-restored before green (reaching max already proved stability via backoff climb)
export const MIN_DWELL = 64000; // ms hard floor between ANY two snackbars (= controller max backoff) -> <=1 snackbar/64s

export type DownlinkSmState = {
	committed: 'ok' | 'compromised';
	lastFlipAt: number;
	degradedSince: number;
	okSince: number;
};

export const initialDownlinkSmState = (): DownlinkSmState => ({
	committed: 'ok',
	lastFlipAt: -MIN_DWELL, // no prior flip -> dwell check always passes on the first snackbar
	degradedSince: 0,
	okSince: 0
});

export type FeedSnapshot = {
	userId: string;
	suppressed: boolean;
	rung?: number;
	failCount?: number[];
};

export type DegradedSummary = {
	aggregateDegraded: boolean;
	anyFeedSuppressed: boolean;
	maxFailCountAtBoundary: number;
};

export function computeDegradedSummary(
	feeds: FeedSnapshot[],
	publishedTier: (userId: string) => number | undefined
): DegradedSummary {
	let aggregateDegraded = false;
	let anyFeedSuppressed = false;
	let maxFailCountAtBoundary = 0;

	feeds.forEach((feed) => {
		const published = publishedTier(feed.userId);
		if (published === undefined) return;
		const consumed = feed.suppressed ? -1 : layersOf(feed.rung ?? 0).substream;
		if (consumed < published) {
			aggregateDegraded = true;
			if (feed.suppressed) {
				anyFeedSuppressed = true;
			} else if (feed.rung != null && feed.failCount != null) {
				maxFailCountAtBoundary = Math.max(maxFailCountAtBoundary, feed.failCount[feed.rung] ?? 0);
			}
		}
	});

	return { aggregateDegraded, anyFeedSuppressed, maxFailCountAtBoundary };
}

export type TickInput = {
	aggregateDegraded: boolean;
	anyFeedSuppressed: boolean;
	maxFailCountAtBoundary: number;
	now: number;
};

export type TickResult = {
	state: DownlinkSmState;
	flippedTo?: 'ok' | 'compromised';
};

export function tickDownlinkSm(prev: DownlinkSmState, input: TickInput): TickResult {
	const { aggregateDegraded, anyFeedSuppressed, maxFailCountAtBoundary, now } = input;
	const state = { ...prev };

	if (prev.committed === 'ok') {
		if (aggregateDegraded) {
			state.degradedSince = prev.degradedSince === 0 ? now : prev.degradedSince;
			state.okSince = 0;
			const confirmed =
				maxFailCountAtBoundary >= 1 ||
				anyFeedSuppressed ||
				now - state.degradedSince >= CONFIRM_DOWN;
			if (confirmed && now - prev.lastFlipAt >= MIN_DWELL) {
				state.committed = 'compromised';
				state.lastFlipAt = now;
				return { state, flippedTo: 'compromised' };
			}
		} else {
			state.degradedSince = 0;
			state.okSince = 0;
		}
		return { state };
	}

	// committed === 'compromised'
	if (!aggregateDegraded) {
		state.okSince = prev.okSince === 0 ? now : prev.okSince;
		state.degradedSince = 0;
		if (now - state.okSince >= CONFIRM_UP && now - prev.lastFlipAt >= MIN_DWELL) {
			state.committed = 'ok';
			state.lastFlipAt = now;
			return { state, flippedTo: 'ok' };
		}
	} else {
		state.okSince = 0;
		state.degradedSince = prev.degradedSince === 0 ? now : prev.degradedSince;
	}
	return { state };
}
