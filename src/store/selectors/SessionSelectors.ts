/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { CapabilityType } from '../../types/store/SessionTypes';
import { RootStore } from '../../types/store/StoreTypes';

export const getSelectedConversation = (store: RootStore, roomId: string): boolean =>
	store.session.selectedRoomOneToOneGroup === roomId;

export const getPrefTimezoneSelector = (store: RootStore): string => store.session.userPrefTimeZone;

export const getCapability = (
	store: RootStore,
	capabilityName: CapabilityType
): boolean | number | undefined =>
	store.session.capabilities && store.session.capabilities[capabilityName];