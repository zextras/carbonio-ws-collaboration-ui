/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { find } from 'lodash';

import { Meeting } from '../../types/store/MeetingTypes';
import { RootStore } from '../../types/store/StoreTypes';

export const getMeetingByRoomId = (store: RootStore, roomId: string): Meeting | undefined =>
	find(store.meetings, (meeting) => meeting.roomId === roomId);
