/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { RootStore } from '../../types/store/StoreTypes';
import { User, UsersMap } from '../../types/store/UserTypes';

export const getUsersSelector = (store: RootStore): UsersMap => store.users;

export const getUserSelector = (store: RootStore, id: string | undefined): User | undefined =>
	id ? store.users[id] : undefined;

export const getUserName = (store: RootStore, id: string): string | undefined =>
	store.users[id]?.name || store.users[id]?.email || store.users[id]?.id;

export const getUserLastActivity = (store: RootStore, id: string): number | undefined =>
	store.users[id]?.last_activity;

export const getUserOnline = (store: RootStore, id: string): boolean | undefined =>
	store.users[id]?.online;

export const getUserEmail = (store: RootStore, id: string): string | undefined =>
	store.users[id]?.email;

export const getUserStatusMessage = (store: RootStore, id: string): string | undefined =>
	store.users[id]?.statusMessage;

export const getUserPictureUpdatedAt = (store: RootStore, id: string): string | undefined =>
	store.users[id]?.pictureUpdatedAt;

// inside the component call like this; users = useStore(getUsersSelector)
