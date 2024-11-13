/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen } from '@testing-library/react';

import SettingsView from './SettingsView';
import useStore from '../../store/Store';
import { setup } from '../../tests/test-utils';

describe('SettingsView tests', () => {
	test('SettingsView renders correctly if session user is loaded', () => {
		useStore.getState().setLoginInfo('sessionId', 'Session User');
		setup(<SettingsView />);
		expect(screen.getByTestId('settings_container')).toBeInTheDocument();
	});

	test('SettingsView renders Spinner if session user is not loaded', () => {
		setup(<SettingsView />);
		expect(screen.getByTestId('spinner')).toBeInTheDocument();
	});
});
