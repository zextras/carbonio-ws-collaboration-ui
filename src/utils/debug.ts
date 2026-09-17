/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// Debug WebSocket events
import { WsEvent } from '../types/network/websocket/wsEvents';

export const wsDebug = (text: string, object?: WsEvent): void => {
	if (process.env.NODE_ENV !== 'test') {
		console.log(
			`%c CHATS WS [${new Date().toISOString().slice(11, -5)}]: ${text}`,
			'color: Green',
			object || ''
		);
	}
};

// Debug XMPP events
export const xmppDebug = (text: string, object?: Element): void => {
	if (process.env.NODE_ENV !== 'test') {
		console.log(
			`%c CHATS XMPP [${new Date().toISOString().slice(11, -5)}]: ${text}`,
			'color: Violet',
			object || ''
		);
	}
};

export const rtcDebug = (text: string, ...args: unknown[]): void => {
	if (process.env.NODE_ENV !== 'test') {
		console.log(
			`%c CHATS RTC [${new Date().toISOString().slice(11, -5)}]: ${text}`,
			'color: Orange',
			...args
		);
	}
};

// Simulcast rung -> tier name (0 = low/144, 1 = medium/360, 2 = high/720), shared by the uplink and
// downlink tier logs so both read the same way. Out of range (no active layer / no previous value) = none.
export const rtcTierName = (rung: number): string => ['low', 'medium', 'high'][rung] ?? 'none';

// Our own uplink tier change, GCC-driven (no remote user): [UPLINK] old-tier / new-tier.
export const rtcUplinkDebug = (oldRung: number, newRung: number): void => {
	rtcDebug(`[UPLINK] old-tier=${rtcTierName(oldRung)} new-tier=${rtcTierName(newRung)}`);
};

// A per-remote downlink request change: [DOWNLINK] user / old-tier / new-tier / reason. Reason is the
// cause: our-network (our reception drove it) or tile-resize. There is no sender-network reason — we always
// request the top rung and Janus forwards a lower one when the sender doesn't publish it, not our change.
export const rtcDownlinkDebug = (
	user: string,
	oldRung: number,
	newRung: number,
	reason: string
): void => {
	rtcDebug(
		`[DOWNLINK] user=${user} old-tier=${rtcTierName(oldRung)} new-tier=${rtcTierName(newRung)} reason=${reason}`
	);
};
