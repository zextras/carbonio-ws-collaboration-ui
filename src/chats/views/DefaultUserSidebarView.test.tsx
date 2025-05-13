/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { act } from '@testing-library/react';

import DefaultUserSidebarView from './DefaultUserSidebarView';
import useStore from '../../store/Store';
import { createMockAttributesList, createMockUser } from '../../tests/createMock';
import { screen, setup } from '../../tests/test-utils';
import { UserBe } from '../../types/network/models/userBeTypes';

const user1: UserBe = createMockUser({ id: 'user1Id', name: 'user 1' });

describe('DefaultUserSidebarView', () => {
	test('should render virtual button when empty', () => {
		act(() => {
			useStore.getState().setUserInfo([user1]);
			useStore.getState().setLoginInfo('user1Id', 'user 1');
			useStore
				.getState()
				.setAttributes(createMockAttributesList({ carbonioWscVideoCallEnabled: 'TRUE' }));
		});

		setup(<DefaultUserSidebarView expanded />);

		expect(screen.getByText('Your Virtual Rooms')).toBeInTheDocument();
	});
});
