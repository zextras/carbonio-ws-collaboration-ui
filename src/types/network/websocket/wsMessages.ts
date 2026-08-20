/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ConnectionQuality } from '../../../network/webRTC/connectionQualityScore';

export type WsMessage = WsPingMessage | WsConnectionQualityStatusMessage;

export type WsPingMessage = {
	type: 'ping' | 'Ping';
};

export type WsConnectionQualityStatusMessage = {
	type: 'ConnectionQualityStatus';
	meetingId: string;
	quality: ConnectionQuality;
	changedAt: number;
	to?: string;
	maxTier?: 'best' | 'medium' | 'low';
};
