/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export type WsMessage = WsPingMessage | WsUplinkStatusUpdateMessage;

export type WsPingMessage = {
	type: 'ping' | 'Ping';
};

export type WsUplinkStatusUpdateMessage = {
	type: 'UplinkStatusUpdate';
	meetingId: string;
	networkScore: number | null;
	changedAt: number;
	to?: string;
	maxUplinkTier?: number | null;
	maxHardwareTier?: number | null;
};
