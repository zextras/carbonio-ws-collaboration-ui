/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { median } from './readingWindow';

// Committed display level: median-7 (~14 s of history). Odd window keeps integer medians. Smooths the
// frequent short 1-2 tick video-loss spikes so a lone glitch can't move the displayed vote; a genuinely
// sustained loss still reaches the level after ~3-4 ticks (when zeros own ≥4 of the 7 slots). 7 (not 11)
// reacts ~4 s faster to an abrupt floor with negligible extra flicker (empirical netshape median sims).
export const DISPLAY_WINDOW = 7;

// The signals derived from the vote buffer each tick and passed to VideoScreenInConnection.
// These are LOCAL — never broadcast in the connectionQuality map.
export type QualitySignals = {
	// Per-tick display-vote bars (0-5): the controller builds its own resettable evidence from this.
	displayBars: number;
	// atLeast(8, 10, b <= 2): >=8 of last 10 official-vote bars <= poor — for the snackbar only.
	warnVote: boolean;
	// atLeast(10, 13, b >= 3): >=10 of last 13 official-vote bars >= medium — for the snackbar only.
	restoreVote: boolean;
};

// Buffer capacity for the RAW vote window = DISPLAY_WINDOW (7): only the median-7 display vote reads
// from this buffer. The N-of-M counts on the official-vote buffer (OfficialVoteWindow, capacity 13)
// drive the snackbar signals; the controller owns its own resettable evidence for rung decisions.
const VOTE_WINDOW_CAPACITY = DISPLAY_WINDOW;
const OPTIMISTIC_SEED = 5; // fresh connection is assumed healthy until real readings arrive

export class VoteWindow {
	private readonly buf: number[];

	constructor() {
		this.buf = new Array(VOTE_WINDOW_CAPACITY).fill(OPTIMISTIC_SEED);
	}

	// Append one raw bars value (0..5) and drop the oldest if over capacity.
	push(bars: number): void {
		this.buf.push(bars);
		if (this.buf.length > VOTE_WINDOW_CAPACITY) this.buf.shift();
	}

	// Median of the last n entries (n capped at the actual buffer length). The window (DISPLAY_WINDOW = 7)
	// is odd, so the result is always an exact integer bar count.
	medianLast(n: number): number {
		const count = Math.min(n, this.buf.length);
		return median(this.buf.slice(-count));
	}
}
