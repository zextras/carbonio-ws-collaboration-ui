/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { CapabilityType, ExportStatus } from '../../types/store/SessionTypes';
import { RootStore } from '../../types/store/StoreTypes';
import { UserType } from '../../types/store/UserTypes';

export const getSelectedRoomId = (store: RootStore): string | undefined =>
	store.session.selectedRoomOneToOneGroup;
export const getSelectedConversation = (store: RootStore, roomId: string): boolean =>
	store.session.selectedRoomOneToOneGroup === roomId;

export const getSidebarFilterHasFocus = (store: RootStore): boolean => store.session.filterHasFocus;

export const getCapability = (
	store: RootStore,
	capabilityName: CapabilityType
): boolean | number | undefined => store.session.capabilities?.[capabilityName];

export const getUserId = (store: RootStore): string | undefined => store.session?.id;

export const getCustomLogo = (store: RootStore): string | false | undefined =>
	store.session?.customLogo;

export const getIsLoggedUserExternal = (store: RootStore): boolean =>
	store.session?.userType === UserType.GUEST;

export const getExportedChat = (store: RootStore): string | undefined =>
	store.session.chatExporting?.roomId;

export const getExportStatus = (store: RootStore): ExportStatus | undefined =>
	store.session.chatExporting?.status;
