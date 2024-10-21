/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import * as Shell from '@zextras/carbonio-shell-ui';
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

export const mockNotify: jest.Mock = jest.fn();

export const NOTIFICATION_MANAGER = {
	showPopup: jest.fn(),
	notify: mockNotify,
	multipleNotify: jest.fn(),
	playSound: jest.fn()
};

function pushHistoryMock(location: Shell.HistoryParams): void {
	console.log('push history', location);
	if (typeof location === 'string') {
		history.push(location);
	} else {
		history.push(location.path);
	}
}

function replaceHistoryMock(location: Shell.HistoryParams): void {
	console.log('replace history', location);
	if (typeof location === 'string') {
		history.replace(location);
	} else {
		history.replace(location.path);
	}
}

export const mockUseAuthenticated = jest.fn();

export const useAuthenticated: typeof Shell.useAuthenticated = (): boolean => false;

export const useUserSettings: typeof Shell.useUserSettings = () => USER_SETTINGS;

export const useCurrentRoute: typeof Shell.useCurrentRoute = () => ROUTE_SETTINGS;

export const getUserAccount: typeof Shell.getUserAccount = () => ACCOUNT;

export const getNotificationManager: typeof Shell.getNotificationManager = () =>
	NOTIFICATION_MANAGER;

export const SettingsHeader: typeof Shell.SettingsHeader = () => <div>settings header</div>;

export const Spinner: typeof Shell.Spinner = () => <div>spinner</div>;

export const pushHistory: typeof Shell.pushHistory = pushHistoryMock;

export const replaceHistory: typeof Shell.replaceHistory = replaceHistoryMock;
export const t = (key: string, value: string): string => value;

export const useIntegratedFunction: typeof Shell.useIntegratedFunction = (id) => {
	switch (id) {
		case 'get-node':
			return [getNode, getNodeAvailable];
		case 'select-nodes':
			return [filesSelectFilesAction, filesSelectFilesActionAvailable];
		case 'get-link':
			return [getLink, functionCheck];
		default:
			return [(): void => undefined, false];
	}
};

export const updatePrimaryBadge: typeof Shell.updatePrimaryBadge = () => undefined;

export const mockSoapFetch = jest.fn();
export const soapFetch: typeof Shell.soapFetch = () =>
	new Promise((resolve, reject) => {
		const result = mockSoapFetch();
		result ? resolve(result) : reject(new Error('error'));
	});
