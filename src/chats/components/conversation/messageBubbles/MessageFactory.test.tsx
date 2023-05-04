/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { screen } from '@testing-library/react';
import React from 'react';

import MessageFactory from './MessageFactory';
import useStore from '../../../../store/Store';
import {
	createMockAffiliationMessage,
	createMockConfigurationMessage,
	createMockDateMessage,
	createMockDeletedMessage,
	createMockRoom,
	createMockTextMessage
} from '../../../../tests/createMock';
import { setup } from '../../../../tests/test-utils';

describe('Message Factory', () => {
	test("Message isn't in the store", () => {
		const message = createMockTextMessage();
		setup(
			<MessageFactory
				messageId={message.id}
				messageRoomId={message.roomId}
				prevMessageIsFromSameSender={false}
				nextMessageIsFromSameSender={false}
				messageRef={React.createRef()}
				isFirstNewMessage={false}
			/>
		);
		const messageTypeNotHandled = screen.getByText('Message not handled');
		expect(messageTypeNotHandled).toBeVisible();
	});

	test('Render TextMessage', () => {
		const room = createMockRoom();
		const message = createMockTextMessage({ roomId: room.id });
		const store = useStore.getState();
		store.addRoom(room);
		store.newMessage(message);
		setup(
			<MessageFactory
				messageId={message.id}
				messageRoomId={room.id}
				prevMessageIsFromSameSender={false}
				nextMessageIsFromSameSender={false}
				messageRef={React.createRef()}
				isFirstNewMessage={false}
			/>
		);
		const bubble = screen.getByTestId(`Bubble-${message.id}`);
		expect(bubble).toBeVisible();
	});

	test('Render unread TextMessage', () => {
		const room = createMockRoom();
		const message = createMockTextMessage({ roomId: room.id });
		const store = useStore.getState();
		store.addRoom(room);
		store.newMessage(message);
		setup(
			<MessageFactory
				messageId={message.id}
				messageRoomId={room.id}
				prevMessageIsFromSameSender={false}
				nextMessageIsFromSameSender={false}
				messageRef={React.createRef()}
				isFirstNewMessage
			/>
		);
		const bubble = screen.getByTestId(`Bubble-${message.id}`);
		expect(bubble).toBeVisible();
		const newMessages = screen.getByTestId(`new_msg`);
		expect(newMessages).toBeVisible();
	});

	test('Render DeletedMessage', () => {
		const room = createMockRoom();
		const message = createMockDeletedMessage({ roomId: room.id });
		const store = useStore.getState();
		store.addRoom(room);
		store.newMessage(message);
		setup(
			<MessageFactory
				messageId={message.id}
				messageRoomId={room.id}
				prevMessageIsFromSameSender={false}
				nextMessageIsFromSameSender={false}
				messageRef={React.createRef()}
				isFirstNewMessage={false}
			/>
		);
		const bubble = screen.getByTestId(`BubbleDeleted-${message.id}`);
		expect(bubble).toBeVisible();
	});

	test('Render unread DeletedMessage', () => {
		const room = createMockRoom();
		const message = createMockDeletedMessage({ roomId: room.id });
		const store = useStore.getState();
		store.addRoom(room);
		store.newMessage(message);
		setup(
			<MessageFactory
				messageId={message.id}
				messageRoomId={room.id}
				prevMessageIsFromSameSender={false}
				nextMessageIsFromSameSender={false}
				messageRef={React.createRef()}
				isFirstNewMessage
			/>
		);
		const bubble = screen.getByTestId(`BubbleDeleted-${message.id}`);
		expect(bubble).toBeVisible();
		const newMessages = screen.getByTestId(`new_msg`);
		expect(newMessages).toBeVisible();
	});

	test('Render AffiliationMessage', () => {
		const room = createMockRoom();
		const message = createMockAffiliationMessage({ roomId: room.id });
		const store = useStore.getState();
		store.addRoom(room);
		store.newMessage(message);
		setup(
			<MessageFactory
				messageId={message.id}
				messageRoomId={room.id}
				prevMessageIsFromSameSender={false}
				nextMessageIsFromSameSender={false}
				messageRef={React.createRef()}
				isFirstNewMessage
			/>
		);
		const bubble = screen.getByTestId(`affiliation_msg-${message.id}`);
		expect(bubble).toBeVisible();
		const newMessages = screen.queryByTestId(`new_msg`);
		expect(newMessages).not.toBeInTheDocument();
	});

	test('Render ConfigurationMessage', () => {
		const room = createMockRoom();
		const message = createMockConfigurationMessage({ roomId: room.id });
		const store = useStore.getState();
		store.addRoom(room);
		store.newMessage(message);
		setup(
			<MessageFactory
				messageId={message.id}
				messageRoomId={room.id}
				prevMessageIsFromSameSender={false}
				nextMessageIsFromSameSender={false}
				messageRef={React.createRef()}
				isFirstNewMessage
			/>
		);
		const bubble = screen.getByTestId(`configuration_msg-${message.id}`);
		expect(bubble).toBeVisible();
		const newMessages = screen.queryByTestId(`new_msg`);
		expect(newMessages).not.toBeInTheDocument();
	});

	test('Render DateMessage', () => {
		const room = createMockRoom();
		const message = createMockDateMessage({ roomId: room.id });
		const store = useStore.getState();
		store.addRoom(room);
		store.newMessage(message);
		setup(
			<MessageFactory
				messageId={message.id}
				messageRoomId={room.id}
				prevMessageIsFromSameSender={false}
				nextMessageIsFromSameSender={false}
				messageRef={React.createRef()}
				isFirstNewMessage
			/>
		);
		const bubble = screen.getByTestId(`date_msg-${message.id}`);
		expect(bubble).toBeVisible();
		const newMessages = screen.queryByTestId(`new_msg`);
		expect(newMessages).not.toBeInTheDocument();
	});
});