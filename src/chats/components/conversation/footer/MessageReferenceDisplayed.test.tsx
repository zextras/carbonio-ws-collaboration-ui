/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen } from '@testing-library/react';

import MessageReferenceDisplayed from './MessageReferenceDisplayed';
import useStore from '../../../../store/Store';
import {
	createMockRoom,
	createMockTextMessage,
	createMockUser
} from '../../../../tests/createMock';
import { setup } from '../../../../tests/test-utils';
import { RoomBe } from '../../../../types/network/models/roomBeTypes';
import { UserBe } from '../../../../types/network/models/userBeTypes';
import { messageActionType } from '../../../../types/store/ActiveConversationTypes';
import { RoomType } from '../../../../types/store/RoomTypes';
import { User } from '../../../../types/store/UserTypes';

const refBorderMsg = 'reference-border-message';

const mockedRoom: RoomBe = createMockRoom({
	id: 'roomId',
	type: RoomType.GROUP
});

const myId = 'myId'; // on DS them will be color #EF9A9A

const mockedRepliedTextMessage = createMockTextMessage({
	id: 'messageId',
	roomId: mockedRoom.id,
	from: 'user1',
	text: 'Text message used for test'
});

const myMockedRepliedTextMessage = createMockTextMessage({
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

const forwardedUser: UserBe = createMockUser({ id: 'forwardedUserId' });

const forwardedTextMessage = createMockTextMessage({
	id: 'messageId',
	roomId: mockedRoom.id,
	from: user1.id,
	text: 'Forwarded text!',
	forwarded: {
		from: forwardedUser.id,
		date: 1661441294393,
		count: 1
	}
});

const attachmentTextMessage = createMockTextMessage({
	id: 'messageId',
	roomId: mockedRoom.id,
	from: user1.id,
	text: '',
	attachment: {
		id: 'attachmentId',
		name: 'file_name',
		mimeType: 'image/png',
		size: 1661441294393
	}
});

describe('Message reference displayed', () => {
	test('Display the reference message of another user in a reply action of user', async () => {
		const store = useStore.getState();
		store.setSessionId(myId);
		store.addRoom(mockedRoom);
		store.setUserInfo(user1);
		store.newMessage(mockedRepliedTextMessage);

		const referenceMessage = {
			roomId: mockedRoom.id,
			messageId: mockedRepliedTextMessage.id,
			senderId: mockedRepliedTextMessage.from,
			stanzaId: mockedRepliedTextMessage.stanzaId,
			actionType: messageActionType.REPLY
		};
		setup(<MessageReferenceDisplayed referenceMessage={referenceMessage} />);
		const userNameComponent = await screen.findByTestId('reference-message-username');
		expect(userNameComponent).toBeInTheDocument();
		const userName = screen.getByText(/User 1/i);
		expect(userName).toBeInTheDocument();
		expect(userName).toHaveStyle('color: #FFA726');
		const borderComponent = await screen.findByTestId(refBorderMsg);
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

		const myReferenceMessage = {
			roomId: mockedRoom.id,
			messageId: myMockedRepliedTextMessage.id,
			senderId: myMockedRepliedTextMessage.from,
			stanzaId: myMockedRepliedTextMessage.stanzaId,
			actionType: messageActionType.REPLY
		};
		setup(<MessageReferenceDisplayed referenceMessage={myReferenceMessage} />);
		const replyToMySelfLabel = screen.getByText(/Reply to yourself/i);
		expect(replyToMySelfLabel).toBeInTheDocument();
		expect(replyToMySelfLabel).toHaveStyle('color: #828282');
		const borderComponent = await screen.findByTestId(refBorderMsg);
		expect(borderComponent).toBeInTheDocument();
		expect(borderComponent).toHaveStyle('border-left: 0.25rem solid #EF9A9A');
		const message = screen.getByText(/Text message sent by me/i);
		expect(message).toBeInTheDocument();
	});
	test('Display the reference message I want to edit', async () => {
		const store = useStore.getState();
		store.setLoginInfo(myId, 'me@userme.it');
		store.addRoom(mockedRoom);
		store.newMessage(myMockedRepliedTextMessage);
		const myReferenceEditMessage = {
			roomId: mockedRoom.id,
			messageId: myMockedRepliedTextMessage.id,
			senderId: myMockedRepliedTextMessage.from,
			stanzaId: myMockedRepliedTextMessage.stanzaId,
			actionType: messageActionType.EDIT
		};
		setup(<MessageReferenceDisplayed referenceMessage={myReferenceEditMessage} />);
		const editYourMessageLabel = screen.getByText(/Edit your message/i);
		expect(editYourMessageLabel).toBeInTheDocument();
		expect(editYourMessageLabel).toHaveStyle('color: #828282');
		const borderComponent = await screen.findByTestId(refBorderMsg);
		expect(borderComponent).toBeInTheDocument();
		expect(borderComponent).toHaveStyle('border-left: 0.25rem solid #EF9A9A');
		const message = screen.getByText(/Text message sent by me/i);
		expect(message).toBeInTheDocument();
	});

	test('Reference message is a forwarded message', async () => {
		const store = useStore.getState();
		store.setSessionId(myId);
		store.setUserInfo(user1);
		store.setUserInfo(forwardedUser);
		store.addRoom(mockedRoom);
		store.newMessage(forwardedTextMessage);

		const referenceMessage = {
			roomId: mockedRoom.id,
			messageId: forwardedTextMessage.id,
			senderId: forwardedTextMessage.from,
			stanzaId: forwardedTextMessage.stanzaId,
			actionType: messageActionType.REPLY
		};
		setup(<MessageReferenceDisplayed referenceMessage={referenceMessage} />);

		const userNameComponent = await screen.findByTestId('reference-message-username');
		expect(userNameComponent).toBeInTheDocument();

		// Displayed username is the username of who forward message
		const userName = screen.getByText(new RegExp(user1.name, 'i'));
		expect(userName).toBeInTheDocument();

		// Displayed text is the text of the forwarded message
		const message = screen.getByText(new RegExp(forwardedTextMessage.text || '', 'i'));
		expect(message).toBeInTheDocument();
	});

	test('Reference message is a message with an attachment', async () => {
		const store = useStore.getState();
		store.setSessionId(myId);
		store.setUserInfo(user1);
		store.addRoom(mockedRoom);
		store.newMessage(attachmentTextMessage);

		const referenceMessage = {
			roomId: mockedRoom.id,
			messageId: attachmentTextMessage.id,
			senderId: attachmentTextMessage.from,
			stanzaId: attachmentTextMessage.stanzaId,
			actionType: messageActionType.REPLY
		};
		setup(<MessageReferenceDisplayed referenceMessage={referenceMessage} />);

		// Displayed username is the username of who forward message
		const userName = screen.getByText(new RegExp(user1.name, 'i'));
		expect(userName).toBeInTheDocument();

		// Displayed text is the attachment name
		const message = screen.getByText(new RegExp(attachmentTextMessage.attachment?.name || '', 'i'));
		expect(message).toBeInTheDocument();
	});
});
