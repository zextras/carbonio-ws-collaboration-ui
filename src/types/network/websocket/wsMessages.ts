/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export type WsMessage = WsPingMessage | WsTypingAction;

export type WsPingMessage = {
	type: 'ping' | 'Ping';
};

/**
 * Outbound typing action on the WSC-pure /events socket (backend >= 2.0.0):
 * the only chat traffic the client sends there. Note the `action` key — the
 * ping envelope uses `type`, the chat actions use `action` (spike contract).
 */
export type WsTypingAction = {
	action: 'Typing';
	roomId: string;
	status: 'started' | 'stopped';
};
