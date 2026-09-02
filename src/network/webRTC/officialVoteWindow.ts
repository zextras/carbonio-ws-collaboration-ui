/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// History buffer for the official (median-7 display) vote — drives the two N-of-M snackbar signals
// (warnVote 8/10, restoreVote 10/13). The generic atLeast helper is also reused by the downlink
// controller's own evidence tracker.

// Buffer capacity must be >= the largest N-of-M window (13 for RESTORE). Seeded optimistic (bars 5).
export const OFFICIAL_HISTORY_CAPACITY = 13;

const OPTIMISTIC_SEED = 5;

// Returns true if >= n of the LAST m entries in buf satisfy pred. m is capped at buf.length.
export function atLeast(
	buf: readonly number[],
	n: number,
	m: number,
	pred: (b: number) => boolean
): boolean {
	const count = Math.min(m, buf.length);
	return buf.slice(-count).filter(pred).length >= n;
}

export class OfficialVoteWindow {
	private readonly buf: number[];

	constructor() {
		this.buf = new Array(OFFICIAL_HISTORY_CAPACITY).fill(OPTIMISTIC_SEED);
	}

	push(bars: number): void {
		this.buf.push(bars);
		if (this.buf.length > OFFICIAL_HISTORY_CAPACITY) this.buf.shift();
	}

	atLeast(n: number, m: number, pred: (b: number) => boolean): boolean {
		return atLeast(this.buf, n, m, pred);
	}
}
