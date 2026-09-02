/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// Median of a list of numbers (even length -> mean of the two central values). The single de-noise
// primitive: it rejects a lone outlier outright, so a one-tick glitch does not move the vote while a
// change that persists across the majority of the window does. Used by the vote's VoteWindow.
export function median(values: number[]): number {
	const sorted = [...values].sort((a, b) => a - b);
	const mid = Math.floor(sorted.length / 2);
	return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}
