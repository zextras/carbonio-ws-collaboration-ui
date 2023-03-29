/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { screen } from '@testing-library/react';
import { act, renderHook } from '@testing-library/react-hooks';
import React from 'react';
import { setup, triggerObserver } from 'test-utils';

import MessagesList from './MessagesList';
import useStore from '../../store/Store';
import {
	createMockDeletedMessage,
	createMockRoom,
	createMockTextMessage
} from '../../tests/createMock';
import { RoomBe, RoomType } from '../../types/network/models/roomBeTypes';
import { MarkerStatus } from '../../types/store/MarkersTypes';
import {
	AffiliationMessage,
	ConfigurationMessage,
	MessageType,
	TextMessage
} from '../../types/store/MessageTypes';
import { RootStore } from '../../types/store/StoreTypes';
import { User } from '../../types/store/UserTypes';

const user2Be: User = {
	id: 'user2',
	email: 'user2@domain.com',
	name: 'User2',
	lastSeen: 1234567890,
	statusMessage: "Hey there! I'm User 2"
};

const user3Be: User = {
	id: 'user3',
	email: 'user3@domain.com',
	name: 'User3',
	lastSeen: 1234567890,
	statusMessage: "Hey there! I'm User 3"
};

const user1Be: User = {
	id: 'user1',
	email: 'user1@domain.com',
	name: 'User1',
	lastSeen: 1234567890,
	statusMessage: "Hey there! I'm User 1"
};

const user4Be: User = {
	id: 'user4',
	email: 'user4@domain.com',
	name: 'User4',
	lastSeen: 1234567890,
	statusMessage: "Hey there! I'm User 4"
};

const room: RoomBe = {
	id: 'Room-Id',
	name: 'Room Name',
	description: 'This is the description of the group',
	type: RoomType.GROUP,
	hash: 'hash',
	createdAt: '1234567',
	updatedAt: '12345678',
	pictureUpdatedAt: '123456789',
	members: [
		{
			userId: user1Be.id,
			owner: true,
			temporary: false,
			external: false
		},
		{
			userId: user2Be.id,
			owner: false,
			temporary: false,
			external: false
		},
		{
			userId: user3Be.id,
			owner: false,
			temporary: false,
			external: false
		}
	]
};

const mockedAffiliationMessage: AffiliationMessage = {
	id: 'Affiliationid',
	roomId: room.id,
	date: 1234566789,
	type: MessageType.AFFILIATION_MSG,
	userId: user4Be.id,
	as: 'member'
};

const mockedConfigurationMessage: ConfigurationMessage = {
	id: 'ConfigurationId',
	roomId: room.id,
	date: 123456789,
	type: MessageType.CONFIGURATION_MSG,
	operation: 'roomPictureUpdated',
	value: room.id,
	from: user2Be.id
};

const messages: TextMessage[] = [
	{
		id: '1111-409408-555555',
		roomId: 'Room-Id',
		date: 1665409408796,
		type: MessageType.TEXT_MSG,
		stanzaId: 'stanzaId-1111-409408-555555',
		from: 'c755b1d5-08dd-49d8-bec8-59074090ef1b',
		text: '11111',
		read: MarkerStatus.READ
	},
	{
		id: '2222-409408-222222',
		roomId: 'Room-Id',
		date: 1665409408796,
		type: MessageType.TEXT_MSG,
		stanzaId: 'stanzaId-2222-409408-222222',
		from: 'c755b1d5-08dd-49d8-bec8-59074090ef1b',
		text: '22222',
		read: MarkerStatus.READ
	},
	{
		id: '3333-409408-333333',
		roomId: 'Room-Id',
		date: 1665409408796,
		type: MessageType.TEXT_MSG,
		stanzaId: 'stanzaId-3333-409408-333333',
		from: 'c755b1d5-08dd-49d8-bec8-59074090ef1b',
		text: '33333',
		read: MarkerStatus.READ
	},
	{
		id: '4444-409408-444444',
		roomId: 'Room-Id',
		date: 1665409408796,
		type: MessageType.TEXT_MSG,
		stanzaId: 'stanzaId-4444-409408-444444',
		from: 'c755b1d5-08dd-49d8-bec8-59074090ef1b',
		text: '44444',
		read: MarkerStatus.READ
	}
];

describe('render list of messages with history loader visible for first time opening the conversation', () => {
	test('Render the list of messages', () => {
		const { result } = renderHook(() => useStore());
		act(() => result.current.addRoom(room));
		setup(<MessagesList roomId={room.id} />);
		const messageList = screen.getByTestId(`intersectionObserverRoot${room.id}`);
		expect(messageList).toBeVisible();
		act(() => result.current.setHistoryIsFullyLoaded(room.id));
		act(() => result.current.updateHistory(room.id, messages));
		expect(result.current.messages[room.id]).toHaveLength(6);
		expect(screen.getByText(new RegExp(`${room.name} created`, 'i'))).toBeInTheDocument();
		const message = screen.getByTestId(`Bubble-${messages[0].id}`);
		expect(message).toBeVisible();
		const message1 = screen.getByTestId(`Bubble-${messages[1].id}`);
		expect(message1).toBeVisible();
		const message2 = screen.getByTestId(`Bubble-${messages[2].id}`);
		expect(message2).toBeVisible();
		const message3 = screen.getByTestId(`Bubble-${messages[3].id}`);
		expect(message3).toBeVisible();
	});

	test('Render the history message loader', () => {
		const { result } = renderHook(() => useStore());
		act(() => result.current.addRoom(room));
		setup(<MessagesList roomId={room.id} />);
		const messageList = screen.getByTestId(`intersectionObserverRoot${room.id}`);
		expect(messageList).toBeVisible();
		const messageHistoryLoader = screen.getByTestId('messageHistoryLoader');
		triggerObserver(messageHistoryLoader);
		expect(messageHistoryLoader).toBeVisible();
	});

	test('Display new message bubble on MessageList', () => {
		const mockedRoom: RoomBe = createMockRoom({ id: 'roomTest' });
		const mockedTextMessage = createMockTextMessage({
			id: 'idSimpleTextMessage',
			roomId: mockedRoom.id
		});
		const store: RootStore = useStore.getState();
		store.addRoom(mockedRoom);
		store.newMessage(mockedTextMessage);
		setup(<MessagesList roomId={mockedRoom.id} />);
		const messageBubble = screen.getByTestId(`Bubble-${mockedTextMessage.id}`);
		expect(messageBubble).toBeInTheDocument();
	});

	test('Display text message bubble with URL on MessageList', () => {
		const mockedRoom: RoomBe = createMockRoom({ id: 'roomTest' });
		const mockedURLTextMessage = createMockTextMessage({
			id: 'idSimpleTextMessageWithUrl',
			roomId: 'roomTest',
			text: 'Hi! Look at this site: https://www.awesomeTest.com/test'
		});
		const store: RootStore = useStore.getState();
		store.addRoom(mockedRoom);
		store.newMessage(mockedURLTextMessage);
		setup(<MessagesList roomId={mockedRoom.id} />);
		const messageBubble = screen.getByTestId(`Bubble-${mockedURLTextMessage.id}`);
		expect(messageBubble).toBeInTheDocument();
		const anchorElement = screen.getByText('https://www.awesomeTest.com/test');
		expect(anchorElement.nodeName).toBe('A');
	});

	test('Display message bubble deleted on MessageList', () => {
		const mockedRoom: RoomBe = createMockRoom({ id: 'roomTest' });
		const mockedTextMessage = createMockTextMessage({
			id: 'idSimpleTextMessage',
			roomId: mockedRoom.id,
			text: 'Hello guys!'
		});
		const mockedDeletedMessage = createMockDeletedMessage({
			id: 'idSimpleTextMessage',
			roomId: mockedRoom.id
		});
		const { result } = renderHook(() => useStore());
		act(() => result.current.addRoom(mockedRoom));
		act(() => result.current.newMessage(mockedTextMessage));
		setup(<MessagesList roomId={mockedRoom.id} />);
		const messageBubble = screen.getByText('Hello guys!');
		expect(messageBubble).toBeInTheDocument();
		act(() => result.current.setDeletedMessage(mockedRoom.id, mockedDeletedMessage));
		const deletedMessage = screen.getByText(/Deleted message/i);
		expect(deletedMessage).toBeInTheDocument();
	});

	test('Display message bubble edited on MessageList', () => {
		const mockedRoom: RoomBe = createMockRoom({ id: 'roomTest' });
		const mockedTextMessage = createMockTextMessage({
			id: 'idSimpleTextMessage',
			roomId: mockedRoom.id,
			text: 'Hello guys!'
		});
		const mockedEditedTextMessage = createMockTextMessage({
			id: 'idSimpleTextMessage',
			roomId: mockedRoom.id,
			text: 'Hello guys! Sorry for the delay',
			edited: true
		});
		const { result } = renderHook(() => useStore());
		act(() => result.current.addRoom(mockedRoom));
		act(() => result.current.newMessage(mockedTextMessage));
		setup(<MessagesList roomId={mockedRoom.id} />);
		const messageBubble = screen.getByText('Hello guys!');
		expect(messageBubble).toBeInTheDocument();
		act(() =>
			result.current.setEditedMessage(mockedRoom.id, mockedEditedTextMessage as TextMessage)
		);
		const messageEditedBubble = screen.getByText('Hello guys! Sorry for the delay');
		expect(messageEditedBubble).toBeInTheDocument();
		const editedLabel = screen.getByText(/edited/i);
		expect(editedLabel).toBeInTheDocument();
	});

	test('Display reply message bubble on MessageList', () => {
		const mockedRoom: RoomBe = createMockRoom({ id: 'roomTest' });
		const mockedTextMessage = createMockTextMessage({
			id: 'idSimpleTextMessage',
			roomId: mockedRoom.id,
			text: 'Hello guys!'
		});
		const mockedReplyTextMessage = createMockTextMessage({
			id: 'idReplyTextMessage',
			roomId: mockedRoom.id,
			text: 'Hi David!',
			replyTo: 'idSimpleTextMessage',
			repliedMessage: mockedTextMessage
		});
		const { result } = renderHook(() => useStore());
		act(() => result.current.addRoom(mockedRoom));
		act(() => result.current.newMessage(mockedTextMessage));
		act(() => result.current.newMessage(mockedReplyTextMessage));
		setup(<MessagesList roomId={mockedRoom.id} />);
		const messageBubble = screen.getAllByText('Hello guys!');
		expect(messageBubble.length).toBe(2);
		const replyMessageBubble = screen.getByText('Hi David!');
		expect(replyMessageBubble).toBeInTheDocument();
		const replyView = screen.getByTestId(`repliedView-${mockedTextMessage.id}`);
		expect(replyView).toBeInTheDocument();
	});

	test('Display a reply of a deleted message', () => {
		const mockedRoom: RoomBe = createMockRoom({ id: 'roomTest' });
		const mockedTextMessage = createMockTextMessage({
			id: 'idSimpleTextMessage',
			roomId: mockedRoom.id,
			text: 'Hello guys!'
		});
		const mockedEditedTextMessage = createMockTextMessage({
			id: 'idSimpleTextMessage',
			roomId: mockedRoom.id,
			text: 'Hello guys! Sorry for the delay',
			edited: true
		});
		const mockedReplyTextMessage = createMockTextMessage({
			id: 'idReplyTextMessage',
			roomId: mockedRoom.id,
			text: 'Hi David!',
			replyTo: 'idSimpleTextMessage',
			repliedMessage: mockedEditedTextMessage
		});
		const { result } = renderHook(() => useStore());
		act(() => result.current.addRoom(mockedRoom));
		act(() => result.current.newMessage(mockedTextMessage));
		act(() =>
			result.current.setEditedMessage(mockedRoom.id, mockedEditedTextMessage as TextMessage)
		);
		act(() => result.current.newMessage(mockedReplyTextMessage));
		setup(<MessagesList roomId={mockedRoom.id} />);
		const messagesWithSameText = screen.getAllByText('Hello guys! Sorry for the delay');
		expect(messagesWithSameText.length).toBe(2);
		const editedLabel = screen.getAllByText(/edited/i);
		expect(editedLabel.length).toBe(2);
		const replyView = screen.getByTestId(`repliedView-${mockedTextMessage.id}`);
		expect(replyView).toBeInTheDocument();
		const replyMessageBubble = screen.getByText('Hi David!');
		expect(replyMessageBubble).toBeInTheDocument();
	});

	test('Display a reply of an edited message', () => {
		const mockedRoom: RoomBe = createMockRoom({ id: 'roomTest' });
		const mockedTextMessage = createMockTextMessage({
			id: 'idSimpleTextMessage',
			roomId: mockedRoom.id,
			text: 'Hello guys!'
		});
		const mockedDeletedMessage = createMockDeletedMessage({
			id: 'idSimpleTextMessage',
			roomId: mockedRoom.id
		});
		const mockedReplyMessage = createMockTextMessage({
			id: 'idReplyTextMessage',
			roomId: mockedRoom.id,
			text: 'Hi David!',
			replyTo: 'idSimpleTextMessage',
			repliedMessage: mockedTextMessage
		});
		const { result } = renderHook(() => useStore());
		act(() => result.current.addRoom(mockedRoom));
		act(() => result.current.newMessage(mockedTextMessage));
		act(() => result.current.newMessage(mockedReplyMessage));
		act(() => result.current.setDeletedMessage(mockedRoom.id, mockedDeletedMessage));
		setup(<MessagesList roomId={mockedRoom.id} />);
		const editedLabel = screen.getAllByText(/deleted/i);
		expect(editedLabel.length).toBe(2);
		const replyView = screen.getByTestId(`repliedView-${mockedTextMessage.id}`);
		expect(replyView).toBeInTheDocument();
		const replyMessageBubble = screen.getByText('Hi David!');
		expect(replyMessageBubble).toBeInTheDocument();
	});

	test('Configuration message is visible', async () => {
		const { result } = renderHook(() => useStore());
		act(() => {
			result.current.addRoom(room);
			result.current.setUserInfo(user2Be);
			result.current.setLoginInfo(user1Be.id, user1Be.name);
			result.current.setHistoryIsFullyLoaded(room.id);
			result.current.updateHistory(room.id, [mockedConfigurationMessage]);
		});
		setup(<MessagesList roomId={room.id} />);
		const messageList = screen.getByTestId(`messageListRef${room.id}`);
		expect(messageList.children).toHaveLength(3);
		const message = screen.getByTestId(`configuration_msg-${mockedConfigurationMessage.id}`);
		expect(message).toBeVisible();
		const label = await screen.findByText(
			new RegExp(`${user2Be.name} changed ${room.name}'s image`, 'i')
		);
		expect(label).toBeVisible();
	});
	test('Affiliation message is visible', async () => {
		const { result } = renderHook(() => useStore());
		act(() => {
			result.current.addRoom(room);
			result.current.setUserInfo(user4Be);
			result.current.setHistoryIsFullyLoaded(room.id);
			result.current.updateHistory(room.id, [mockedAffiliationMessage]);
		});
		setup(<MessagesList roomId={room.id} />);
		const messageList = screen.getByTestId(`messageListRef${room.id}`);
		expect(messageList.children).toHaveLength(3);
		const message = screen.getByTestId(`affiliation_msg-${mockedAffiliationMessage.id}`);
		expect(message).toBeVisible();
		const label = screen.getByText(
			new RegExp(`${user4Be.name} has been added to ${room.name}`, 'i')
		);
		expect(label).toBeVisible();
	});
});
