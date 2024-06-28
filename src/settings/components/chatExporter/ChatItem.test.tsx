/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen } from '@testing-library/react';

import ChatItem from './ChatItem';
import useStore from '../../../store/Store';
import {
	createMockConfigurationMessage,
	createMockMember,
	createMockRoom,
	createMockTextMessage,
	createMockUser
} from '../../../tests/createMock';
import { setup } from '../../../tests/test-utils';
import { OperationType } from '../../../types/store/MessageTypes';
import { RoomType } from '../../../types/store/RoomTypes';

const loggedUser = createMockUser({ id: 'logged-user', name: 'Logged User' });
const otherUser = createMockUser({ id: 'other-user', name: 'Other User' });

const singleRoom = createMockRoom({
	type: RoomType.ONE_TO_ONE,
	id: 'one-to-one',
	members: [createMockMember({ userId: loggedUser.id }), createMockMember({ userId: otherUser.id })]
});

const groupRoom = createMockRoom({
	type: RoomType.GROUP,
	id: 'group',
	name: 'Group Room',
	members: [createMockMember({ userId: loggedUser.id }), createMockMember({ userId: otherUser.id })]
});

beforeEach(() => {
	const store = useStore.getState();
	store.setLoginInfo(loggedUser.id, loggedUser.name);
	store.setUserInfo(loggedUser);
	store.setUserInfo(otherUser);
	store.addRoom(singleRoom);
	store.addRoom(groupRoom);
});
describe('ChatItem test', () => {
	test('1-to-1 ChatItem displays user name', () => {
		setup(<ChatItem roomId={singleRoom.id} onClick={jest.fn()} />);
		const name = screen.getByText(otherUser.name);
		expect(name).toBeInTheDocument();
	});

	test('Group ChatItem displays group name', () => {
		setup(<ChatItem roomId={groupRoom.id} onClick={jest.fn()} />);
		const name = screen.getByText(groupRoom.name!);
		expect(name).toBeInTheDocument();
	});

	test('Chat last message displayed is a text message', () => {
		const message = createMockTextMessage({
			roomId: singleRoom.id,
			text: 'Last message',
			from: otherUser.id
		});
		useStore.getState().newMessage(message);
		setup(<ChatItem roomId={singleRoom.id} onClick={jest.fn()} />);
		const lastMessage = screen.getByText(`Other: ${message.text}`);
		expect(lastMessage).toBeInTheDocument();
	});

	test('Chat last message displayed is a deleted message', () => {
		const message = createMockTextMessage({
			roomId: singleRoom.id,
			text: 'Last message',
			from: otherUser.id,
			deleted: true
		});
		useStore.getState().newMessage(message);
		setup(<ChatItem roomId={singleRoom.id} onClick={jest.fn()} />);
		const lastMessage = screen.getByText('Deleted message');
		expect(lastMessage).toBeInTheDocument();
	});

	test('Chat last message displayed is a message with attachment', () => {
		const message = createMockTextMessage({
			roomId: singleRoom.id,
			text: '',
			attachment: { name: 'Attachment.txt' },
			from: otherUser.id
		});
		useStore.getState().newMessage(message);
		setup(<ChatItem roomId={singleRoom.id} onClick={jest.fn()} />);
		const lastMessage = screen.getByText(`Other: ${message.attachment!.name}`);
		expect(lastMessage).toBeInTheDocument();
	});

	test('Chat last message displayed is a configuration message', () => {
		const message = createMockConfigurationMessage({
			roomId: singleRoom.id,
			operation: OperationType.ROOM_NAME_CHANGED,
			value: 'newName',
			from: otherUser.id
		});
		useStore.getState().newMessage(message);
		setup(<ChatItem roomId={singleRoom.id} onClick={jest.fn()} />);
		const lastMessage = screen.getByText('Other User changed the title of this Group in .');
		expect(lastMessage).toBeInTheDocument();
	});

	test('If chat is exported, chat item displays export icon', () => {
		useStore.getState().setChatExporting(singleRoom.id);
		setup(<ChatItem roomId={singleRoom.id} onClick={jest.fn()} />);
		const spinner = screen.getByTestId('spinner');
		expect(spinner).toBeInTheDocument();
	});
});
