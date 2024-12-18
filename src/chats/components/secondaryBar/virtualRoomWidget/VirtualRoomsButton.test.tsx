/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { screen } from '@testing-library/react';

import VirtualRoomsButton from './VirtualRoomsButton';
import useStore from '../../../../store/Store';
import { createMockCapabilityList, createMockUser } from '../../../../tests/createMock';
import { RoomsApiToSpy, spyOnRoomsApi } from '../../../../tests/mocks/network';
import { mockSearchUsersByFeatureRequest } from '../../../../tests/mocks/SearchUsersByFeature';
import { setup } from '../../../../tests/test-utils';

const createNewRoom = 'Create new Room';
const virtualRoomName = 'New Virtual Room';
const createNewVirtualRoom = 'Create new Virtual Room';
const newVirtualRoomsName = 'New Virtual Room’s name*';

const sessionUser = createMockUser({ id: 'sessionId', name: 'Session User' });

const user1 = createMockUser({ id: 'user1', name: 'User 1' });

beforeEach(() => {
	const store = useStore.getState();
	store.setLoginInfo(sessionUser.id, sessionUser.name);
	store.setUserInfo(user1);
	store.setCapabilities(createMockCapabilityList({ canVideoCall: true }));
});

describe('VirtualRoomsButton', () => {
	test('create virtual modal', async () => {
		mockSearchUsersByFeatureRequest.mockReturnValueOnce([]);
		const spyOnAddRoom = spyOnRoomsApi(RoomsApiToSpy.ADD_ROOM);

		const { user } = setup(<VirtualRoomsButton expanded />);

		const button = screen.getByRole('button');
		await user.click(button);

		const createButton = await screen.findByRole('button', { name: createNewRoom });
		expect(createButton).toBeVisible();

		await user.click(createButton);

		const modalTitle = await screen.findByText(createNewVirtualRoom);
		expect(modalTitle).toBeInTheDocument();

		const textArea = await screen.findByText(newVirtualRoomsName);

		await user.type(textArea, virtualRoomName);

		const createRoomButton = screen.getByRole('button', { name: 'create' });
		expect(createRoomButton).toBeEnabled();

		await user.click(createRoomButton);
		expect(spyOnAddRoom).toHaveBeenCalled();
	});
});
