/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import * as Shell from '@zextras/carbonio-shell-ui';
import { type Mock } from 'vitest';

export const USER_SETTINGS: Shell.AccountSettings = {
	attrs: {},
	props: [],
	prefs: {}
};

export const ROUTE_SETTINGS = {
	id: 'chats',
	route: 'chats',
	app: 'Chats'
};

export const ACCOUNT: Shell.Account = {
	id: 'myId',
	name: 'User 1',
	displayName: 'User 1',
	signatures: { signature: [] },
	identities: { identity: [] },
	rights: { targets: [] }
};

export const mockNotify: Mock = vi.fn();

export const NOTIFICATION_MANAGER = {
	showPopup: vi.fn(),
	notify: mockNotify,
	multipleNotify: vi.fn(),
	playSound: vi.fn()
};

export const IS_FOCUS_MODE = false;

export const useAuthenticated: typeof Shell.useAuthenticated = () => true;

export const useUserSettings: typeof Shell.useUserSettings = () => USER_SETTINGS;

export const useCurrentRoute: typeof Shell.useCurrentRoute = () => ROUTE_SETTINGS;

export const getUserAccount: typeof Shell.getUserAccount = () => ACCOUNT;

export const useIsCarbonioCE: typeof Shell.useIsCarbonioCE = () => false;

export const getNotificationManager: typeof Shell.getNotificationManager = () =>
	NOTIFICATION_MANAGER;

export const addRoute: typeof Shell.addRoute = () => '';

export const addSettingsView: typeof Shell.addSettingsView = () => '';

export const registerComponents: typeof Shell.registerComponents = () => undefined;

export const removeActions: typeof Shell.removeActions = () => undefined;

export const SettingsHeader: typeof Shell.SettingsHeader = () => <div>settings header</div>;

export const t = (key: string, value: string): string => value;

export const useIntegratedFunction: typeof Shell.useIntegratedFunction = <T,>(id: string) => {
	switch (id) {
		case 'select-nodes':
			return [vi.fn() as T, true];
		case 'get-link':
			return [vi.fn() as T, true];
		default:
			return [((): void => undefined) as T, false];
	}
};

export const updatePrimaryBadge: typeof Shell.updatePrimaryBadge = () => undefined;

export const useTracker: typeof Shell.useTracker = () => ({
	capture: vi.fn(),
	enableTracker: vi.fn(),
	reset: vi.fn()
});
