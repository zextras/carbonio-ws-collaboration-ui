/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// 2-state flip for the downlink "unstable connection" snackbar. The confirmation is provided by the
// caller's N-of-M vote signals (warnVote = 8-of-10 poor, restoreVote = 10-of-13 medium+): the caller
// computes `degraded` and `recovered` from those and passes them here. This function keeps no internal
// streak counters — the caller's N-of-M windows ARE the confirmation.
//   - DEGRADED (warnVote AND quality-being-reduced): flip ok -> compromised on the first degraded tick.
//   - RECOVERED (restoreVote): flip compromised -> ok on the first recovered tick.

export type DownlinkSmState = {
	committed: 'ok' | 'compromised';
};

export const initialDownlinkSmState = (): DownlinkSmState => ({
	committed: 'ok'
});

export type TickInput = {
	// DEGRADED: warnVote (8-of-10 <= poor) AND quality is being reduced (relaxed check — not fully floored).
	degraded: boolean;
	// RECOVERED: restoreVote (10-of-13 >= medium) — stability is relative to whatever quality holds now.
	recovered: boolean;
};

export type TickResult = {
	state: DownlinkSmState;
	flippedTo?: 'ok' | 'compromised';
};

export function tickDownlinkSm(prev: DownlinkSmState, input: TickInput): TickResult {
	if (prev.committed === 'ok') {
		if (input.degraded) {
			return { state: { committed: 'compromised' }, flippedTo: 'compromised' };
		}
		return { state: { committed: 'ok' } };
	}

	// committed === 'compromised'
	if (input.recovered) {
		return { state: { committed: 'ok' }, flippedTo: 'ok' };
	}
	return { state: { committed: 'compromised' } };
}
