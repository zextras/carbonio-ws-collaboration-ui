/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export type QualityState = {
	substream: 0 | 1 | 2;
	badCount: number;
	goodCount: number;
	change?: 0 | 1 | 2;
	off?: boolean;
};

export const initialQualityState = (start: 0 | 1 | 2 = 2): QualityState => ({
	substream: start,
	badCount: 0,
	goodCount: 0
});

const BAD = 0.05;
const GOOD = 0.01;
const DROP_AFTER = 2;
const RAISE_AFTER = 10;
const OFF_AFTER = 2;

export function decideSubstream(prev: QualityState, s: { lossRate: number }): QualityState {
	const st: QualityState = { ...prev, change: undefined, off: undefined };
	if (s.lossRate > BAD) {
		st.badCount += 1;
		st.goodCount = 0;
		if (st.badCount >= DROP_AFTER && st.substream > 0) {
			st.substream = (st.substream - 1) as 0 | 1 | 2;
			st.badCount = 0;
			st.change = st.substream;
		} else if (st.substream === 0 && st.badCount >= OFF_AFTER) {
			st.badCount = 0;
			st.off = true;
		}
	} else if (s.lossRate < GOOD) {
		st.goodCount += 1;
		st.badCount = 0;
		if (st.goodCount >= RAISE_AFTER && st.substream < 2) {
			st.substream = (st.substream + 1) as 0 | 1 | 2;
			st.goodCount = 0;
			st.change = st.substream;
		}
	} else {
		st.badCount = 0;
		st.goodCount = 0;
	}
	return st;
}
