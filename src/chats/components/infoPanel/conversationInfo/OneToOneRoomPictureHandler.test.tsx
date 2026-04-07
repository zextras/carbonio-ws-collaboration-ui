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
	createMockAttributesList,
	createMockMember,
	createMockRoom,
	createMockUser
} from '../../../../tests/createMock';
import { setup } from '../../../../tests/test-utils';
import { RoomBe, RoomType } from '../../../../types/network/models/roomBeTypes';
import { RootStore } from '../../../../types/store/StoreTypes';
import { User } from '../../../../types/store/UserTypes';

const user1Info: User = createMockUser();

const user2Info: User = createMockUser();

const testRoom: RoomBe = createMockRoom({
	type: RoomType.ONE_TO_ONE,
	members: [createMockMember({ userId: user1Info.id }), createMockMember({ userId: user2Info.id })]
});

beforeEach(() => {
	const store: RootStore = useStore.getState();
	store.setLoginInfo({ id: user1Info.id, name: user1Info.name });
	store.setUserInfo([user1Info, user2Info]);
	store.addRooms([testRoom]);
	store.setAttributes(createMockAttributesList({ carbonioWscShowUsersPresence: 'TRUE' }));
});

describe('Room Picture Handler - one_to_one', () => {
	test('label should show "Last seen" phrase if lastActivity is present', () => {
		act(() => useStore.getState().setUserLastActivity(user2Info.id, 1642818617000));
		setup(<OneToOneRoomPictureHandler memberId={user2Info.id} />);

		// last activity is 2022/01/22 at 03:30:17
		expect(screen.getByText(/Last seen 01\/22\/2022/i)).toBeInTheDocument();
	});
	test('label should show "Online"', () => {
		act(() => useStore.getState().setUserPresence(user2Info.id, true));
		setup(<OneToOneRoomPictureHandler memberId={user2Info.id} />);

		expect(screen.getByTestId('user_presence_dot')).toBeInTheDocument();
	});
});
