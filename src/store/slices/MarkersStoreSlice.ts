/* eslint-disable no-param-reassign */
/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { produce } from 'immer';
import { forEach } from 'lodash';
import { StateCreator } from 'zustand';

import { Marker } from '../../types/store/MarkersTypes';
import { MarkersStoreSlice, RootStore } from '../../types/store/StoreTypes';

export const useMarkersStoreSlice: StateCreator<MarkersStoreSlice> = (
	set: (...any: any) => void
) => ({
	markers: {},
	updateMarkers: (roomId: string, markers: Marker[]): void => {
		set(
			produce((draft: RootStore) => {
				if (!draft.markers[roomId]) draft.markers[roomId] = {};
				forEach(markers, (marker: Marker) => {
					// Set new marker only when it's a new marker, or it is more recent than other
					const oldMarker = draft.markers[roomId][marker.from];
					if (!oldMarker || oldMarker.markerDate < marker.markerDate) {
						draft.markers[roomId][marker.from] = marker;
					}
				});
			}),
			false,
			'MARKERS/UPDATE_MARKER'
		);
	}
});
