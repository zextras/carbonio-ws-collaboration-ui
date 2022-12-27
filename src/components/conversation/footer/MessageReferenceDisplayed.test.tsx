/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { screen } from '@testing-library/react';
import React from 'react';
import { setup } from 'test-utils';

import useStore from '../../../store/Store';
import { createMockRoom, createMockTextMessage } from '../../../tests/createMock';
import { RoomBe } from '../../../types/network/models/roomBeTypes';
import { messageActionType } from '../../../types/store/ActiveConversationTypes';
import { TextMessage } from '../../../types/store/MessageTypes';
import { RoomType } from '../../../types/store/RoomTypes';
import { User } from '../../../types/store/UserTypes';
import MessageReferenceDisplayed from './MessageReferenceDisplayed';

const mockedRoom: RoomBe = createMockRoom({
	id: 'roomId',
	type: RoomType.GROUP
});

const myId = 'myId'; // on DS them will be color #EF9A9A

const mockedRepliedTextMessage: TextMessage = createMockTextMessage({
	id: 'messageId',
	roomId: mockedRoom.id,
	from: 'user1',
	text: 'Text message used for test'
});

const myMockedRepliedTextMessage: TextMessage = createMockTextMessage({
	id: 'messageId',
	roomId: mockedRoom.id,
	from: myId,
	text: 'Text message sent by me'
});

const user1: User = {
	id: 'user1',
	email: 'user1@domain.com',
	name: 'User 1', // on DS them will be color #FFA726
	lastSeen: 1234567890,
	statusMessage: "Hey there! I'm User 1"
};

const referenceMessage = {
	roomId: mockedRoom.id,
	messageId: mockedRepliedTextMessage.id,
	senderId: mockedRepliedTextMessage.from,
	actionType: messageActionType.REPLAY
};

const myReferenceMessage = {
	roomId: mockedRoom.id,
	messageId: myMockedRepliedTextMessage.id,
	senderId: myMockedRepliedTextMessage.from,
	actionType: messageActionType.REPLAY
};

describe('Message reference displayed', () => {
	test('Display the reference message of another user in a reply action of user', async () => {
		const store = useStore.getState();
		store.setSessionId(myId);
		store.addRoom(mockedRoom);
		store.setUserInfo(user1);
		store.newMessage(mockedRepliedTextMessage);
		setup(<MessageReferenceDisplayed referenceMessage={referenceMessage} />);
		const userNameComponent = await screen.findByTestId('reference-message-username');
		expect(userNameComponent).toBeInTheDocument();
		const userName = screen.getByText(/User 1/i);
		expect(userName).toBeInTheDocument();
		expect(userName).toHaveStyle('color: #FFA726');
		const borderComponent = await screen.findByTestId('reference-border-message');
		expect(borderComponent).toBeInTheDocument();
		expect(borderComponent).toHaveStyle('border-left: 0.25rem solid #FFA726');
		const message = screen.getByText(/Text message used for test/i);
		expect(message).toBeInTheDocument();
	});
	test('Display the reference message of my message in a reply action of user', async () => {
		const store = useStore.getState();
		store.setLoginInfo(myId, 'me@userme.it');
		store.addRoom(mockedRoom);
		store.newMessage(myMockedRepliedTextMessage);
		setup(<MessageReferenceDisplayed referenceMessage={myReferenceMessage} />);
		const replyToMySelfLabel = screen.getByText(/Reply to yourself/i);
		expect(replyToMySelfLabel).toBeInTheDocument();
		expect(replyToMySelfLabel).toHaveStyle('color: #828282');
		const borderComponent = await screen.findByTestId('reference-border-message');
		expect(borderComponent).toBeInTheDocument();
		expect(borderComponent).toHaveStyle('border-left: 0.25rem solid #EF9A9A');
		const message = screen.getByText(/Text message sent by me/i);
		expect(message).toBeInTheDocument();
	});
});
