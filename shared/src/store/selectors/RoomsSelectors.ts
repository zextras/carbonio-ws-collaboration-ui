/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { RootStore } from 'wsc-shared';

export const getMeetingIdFromRoom = (state: RootStore, roomId: string): string | undefined =>
	state.rooms[roomId]?.meetingId;
