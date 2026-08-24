/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ConnectionQuality } from '../../../network/webRTC/connectionQualityScore';

export type WsMessage = WsPingMessage | WsConnectionScoreStatusMessage;

export type WsPingMessage = {
	type: 'ping' | 'Ping';
};

export type WsConnectionScoreStatusMessage = {
	type: 'ConnectionScoreStatus';
	meetingId: string;
	score: ConnectionQuality;
	changedAt: number;
	to?: string;
};
