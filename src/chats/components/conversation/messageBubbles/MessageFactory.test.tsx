/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen } from '@testing-library/react';

import MessageFactory from './MessageFactory';
import useStore from '../../../../store/Store';
import {
	createMockConfigurationMessage,
	createMockDateMessage,
	createMockRoom,
	createMockTextMessage
} from '../../../../tests/createMock';
import { setup } from '../../../../tests/test-utils';

const room = createMockRoom();

beforeEach(() => {
	const store = useStore.getState();
	store.addRooms([room]);
});

describe('Message Factory', () => {
	test('Render TextMessage', () => {
		const message = createMockTextMessage({ roomId: room.id });
		const store = useStore.getState();
		store.newMessage(message);
		setup(
			<MessageFactory
				message={message}
				prevMessageIsFromSameSender={false}
				nextMessageIsFromSameSender={false}
				messageRef={React.createRef()}
				isFirstNewMessage={false}
				isPrevMessageDeleted
			/>
		);
		const bubble = screen.getByTestId(`Bubble-${message.id}`);
		expect(bubble).toBeVisible();
	});

	test('Render unread TextMessage', () => {
		const message = createMockTextMessage({ roomId: room.id });
		const store = useStore.getState();
		store.newMessage(message);
		setup(
			<MessageFactory
				message={message}
				prevMessageIsFromSameSender={false}
				nextMessageIsFromSameSender={false}
				messageRef={React.createRef()}
				isFirstNewMessage
				isPrevMessageDeleted
			/>
		);
		const bubble = screen.getByTestId(`Bubble-${message.id}`);
		expect(bubble).toBeVisible();
		const newMessages = screen.getByTestId(`new_msg`);
		expect(newMessages).toBeVisible();
	});

	test('Render DeletedMessage', () => {
		const message = createMockTextMessage({ roomId: room.id, deleted: true });
		const store = useStore.getState();
		store.newMessage(message);
		setup(
			<MessageFactory
				message={message}
				prevMessageIsFromSameSender={false}
				nextMessageIsFromSameSender={false}
				messageRef={React.createRef()}
				isFirstNewMessage={false}
				isPrevMessageDeleted
			/>
		);
		const bubble = screen.getByTestId(`BubbleDeleted-${message.id}`);
		expect(bubble).toBeVisible();
	});

	test('Render unread DeletedMessage', () => {
		const message = createMockTextMessage({ roomId: room.id, deleted: true });
		const store = useStore.getState();
		store.newMessage(message);
		setup(
			<MessageFactory
				message={message}
				prevMessageIsFromSameSender={false}
				nextMessageIsFromSameSender={false}
				messageRef={React.createRef()}
				isFirstNewMessage
				isPrevMessageDeleted
			/>
		);
		const bubble = screen.getByTestId(`BubbleDeleted-${message.id}`);
		expect(bubble).toBeVisible();
		const newMessages = screen.getByTestId(`new_msg`);
		expect(newMessages).toBeVisible();
	});

	test('Render ConfigurationMessage', () => {
		const message = createMockConfigurationMessage({ roomId: room.id });
		const store = useStore.getState();
		store.newMessage(message);
		setup(
			<MessageFactory
				message={message}
				prevMessageIsFromSameSender={false}
				nextMessageIsFromSameSender={false}
				messageRef={React.createRef()}
				isFirstNewMessage
				isPrevMessageDeleted
			/>
		);
		const bubble = screen.getByTestId(`configuration_msg-${message.id}`);
		expect(bubble).toBeVisible();
		const newMessages = screen.queryByTestId(`new_msg`);
		expect(newMessages).toBeInTheDocument();
	});

	test('Render DateMessage', () => {
		const message = createMockDateMessage({ roomId: room.id });
		setup(
			<MessageFactory
				message={message}
				prevMessageIsFromSameSender={false}
				nextMessageIsFromSameSender={false}
				messageRef={React.createRef()}
				isFirstNewMessage
				isPrevMessageDeleted
			/>
		);
		const bubble = screen.getByTestId(`date_msg-${message.id}`);
		expect(bubble).toBeVisible();
		const newMessages = screen.queryByTestId(`new_msg`);
		expect(newMessages).not.toBeInTheDocument();
	});
});
