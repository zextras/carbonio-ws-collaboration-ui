/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { median } from './readingWindow';

// Median is the only smoothing primitive; odd window keeps integer medians.
export const DISPLAY_WINDOW = 7;

// Buffer capacity for the raw vote window. >= DISPLAY_WINDOW, sized so the median window can be tuned up.
const VOTE_WINDOW_CAPACITY = 15;
const OPTIMISTIC_SEED = 5; // fresh connection is assumed healthy until real readings arrive

export class VoteWindow {
	private readonly buf: number[];

	constructor() {
		this.buf = new Array(VOTE_WINDOW_CAPACITY).fill(OPTIMISTIC_SEED);
	}

	push(bars: number): void {
		this.buf.push(bars);
		if (this.buf.length > VOTE_WINDOW_CAPACITY) this.buf.shift();
	}

	medianLast(n: number): number {
		const count = Math.min(n, this.buf.length);
		return median(this.buf.slice(-count));
	}
}
