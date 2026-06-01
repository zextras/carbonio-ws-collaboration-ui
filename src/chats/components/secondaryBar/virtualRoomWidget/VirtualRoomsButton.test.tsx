/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { screen } from '@testing-library/react';

import VirtualRoomsButton from './VirtualRoomsButton';
import useStore from '../../../../store/Store';
import {
	createMockAttributesList,
	createMockMeeting,
	createMockUser
} from '../../../../tests/createMock';
import { setup } from '../../../../tests/test-utils';
import { MeetingType } from '../../../../types/network/models/meetingBeTypes';
import * as api from 'wsc-shared';
import { SearchUsersByFeatureSoapResponse } from 'wsc-shared';

const sessionUser = createMockUser({ id: 'sessionId', name: 'Session User' });

const user1 = createMockUser({ id: 'user1', name: 'User 1' });

const virtualRoom = createMockMeeting({ meetingType: MeetingType.SCHEDULED });

const mockSearchUsersByFeatureRequest = vi.hoisted(() => vi.fn());
vi.mock('wsc-shared', async (importOriginal) => ({
	...(await importOriginal()),
	searchUsersByFeatureRequest: (...args: unknown[]): Promise<SearchUsersByFeatureSoapResponse> =>
		Promise.resolve(mockSearchUsersByFeatureRequest(...args))
}));

beforeEach(() => {
	const store = useStore.getState();
	store.setLoginInfo({ id: sessionUser.id, name: sessionUser.name });
	store.setUserInfo([user1]);
	store.setAttributes(createMockAttributesList({ carbonioWscVideoCallEnabled: 'TRUE' }));
	store.addMeetings([virtualRoom]);
});
describe('VirtualRoomsButton', () => {
	test('create virtual modal', async () => {
		mockSearchUsersByFeatureRequest.mockReturnValueOnce({ contacts: [] });
		const spyOnAddRoom = vi.spyOn(api, 'addRoom');

		const { user } = setup(<VirtualRoomsButton expanded />);

		const button = screen.getByRole('button');
		await user.click(button);

		const createButton = await screen.findByText('Create new virtual room');
		expect(createButton).toBeVisible();

		await user.click(createButton);

		const modalTitle = await screen.findByText('Create new Virtual Room');
		expect(modalTitle).toBeInTheDocument();

		const textArea = await screen.findByText('Virtual Room’s name*');

		await user.type(textArea, 'test');

		const createRoomButton = screen.getByRole('button', { name: 'Create' });
		expect(createRoomButton).toBeEnabled();

		await user.click(createRoomButton);
		expect(spyOnAddRoom).toHaveBeenCalled();
	});

	test('ongoing meeting in virtual room', async () => {
		setup(<VirtualRoomsButton expanded />);

		// check if there's a video icon inside the button
		const button = screen.getByTestId('icon: Video');
		expect(button).toBeInTheDocument();
	});
});
