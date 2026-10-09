/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { gte } from 'semver';

import { AttributesList, ExportStatus } from '../../types/store/SessionTypes';
import { RootStore } from '../../types/store/StoreTypes';
import { UserType } from '../../types/store/UserTypes';

export const getSelectedConversation = (store: RootStore, roomId: string): boolean =>
	store.session.selectedRoom === roomId;

export const getAttribute = (
	store: RootStore,
	attributeName: keyof AttributesList
): boolean | number | string | undefined => store.session.attributes?.[attributeName];

export const getUserId = (store: RootStore): string | undefined => store.session?.id;

export const WSC_PURE_MIN_VERSION = '2.0.0';

/**
 * True when the negotiated backend speaks the WSC-pure protocol (>= 2.0.0):
 * REST writes + single push WebSocket, no MongooseIM. The version gate is the
 * feature flag — against a 1.6.x backend every v2 branch is dormant.
 */
export const getIsWscPure = (store: RootStore): boolean => {
	const { apiVersion } = store.session;
	return !!apiVersion && gte(apiVersion, WSC_PURE_MIN_VERSION);
};

export const getIsLoggedUser = (store: RootStore, userId: string): boolean =>
	userId === store.session?.id;

export const getCustomLogo = (store: RootStore): string | false | undefined =>
	store.session?.customLogo;

export const getIsLoggedUserExternal = (store: RootStore): boolean =>
	store.session?.userType === UserType.GUEST;

export const getExportedChat = (store: RootStore): string | undefined =>
	store.session.chatExporting?.roomId;

export const getExportStatus = (store: RootStore): ExportStatus | undefined =>
	store.session.chatExporting?.status;
