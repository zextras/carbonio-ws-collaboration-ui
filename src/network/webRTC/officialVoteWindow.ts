/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// Generic N-of-M count helper used by the downlink controller's raw-score evidence tracker.

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
