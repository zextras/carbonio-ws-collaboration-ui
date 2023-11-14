/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { act, screen } from '@testing-library/react';

import OneToOneRoomPictureHandler from './OneToOneRoomPictureHandler';
import useStore from '../../../../store/Store';
import {
	createMockCapabilityList,
	createMockMember,
	createMockRoom
} from '../../../../tests/createMock';
import { setup } from '../../../../tests/test-utils';
import { RoomBe, RoomType } from '../../../../types/network/models/roomBeTypes';
import { RootStore } from '../../../../types/store/StoreTypes';
import { User } from '../../../../types/store/UserTypes';

const pictureUpdatedAtTime = '2022-08-25T17:24:28.961+02:00';

const user1Info: User = {
	id: 'myId',
	email: 'user1@domain.com',
	name: 'User 1',
	pictureUpdatedAt: pictureUpdatedAtTime
};

const user2Info: User = {
	id: 'otherId',
	email: 'user2@domain.com',
	name: 'User 2',
	pictureUpdatedAt: pictureUpdatedAtTime,
	last_activity: 1642818965849
};

const testRoom: RoomBe = createMockRoom({
	pictureUpdatedAt: pictureUpdatedAtTime,
	type: RoomType.ONE_TO_ONE,
	members: [createMockMember({ userId: user1Info.id }), createMockMember({ userId: user2Info.id })]
});

describe('Room Picture Handler - one_to_one', () => {
	test('everything should be rendered - with image', async () => {
		const store: RootStore = useStore.getState();
		store.addRoom(testRoom);
		store.setUserInfo(user1Info);
		store.setUserInfo(user2Info);
		store.setLoginInfo(user1Info.id, user1Info.name);
		const { user } = setup(<OneToOneRoomPictureHandler memberId={user2Info.id} />);

		// Simulate USER_PICTURE_CHANGED WebSocket event
		act(() => {
			store.setUserPictureUpdated(user2Info.id, pictureUpdatedAtTime);
		});

		const pictureContainer = screen.getByTestId('picture_container');
		await user.hover(pictureContainer);

		const userName = screen.getByText(new RegExp(`${user2Info.name}`, 'i'));

		expect(userName).toBeInTheDocument();
	});
	test('label should show "Last seen" phrase if last_activity is present', () => {
		const store: RootStore = useStore.getState();
		store.addRoom(testRoom);
		store.setUserInfo(user1Info);
		store.setUserInfo(user2Info);
		store.setLoginInfo(user1Info.id, user1Info.name);
		store.setCapabilities(createMockCapabilityList({ canSeeUsersPresence: true }));
		act(() => store.setUserLastActivity(user2Info.id, 1642818617000));
		setup(<OneToOneRoomPictureHandler memberId={user2Info.id} />);

		// last activity is 2022/01/22 at 03:30:17
		expect(screen.getByText(/Last seen 01\/22\/2022/i)).toBeInTheDocument();
	});
	test('label should show "Online"', () => {
		const store: RootStore = useStore.getState();
		store.addRoom(testRoom);
		store.setUserInfo(user1Info);
		store.setUserInfo(user2Info);
		store.setLoginInfo(user1Info.id, user1Info.name);
		store.setCapabilities(createMockCapabilityList({ canSeeUsersPresence: true }));
		act(() => store.setUserPresence(user2Info.id, true));
		setup(<OneToOneRoomPictureHandler memberId={user2Info.id} />);

		expect(screen.getByTestId('user_presence_dot')).toBeInTheDocument();
	});
});
