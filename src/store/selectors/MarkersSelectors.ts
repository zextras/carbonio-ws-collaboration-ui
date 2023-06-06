/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Marker } from '../../types/store/MarkersTypes';
import { RootStore } from '../../types/store/StoreTypes';

export const getMyLastMarkerOfRoom = (store: RootStore, roomId: string): Marker | null => {
	if (store.session.id && store.markers[roomId] && store.markers[roomId][store.session.id]) {
		return store.markers[roomId][store.session.id];
	}
	return null;
};

export const getRoomHasMarkers = (store: RootStore, roomId: string): boolean =>
	!!store.markers[roomId];
