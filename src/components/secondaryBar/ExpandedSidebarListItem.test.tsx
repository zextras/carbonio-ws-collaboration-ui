/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { screen } from '@testing-library/react';
import React from 'react';
import { setup } from 'test-utils';

import useStore from '../../store/Store';
import { createMockMember, createMockRoom, createMockTextMessage } from '../../tests/createMock';
import { RoomBe, RoomType } from '../../types/network/models/roomBeTypes';
import { MarkerStatus } from '../../types/store/MarkersTypes';
import { RootStore } from '../../types/store/StoreTypes';
import { User } from '../../types/store/UserTypes';
import ExpandedSidebarListItem from './ExpandedSidebarListItem';

const user2Be: User = {
	id: 'user2Id',
	email: 'user2@domain.com',
	name: 'User2',
	lastSeen: 1234567890,
	statusMessage: "Hey there! I'm User 2"
};

const user1Be: User = {
	id: 'user1Id',
	email: 'user1@domain.com',
	name: 'User1',
	lastSeen: 1234567890,
	statusMessage: "Hey there! I'm User 1"
};

const mockedGroup: RoomBe = createMockRoom({
	type: RoomType.GROUP,
	members: [
		createMockMember({ userId: user1Be.id, owner: true }),
		createMockMember({ userId: user2Be.id }),
		createMockMember({ userId: 'user3Id', owner: true })
	]
});

const mockedOneToOne: RoomBe = createMockRoom({
	type: RoomType.ONE_TO_ONE,
	members: [createMockMember({ userId: user1Be.id }), createMockMember({ userId: user2Be.id })]
});

const mockedTextMessageSentByMe = createMockTextMessage({
	id: 'idSimpleTextMessage',
	roomId: mockedOneToOne.id,
	read: MarkerStatus.READ,
	from: user1Be.id
});

const mockedTextMessageSentByOther = createMockTextMessage({
	id: 'idSimpleTextMessage',
	roomId: mockedOneToOne.id,
	from: user2Be.id,
	text: 'How are you?'
});

const mockedTextMessageUnread = createMockTextMessage({
	id: 'idSimpleTextMessage',
	roomId: mockedGroup.id,
	from: user1Be.id,
	text: 'Hello guys! Does anyone know what happened to Luigi?'
});

const mockedTextMessageReadBySomeone = createMockTextMessage({
	id: 'idSimpleTextMessage',
	roomId: mockedGroup.id,
	read: MarkerStatus.READ_BY_SOMEONE,
	from: user1Be.id,
	text: 'This is a message'
});

const mockedTextMessageRead = createMockTextMessage({
	id: 'idSimpleTextMessage',
	roomId: mockedGroup.id,
	read: MarkerStatus.READ,
	from: user1Be.id,
	text: 'What a beautiful day'
});

const mockedTextMessageSentBySomeoneElse = createMockTextMessage({
	id: 'idSimpleTextMessage',
	roomId: mockedGroup.id,
	from: user2Be.id,
	text: 'I have a really bad headache!'
});

describe('Expanded sidebar list item', () => {
	test('Group - I sent a message', async () => {
		const store: RootStore = useStore.getState();
		store.addRoom(mockedGroup);
		store.setLoginInfo(user1Be.id, user1Be.name);
		store.setUserInfo(user1Be);
		store.newMessage(mockedTextMessageUnread);
		setup(<ExpandedSidebarListItem roomId={mockedGroup.id} />);
		const ackIcon = screen.getByTestId('icon: Checkmark');
		const message = screen.getByText(mockedTextMessageUnread.text);
		expect(ackIcon).toBeInTheDocument();
		expect(message).toBeInTheDocument();
	});
	test('Group - I sent a message and someone read it', async () => {
		const store: RootStore = useStore.getState();
		store.addRoom(mockedGroup);
		store.setLoginInfo(user1Be.id, user1Be.name);
		store.setUserInfo(user1Be);
		store.newMessage(mockedTextMessageReadBySomeone);
		setup(<ExpandedSidebarListItem roomId={mockedGroup.id} />);
		const ackIcon = screen.getByTestId('icon: DoneAll');
		const message = screen.getByText(mockedTextMessageReadBySomeone.text);
		expect(ackIcon).toBeInTheDocument();
		expect(message).toBeInTheDocument();
	});
	test('Group - I sent a message and everyone read it', async () => {
		const store: RootStore = useStore.getState();
		store.addRoom(mockedGroup);
		store.setLoginInfo(user1Be.id, user1Be.name);
		store.setUserInfo(user1Be);
		store.newMessage(mockedTextMessageRead);
		setup(<ExpandedSidebarListItem roomId={mockedGroup.id} />);
		const ackIcon = screen.getByTestId('icon: DoneAll');
		const message = screen.getByText(mockedTextMessageRead.text);
		expect(ackIcon).toBeInTheDocument();
		expect(message).toBeInTheDocument();
	});
	test('Group - user2 sent a message', async () => {
		const store: RootStore = useStore.getState();
		store.addRoom(mockedGroup);
		store.setLoginInfo(user1Be.id, user1Be.name);
		store.setUserInfo(user2Be);
		store.newMessage(mockedTextMessageSentBySomeoneElse);
		setup(<ExpandedSidebarListItem roomId={mockedGroup.id} />);
		const message = `${user2Be.name}: ${mockedTextMessageSentBySomeoneElse.text}`;
		const messageDisplayed = screen.getByText(message);
		expect(messageDisplayed).toBeInTheDocument();
	});
	test('Group - Check if there is the draft message', async () => {
		const store: RootStore = useStore.getState();
		store.addRoom(mockedGroup);
		store.setLoginInfo(user1Be.id, user1Be.name);
		store.setUserInfo(user2Be);
		store.newMessage(mockedTextMessageRead);
		store.setDraftMessage(mockedGroup.id, false, 'hi everyone!');
		setup(<ExpandedSidebarListItem roomId={mockedGroup.id} />);
		const IconWithDraft = screen.getByTestId('icon: Edit2');
		expect(IconWithDraft).toBeVisible();
		const lastMessageOfConversation = screen.getByText(mockedTextMessageRead.text);
		expect(lastMessageOfConversation).toBeVisible();
	});
	test('One to one - I sent a message', async () => {
		const store: RootStore = useStore.getState();
		store.addRoom(mockedOneToOne);
		store.setLoginInfo(user1Be.id, user1Be.name);
		store.setUserInfo(user1Be);
		store.newMessage(mockedTextMessageSentByMe);
		setup(<ExpandedSidebarListItem roomId={mockedOneToOne.id} />);
		const messageDisplayed = screen.getByText(`${mockedTextMessageSentByMe.text}`);
		expect(messageDisplayed).toBeInTheDocument();
	});
	test('One to one - user2 sent a message', async () => {
		const store: RootStore = useStore.getState();
		store.addRoom(mockedOneToOne);
		store.setLoginInfo(user1Be.id, user1Be.name);
		store.setUserInfo(user2Be);
		store.newMessage(mockedTextMessageSentByOther);
		setup(<ExpandedSidebarListItem roomId={mockedOneToOne.id} />);
		const messageDisplayed = screen.getByText(`${mockedTextMessageSentByOther.text}`);
		expect(messageDisplayed).toBeInTheDocument();
	});
	test('One to one - Check if there is the draft message', async () => {
		const store: RootStore = useStore.getState();
		store.addRoom(mockedOneToOne);
		store.setLoginInfo(user1Be.id, user1Be.name);
		store.setUserInfo(user2Be);
		store.newMessage(mockedTextMessageSentByOther);
		store.setDraftMessage(mockedOneToOne.id, false, 'hi everyone!');
		setup(<ExpandedSidebarListItem roomId={mockedGroup.id} />);
		const IconWithDraft = screen.getByTestId('icon: Edit2');
		expect(IconWithDraft).toBeVisible();
		const lastMessageOfConversation = screen.getByText(mockedTextMessageSentByOther.text);
		expect(lastMessageOfConversation).toBeVisible();
	});
});