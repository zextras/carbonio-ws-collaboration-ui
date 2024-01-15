/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { CapabilityType } from '../../types/store/SessionTypes';
import { RootStore } from '../../types/store/StoreTypes';

export const getSelectedRoomId = (store: RootStore): string | undefined =>
	store.session.selectedRoomOneToOneGroup;
export const getSelectedConversation = (store: RootStore, roomId: string): boolean =>
	store.session.selectedRoomOneToOneGroup === roomId;

export const getSidebarFilterHasFocus = (store: RootStore): boolean => store.session.filterHasFocus;

export const getCapability = (
	store: RootStore,
	capabilityName: CapabilityType
): boolean | number | undefined =>
	store.session.capabilities && store.session.capabilities[capabilityName];

export const getUserId = (store: RootStore): string | undefined => store.session?.id;

export const getCustomLogo = (store: RootStore): string | false | undefined =>
	store.session?.customLogo;
