/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen } from '@testing-library/react';
import { act, renderHook } from '@testing-library/react-hooks';
import { size } from 'lodash';

import MessagesList from './MessagesList';
import useStore from '../../../store/Store';
import {
	createMockConfigurationMessage,
	createMockMessageFastening,
	createMockRoom,
	createMockTextMessage
} from '../../../tests/createMock';
import { mockedScrollToEnd, mockedScrollToMessage } from '../../../tests/mocks/scrollUtils';
import { setup } from '../../../tests/test-utils';
import { RoomBe, RoomType } from '../../../types/network/models/roomBeTypes';
import { MarkerStatus } from '../../../types/store/MarkersTypes';
import {
	ConfigurationMessage,
	MessageType,
	OperationType,
	TextMessage
} from '../../../types/store/MessageTypes';
import { RootStore } from '../../../types/store/StoreTypes';
import { User } from '../../../types/store/UserTypes';

const fromId = 'c755b1d5-08dd-49d8-bec8-59074090ef1b';
const helloString = 'Hello guys!';

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

const mockedAddMemberMessage = createMockConfigurationMessage({
	id: 'AddMemberId',
	roomId: room.id,
	date: 1234566789,
	operation: OperationType.MEMBER_ADDED,
	value: user4Be.id
});

const mockedRemoveMemberMessage = createMockConfigurationMessage({
	id: 'AddMemberId',
	roomId: room.id,
	date: 1234566789,
	operation: OperationType.MEMBER_REMOVED,
	value: user3Be.id
});

const mockedConfigurationMessage: ConfigurationMessage = {
	id: 'ConfigurationId',
	roomId: room.id,
	date: 123456789,
	type: MessageType.CONFIGURATION_MSG,
	operation: OperationType.ROOM_PICTURE_UPDATED,
	value: room.id,
	from: user2Be.id,
	read: MarkerStatus.READ
};

const messages: TextMessage[] = [
	{
		id: '1111-409408-555555',
		roomId: 'Room-Id',
		date: 1665409408796,
		type: MessageType.TEXT_MSG,
		stanzaId: 'stanzaId-1111-409408-555555',
		from: fromId,
		text: '11111',
		read: MarkerStatus.READ
	},
	{
		id: '2222-409408-222222',
		roomId: 'Room-Id',
		date: 1665409408796,
		type: MessageType.TEXT_MSG,
		stanzaId: 'stanzaId-2222-409408-222222',
		from: fromId,
		text: '22222',
		read: MarkerStatus.READ
	},
	{
		id: '3333-409408-333333',
		roomId: 'Room-Id',
		date: 1665409408796,
		type: MessageType.TEXT_MSG,
		stanzaId: 'stanzaId-3333-409408-333333',
		from: fromId,
		text: '33333',
		read: MarkerStatus.READ
	},
	{
		id: '4444-409408-444444',
		roomId: 'Room-Id',
		date: 1665409408796,
		type: MessageType.TEXT_MSG,
		stanzaId: 'stanzaId-4444-409408-444444',
		from: fromId,
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
		// Simulate the loading of the full history
		act(() => {
			result.current.setHistoryIsFullyLoaded(room.id);
			result.current.updateHistory(room.id, messages);
			result.current.addCreateRoomMessage(room.id);
		});
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
		const mockedRoom: RoomBe = createMockRoom();
		const mockedTextMessage = createMockTextMessage({
			roomId: mockedRoom.id,
			text: helloString
		});
		const mockedDeletedMessage = createMockMessageFastening({
			roomId: mockedRoom.id,
			action: 'delete',
			originalStanzaId: mockedTextMessage.stanzaId
		});

		const { result } = renderHook(() => useStore());
		act(() => result.current.addRoom(mockedRoom));
		act(() => result.current.newMessage(mockedTextMessage));
		// Delete text message
		act(() => result.current.addFastening(mockedDeletedMessage));

		setup(<MessagesList roomId={mockedRoom.id} />);

		const deletedMessage = screen.getByText(/Deleted message/i);
		expect(deletedMessage).toBeInTheDocument();
	});

	test('Display edited message bubble on MessageList', () => {
		const mockedRoom: RoomBe = createMockRoom();
		const mockedTextMessage = createMockTextMessage({
			roomId: mockedRoom.id,
			text: helloString
		});
		const mockedEditedMessage = createMockMessageFastening({
			roomId: mockedRoom.id,
			action: 'edit',
			originalStanzaId: mockedTextMessage.stanzaId,
			value: 'Hello guys! I am edited message'
		});

		const { result } = renderHook(() => useStore());
		act(() => result.current.addRoom(mockedRoom));
		act(() => result.current.newMessage(mockedTextMessage));
		// Edit text message
		act(() => result.current.addFastening(mockedEditedMessage));

		setup(<MessagesList roomId={mockedRoom.id} />);

		const deletedMessage = screen.getByText(/Hello guys! I am edited message/i);
		expect(deletedMessage).toBeInTheDocument();
	});

	test('Display reply message bubble on MessageList', () => {
		const mockedRoom: RoomBe = createMockRoom({ id: 'roomTest' });
		const mockedTextMessage = createMockTextMessage({
			id: 'idSimpleTextMessage',
			roomId: mockedRoom.id,
			text: helloString
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
		const messageBubble = screen.getAllByText(helloString);
		expect(messageBubble.length).toBe(2);
		const replyMessageBubble = screen.getByText('Hi David!');
		expect(replyMessageBubble).toBeInTheDocument();
		const replyView = screen.getByTestId(`repliedView-${mockedTextMessage.id}`);
		expect(replyView).toBeInTheDocument();
	});

	test('Display a reply of a deleted message', () => {
		const mockedRoom: RoomBe = createMockRoom();
		const mockedTextMessage = createMockTextMessage({
			roomId: mockedRoom.id,
			text: helloString
		});
		const mockedReplyTextMessage = createMockTextMessage({
			id: 'idReplyTextMessage',
			roomId: mockedRoom.id,
			text: 'Hi!',
			replyTo: mockedTextMessage.id
		});
		const mockedDeletedMessage = createMockMessageFastening({
			roomId: mockedRoom.id,
			action: 'delete',
			originalStanzaId: mockedTextMessage.stanzaId
		});

		const { result } = renderHook(() => useStore());
		act(() => result.current.addRoom(mockedRoom));
		act(() => result.current.newMessage(mockedTextMessage));
		// Reply to text message
		act(() => result.current.newMessage(mockedReplyTextMessage));
		// Delete first text message
		act(() => result.current.addFastening(mockedDeletedMessage));

		setup(<MessagesList roomId={mockedRoom.id} />);

		const deletedMessage = screen.getAllByText(/Deleted message/i);
		expect(size(deletedMessage)).toBe(2);
	});

	test('Display a reply of an edited message', () => {
		const mockedRoom: RoomBe = createMockRoom();
		const mockedTextMessage = createMockTextMessage({
			roomId: mockedRoom.id,
			text: helloString
		});
		const mockedEditedMessage = createMockMessageFastening({
			roomId: mockedRoom.id,
			action: 'edit',
			originalStanzaId: mockedTextMessage.stanzaId,
			value: 'Hello guys! I am edited message'
		});
		const mockedReplyTextMessage = createMockTextMessage({
			id: 'idReplyTextMessage',
			roomId: mockedRoom.id,
			text: 'Hi!',
			replyTo: mockedTextMessage.id
		});

		const { result } = renderHook(() => useStore());
		act(() => result.current.addRoom(mockedRoom));
		act(() => result.current.newMessage(mockedTextMessage));
		// Edit text message
		act(() => result.current.addFastening(mockedEditedMessage));
		// Reply to text message
		act(() => result.current.newMessage(mockedReplyTextMessage));

		setup(<MessagesList roomId={mockedRoom.id} />);

		const deletedMessage = screen.getAllByText(/Hello guys! I am edited message/i);
		expect(size(deletedMessage)).toBe(2);
	});

	test('Configuration message is visible', async () => {
		const { result } = renderHook(() => useStore());
		act(() => {
			result.current.addRoom(room);
			result.current.setUserInfo(user2Be);
			result.current.setLoginInfo(user1Be.id, user1Be.name);
			result.current.setHistoryIsFullyLoaded(room.id);
			result.current.updateHistory(room.id, [mockedConfigurationMessage]);
			result.current.addCreateRoomMessage(room.id);
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

	test('Add member message is visible', async () => {
		const { result } = renderHook(() => useStore());
		act(() => {
			result.current.addRoom(room);
			result.current.setUserInfo(user4Be);
			result.current.setHistoryIsFullyLoaded(room.id);
			result.current.updateHistory(room.id, [mockedAddMemberMessage]);
			result.current.addCreateRoomMessage(room.id);
		});
		setup(<MessagesList roomId={room.id} />);
		const messageList = screen.getByTestId(`messageListRef${room.id}`);
		expect(messageList.children).toHaveLength(3);
		const message = screen.getByTestId(`configuration_msg-${mockedAddMemberMessage.id}`);
		expect(message).toBeVisible();
		const label = screen.getByText(
			new RegExp(`${user4Be.name} has been added to ${room.name}`, 'i')
		);
		expect(label).toBeVisible();
	});

	test('Removed member message is visible', async () => {
		const { result } = renderHook(() => useStore());
		act(() => {
			result.current.addRoom(room);
			result.current.setUserInfo(user3Be);
			result.current.setHistoryIsFullyLoaded(room.id);
			result.current.updateHistory(room.id, [mockedRemoveMemberMessage]);
			result.current.addCreateRoomMessage(room.id);
		});
		setup(<MessagesList roomId={room.id} />);
		const messageList = screen.getByTestId(`messageListRef${room.id}`);
		expect(messageList.children).toHaveLength(3);
		const message = screen.getByTestId(`configuration_msg-${mockedRemoveMemberMessage.id}`);
		expect(message).toBeVisible();
		const label = screen.getByText(
			new RegExp(`${user3Be.name} is no longer a member of the group`, 'i')
		);
		expect(label).toBeVisible();
	});
});

describe('Scroll position', () => {
	test('Opening a conversation for the first time sets scroll to the bottom', () => {
		const store = useStore.getState();
		store.addRoom(room);
		setup(<MessagesList roomId={room.id} />);
		expect(mockedScrollToEnd).toBeCalled();
	});

	test('Opening an already opened conversation sets scroll to the previous position', () => {
		const store = useStore.getState();
		store.addRoom(room);
		store.updateHistory(room.id, messages);
		store.setIdMessageWhereScrollIsStopped(room.id, messages[0].id);
		setup(<MessagesList roomId={room.id} />);
		expect(mockedScrollToMessage).toBeCalled();
		expect(mockedScrollToMessage).toBeCalledWith(messages[0].id);
	});

	test('Opening an already opened conversation with unread messages sets scroll to the bottom', () => {
		const store = useStore.getState();
		store.addRoom(room);
		store.updateHistory(room.id, messages);
		store.setIdMessageWhereScrollIsStopped(room.id, messages[0].id);
		store.addUnreadCount(room.id, 1);
		setup(<MessagesList roomId={room.id} />);
		expect(mockedScrollToEnd).toBeCalled();
	});
});

describe('forward mode', () => {
	test('Select of one or more messages to forward', async () => {
		const { result } = renderHook(() => useStore());
		act(() => {
			result.current.addRoom(room);
			result.current.updateHistory(room.id, messages);
		});
		const { user } = setup(<MessagesList roomId={room.id} />);
		const messageList = screen.getByTestId(`intersectionObserverRoot${room.id}`);
		expect(messageList).toBeVisible();
		const arrowButton = await screen.findAllByTestId('icon: ArrowIosDownward');
		await user.click(arrowButton[0]);

		const forwardAction = await screen.findByText(/Forward/i);
		expect(forwardAction).toBeInTheDocument();
		await user.click(forwardAction);

		const forwardContainer = await screen.findAllByTestId('forward_bubble_container');
		expect(forwardContainer[0]).toHaveStyle('background: rgba(213, 227, 246, 0.50)');

		await user.hover(forwardContainer[1]);
		expect(forwardContainer[1]).toHaveStyle('background: rgba(230, 230, 230, 0.50)');

		await act(async () => {
			await user.click(forwardContainer[1]);
		});

		expect(forwardContainer[1]).toHaveStyle('background: rgba(213, 227, 246, 0.50)');
		expect(result.current.activeConversations[room.id].forwardMessageList).toHaveLength(2);
	});
});
