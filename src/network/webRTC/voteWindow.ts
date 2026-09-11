/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { median } from './readingWindow';

// Committed display level: median of the last DISPLAY_WINDOW raw votes (~14 s of history). The median is
// the badge's ONLY smoothing: a lone 1-2 tick glitch can't move the displayed vote, while a sustained
// change reaches the level after ~3-4 ticks. Odd window keeps integer medians. Tunable up or down; the
// buffer is sized larger (VOTE_WINDOW_CAPACITY) so the window can be raised without code changes.
export const DISPLAY_WINDOW = 7;

// Buffer capacity for the raw vote window. >= DISPLAY_WINDOW, sized so the median window can be tuned up.
const VOTE_WINDOW_CAPACITY = 15;
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

	// Median of the last n entries (n capped at the actual buffer length).
	medianLast(n: number): number {
		const count = Math.min(n, this.buf.length);
		return median(this.buf.slice(-count));
	}
}
