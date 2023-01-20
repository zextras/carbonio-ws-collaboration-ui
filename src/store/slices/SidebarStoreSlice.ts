/* eslint-disable no-param-reassign */
/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import produce from 'immer';

import { RootStore, SidebarSlice } from '../../types/store/StoreTypes';

export const useSidebarStoreSlice = (set: (...any: any) => void): SidebarSlice => ({
	filterHasFocus: false,
	setFilterHasFocus: (hasFocus: boolean): void => {
		set(
			produce((draft: RootStore) => {
				draft.filterHasFocus = hasFocus;
			}),
			false,
			'SIDEBAR/SET_FILTER_FOCUS'
		);
	}
});
