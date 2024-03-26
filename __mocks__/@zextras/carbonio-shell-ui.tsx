/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { ReactElement } from 'react';

import {
	Account,
	AccountSettings,
	AppRoute,
	INotificationManager
} from '@zextras/carbonio-shell-ui';
import { createMemoryHistory } from 'history';

import {
	filesSelectFilesAction,
	filesSelectFilesActionAvailable,
	functionCheck,
	getLink,
	getNode,
	getNodeAvailable
} from './carbonio-files-ui';

const history = createMemoryHistory();

export const USER_SETTINGS: AccountSettings = {
	attrs: {},
	props: [],
	prefs: {
		zimbraPrefTimeZoneId: 'UTC'
	}
};

export const ROUTE_SETTINGS: AppRoute = {
	id: 'chats',
	route: 'chats',
	app: 'Chats'
};

export const ACCOUNT: Account = {
	id: 'myId',
	name: 'User 1',
	displayName: 'User 1',
	signatures: { signature: [] },
	identities: { identity: [] },
	rights: { targets: [] }
};

export const mockNotify: jest.Mock = jest.fn();

export const NOTIFICATION_MANAGER = {
	showPopup: jest.fn(),
	notify: mockNotify,
	multipleNotify: jest.fn(),
	playSound: jest.fn()
};

function pushHistoryMock(location: string | Location): void {
	if (typeof location === 'string') {
		history.push(location);
	} else {
		history.push({ ...location, pathname: location.pathname });
	}
}

function replaceHistoryMock(location: string | Location): void {
	if (typeof location === 'string') {
		history.replace(location);
	} else {
		history.replace({ ...location, pathname: location.pathname });
	}
}

export const useUserSettings = (): AccountSettings => USER_SETTINGS;

export const useCurrentRoute = (): AppRoute | undefined => ROUTE_SETTINGS;

export const getUserAccount = (): Account => ACCOUNT;

export const getNotificationManager = (): INotificationManager => NOTIFICATION_MANAGER;

export const SettingsHeader = (): ReactElement => <div>settings header</div>;

export const Spinner = (): ReactElement => <div>spinner</div>;

export const pushHistory = jest.fn(pushHistoryMock);

export const replaceHistory = jest.fn(replaceHistoryMock);
export const t = (key: string, value: string): string => value;

export const useIntegratedFunction = jest.fn(() => [
	getNode,
	getNodeAvailable,
	filesSelectFilesAction,
	filesSelectFilesActionAvailable,
	getLink,
	functionCheck
]);
