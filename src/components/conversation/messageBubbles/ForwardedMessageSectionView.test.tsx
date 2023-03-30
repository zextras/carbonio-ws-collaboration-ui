/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { screen } from '@testing-library/react';
import React from 'react';
import { setup } from 'test-utils';

import ForwardedMessageSectionView from './ForwardedMessageSectionView';
import useStore from '../../../store/Store';
import { createMockRoom, createMockTextMessage, createMockUser } from '../../../tests/createMock';
import { RoomBe } from '../../../types/network/models/roomBeTypes';
import { UserBe } from '../../../types/network/models/userBeTypes';
import { ForwardedMessage } from '../../../types/store/MessageTypes';
import { RootStore } from '../../../types/store/StoreTypes';

const forwardedUser: UserBe = createMockUser({ id: 'forwardedUserId', name: 'User' });

const testRoom: RoomBe = createMockRoom({
	id: 'roomTest',
	name: 'Test room'
});

const messageToForward = createMockTextMessage({ roomId: testRoom.id, from: forwardedUser.id });

const forwardedMessage: ForwardedMessage = {
	id: messageToForward.id,
	date: messageToForward.date,
	from: messageToForward.from,
	text: messageToForward.text
};

describe('Forward Message Section View', () => {
	test('All elements are rendered', () => {
		const store: RootStore = useStore.getState();
		store.addRoom(testRoom);
		store.setUserInfo(forwardedUser);
		setup(
			<ForwardedMessageSectionView
				forwardedMessage={forwardedMessage}
				isMyMessage={false}
				roomId={testRoom.id}
			/>
		);

		// Displayed username is the username of who forward message
		const userName = screen.getByText(new RegExp(forwardedUser.name, 'i'));
		expect(userName).toBeInTheDocument();

		// Displayed text is the text of the forwarded message
		const message = screen.getByText(new RegExp(forwardedMessage.text, 'i'));
		expect(message).toBeInTheDocument();
	});
});
