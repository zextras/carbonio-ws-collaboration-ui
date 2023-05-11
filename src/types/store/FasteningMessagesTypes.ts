/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { MessageFastening } from './MessageTypes';

export type FasteningsMap = {
	[roomId: string]: RoomFastenings;
};

export type RoomFastenings = {
	[stanzaId: string]: MessageFastening[];
};
