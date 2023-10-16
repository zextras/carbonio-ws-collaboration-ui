/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { map, reduce } from 'lodash';

import { RootStore } from '../../types/store/StoreTypes';

export const getTotalUnreadCountSelector = (store: RootStore): number => {
	const sum = (amount: number, n: number): number => amount + n;
	return reduce(
		map(store.unreads, (unread, key) => {
			if (store.rooms[key] && !store.rooms[key].userSettings?.muted) {
				return unread;
			}
			return 0;
		}),
		sum,
		0
	);
};

export const getRoomUnreadsSelector = (store: RootStore, roomId: string): number =>
	store.unreads[roomId] || 0;
