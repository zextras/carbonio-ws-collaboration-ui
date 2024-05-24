/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen } from '@testing-library/react';

import MeetingAccessPageView from './MeetingAccessPageView';
import { mockDarkReaderEnable } from '../../../__mocks__/darkreader';
import { setup } from '../../tests/test-utils';

describe('MeetingAccessPageView', () => {
	test('Render the component', async () => {
		setup(<MeetingAccessPageView />);
		const wrapper = screen.getByTestId('meeting_access_page_view');
		expect(wrapper).toBeVisible();
	});

	test('Enable the DarkReader for the page', async () => {
		setup(<MeetingAccessPageView />);
		expect(mockDarkReaderEnable).toHaveBeenCalled();
	});
});
