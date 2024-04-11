/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { act, screen } from '@testing-library/react';

import ExpandedSidebarListItem from './ExpandedSidebarListItem';
import { onComposingMessageStanza } from '../../../network/xmpp/handlers/composingMessageHandler';
import useStore from '../../../store/Store';
import {
	createMockCapabilityList,
	createMockConfigurationMessage,
	createMockMember,
	createMockRoom,
	createMockTextMessage
} from '../../../tests/createMock';
import { xmppClient } from '../../../tests/mockedXmppClient';
import { composingStanza, pausedStanza } from '../../../tests/mocks/XMPPStanza';
import { setup } from '../../../tests/test-utils';
import { RoomBe, RoomType } from '../../../types/network/models/roomBeTypes';
import { MarkerStatus } from '../../../types/store/MarkersTypes';
import {
	ConfigurationMessage,
	MessageType,
	OperationType
} from '../../../types/store/MessageTypes';
import { RootStore } from '../../../types/store/StoreTypes';
import { User } from '../../../types/store/UserTypes';

const iconDoneAll = 'icon: DoneAll';

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

const user4Be: User = {
	id: 'user4Id',
	email: 'user4@domain.com',
	name: 'User4',
	lastSeen: 1234567890,
	statusMessage: "Hey there! I'm User 4"
};

const mockedGroup: RoomBe = createMockRoom({
	id: 'groupId',
	type: RoomType.GROUP,
	members: [
		createMockMember({ userId: user1Be.id, owner: true }),
		createMockMember({ userId: user2Be.id }),
		createMockMember({ userId: 'user3Id', owner: true })
	]
});

const mockedOneToOne: RoomBe = createMockRoom({
	id: 'oneToOneId',
	type: RoomType.ONE_TO_ONE,
	members: [createMockMember({ userId: user1Be.id }), createMockMember({ userId: user2Be.id })]
});

const mockedTextMessageSentByMeIntoOneToOne = createMockTextMessage({
	id: 'idSimpleTextMessage',
	roomId: mockedOneToOne.id,
	read: MarkerStatus.READ,
	from: user1Be.id
});

const mockedTextMessageSentByMeIntoGroup = createMockTextMessage({
	id: 'idSimpleTextMessage',
	roomId: mockedGroup.id,
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

const mockedAddMemberMessage: ConfigurationMessage = createMockConfigurationMessage({
	id: 'AddMemberId',
	roomId: mockedGroup.id,
	date: 1234566789,
	type: MessageType.CONFIGURATION_MSG,
	operation: OperationType.MEMBER_ADDED,
	value: user4Be.id
});

const mockedConfigurationMessage: ConfigurationMessage = {
	id: 'ConfigurationId',
	roomId: mockedGroup.id,
	date: 123456789,
	type: MessageType.CONFIGURATION_MSG,
	operation: OperationType.ROOM_PICTURE_DELETED,
	value: '',
	from: user1Be.id,
	read: MarkerStatus.READ
};

const mockedAttachmentMessage = createMockTextMessage({
	roomId: mockedGroup.id,
	from: user1Be.id,
	attachment: {
		id: 'pngAttachmentId',
		name: 'image.png',
		mimeType: 'image/png',
		size: 21412,
		area: '350x240'
	},
	read: MarkerStatus.READ
});

beforeEach(() => {
	const store: RootStore = useStore.getState();
	store.setLoginInfo(user1Be.id, user1Be.name);
	store.setUserInfo(user1Be);
	store.setUserInfo(user2Be);
	store.setUserInfo(user4Be);
	store.addRoom(mockedGroup);
	store.addRoom(mockedOneToOne);
	store.setCapabilities(createMockCapabilityList({ canSeeMessageReads: true }));
});
describe('Expanded sidebar list item', () => {
	describe('Group List Item', () => {
		test('User cannot see message reads - I sent a message but it is in pending state', async () => {
			const store: RootStore = useStore.getState();
			store.setCapabilities(createMockCapabilityList({ canSeeMessageReads: false }));
			store.setPlaceholderMessage({
				roomId: mockedTextMessageUnread.roomId,
				id: mockedTextMessageUnread.id,
				text: mockedTextMessageUnread.text
			});
			setup(<ExpandedSidebarListItem roomId={mockedGroup.id} />);
			const ackIcon = screen.getByTestId('icon: ClockOutline');
			const message = screen.getByText(mockedTextMessageUnread.text);
			expect(ackIcon).toBeInTheDocument();
			expect(message).toBeInTheDocument();
		});

		test('User cannot see message reads - I sent a message', async () => {
			const store: RootStore = useStore.getState();
			store.setCapabilities(createMockCapabilityList({ canSeeMessageReads: false }));
			store.newMessage(mockedTextMessageUnread);
			setup(<ExpandedSidebarListItem roomId={mockedGroup.id} />);
			expect(screen.queryByTestId('icon: Checkmark')).not.toBeInTheDocument();
			const message = screen.getByText(mockedTextMessageUnread.text);
			expect(message).toBeInTheDocument();
		});

		test('User cannot see message reads - I sent a message and someone read it', async () => {
			const store: RootStore = useStore.getState();
			store.setCapabilities(createMockCapabilityList({ canSeeMessageReads: false }));
			store.newMessage(mockedTextMessageReadBySomeone);
			setup(<ExpandedSidebarListItem roomId={mockedGroup.id} />);
			expect(screen.queryByTestId(iconDoneAll)).not.toBeInTheDocument();
			const message = screen.getByText(mockedTextMessageReadBySomeone.text);
			expect(message).toBeInTheDocument();
		});

		test('I sent a message but it is in pending state', async () => {
			const store: RootStore = useStore.getState();
			store.addRoom(mockedGroup);
			store.setPlaceholderMessage({
				roomId: mockedTextMessageUnread.roomId,
				id: mockedTextMessageUnread.id,
				text: mockedTextMessageUnread.text
			});
			setup(<ExpandedSidebarListItem roomId={mockedGroup.id} />);
			const ackIcon = screen.getByTestId('icon: ClockOutline');
			const message = screen.getByText(mockedTextMessageUnread.text);
			expect(ackIcon).toBeInTheDocument();
			expect(message).toBeInTheDocument();
		});

		test('I sent a message', async () => {
			const store: RootStore = useStore.getState();
			store.newMessage(mockedTextMessageUnread);
			setup(<ExpandedSidebarListItem roomId={mockedGroup.id} />);
			const ackIcon = screen.getByTestId('icon: Checkmark');
			const message = screen.getByText(mockedTextMessageUnread.text);
			expect(ackIcon).toBeInTheDocument();
			expect(message).toBeInTheDocument();
		});

		test('I sent a message and someone read it', async () => {
			const store: RootStore = useStore.getState();
			store.newMessage(mockedTextMessageReadBySomeone);
			setup(<ExpandedSidebarListItem roomId={mockedGroup.id} />);
			const ackIcon = screen.getByTestId(iconDoneAll);
			const message = screen.getByText(mockedTextMessageReadBySomeone.text);
			expect(ackIcon).toBeInTheDocument();
			expect(message).toBeInTheDocument();
		});

		test('I sent a message and everyone read it', async () => {
			const store: RootStore = useStore.getState();
			store.newMessage(mockedTextMessageRead);
			setup(<ExpandedSidebarListItem roomId={mockedGroup.id} />);
			const ackIcon = screen.getByTestId(iconDoneAll);
			const message = screen.getByText(mockedTextMessageRead.text);
			expect(ackIcon).toBeInTheDocument();
			expect(message).toBeInTheDocument();
		});

		test('user2 sent a message', async () => {
			const store: RootStore = useStore.getState();
			store.newMessage(mockedTextMessageSentBySomeoneElse);
			setup(<ExpandedSidebarListItem roomId={mockedGroup.id} />);
			const message = `${user2Be.name}: ${mockedTextMessageSentBySomeoneElse.text}`;
			const messageDisplayed = screen.getByText(message);
			expect(messageDisplayed).toBeInTheDocument();
		});

		test('Check if there is the draft message', async () => {
			const store: RootStore = useStore.getState();
			store.newMessage(mockedTextMessageRead);
			store.setDraftMessage(mockedGroup.id, false, 'hi everyone!');
			setup(<ExpandedSidebarListItem roomId={mockedGroup.id} />);
			const IconWithDraft = screen.getByTestId('icon: Edit2');
			expect(IconWithDraft).toBeVisible();
			const lastMessageOfConversation = screen.getByText(mockedTextMessageRead.text);
			expect(lastMessageOfConversation).toBeVisible();
		});

		test('Added a new member message', () => {
			const store: RootStore = useStore.getState();
			store.newMessage(mockedAddMemberMessage);
			setup(<ExpandedSidebarListItem roomId={mockedGroup.id} />);
			expect(
				screen.getByText(new RegExp(`${user4Be.name} has been added to ${mockedGroup.name}`, 'i'))
			).toBeVisible();
		});

		test('Deleted image message', () => {
			const store: RootStore = useStore.getState();
			store.setLoginInfo(user2Be.id, user2Be.name);
			store.newMessage(mockedConfigurationMessage);
			setup(<ExpandedSidebarListItem roomId={mockedGroup.id} />);
			expect(
				screen.getByText(
					new RegExp(`${user1Be.name} restored the default ${mockedGroup.name}'s image`, 'i')
				)
			).toBeVisible();
		});

		test('While user is typing nothing else is display if last message is an attachment', async () => {
			const store: RootStore = useStore.getState();
			store.newMessage(mockedAttachmentMessage);
			store.setIsWriting(mockedGroup.id, user2Be.id, true);
			setup(<ExpandedSidebarListItem roomId={mockedGroup.id} />);
			const imageIcon = screen.queryByTestId('icon: FileTextOutline');
			expect(imageIcon).not.toBeInTheDocument();
		});

		test('Last message sent by me, read by all and someone is typing -> after typing everything is display correct', async () => {
			const store: RootStore = useStore.getState();
			store.newMessage(mockedTextMessageSentByMeIntoGroup);
			setup(<ExpandedSidebarListItem roomId={mockedGroup.id} />);
			act(() => {
				const composingMessage = composingStanza(mockedGroup.id, user4Be.id);
				onComposingMessageStanza.call(xmppClient, composingMessage);
			});
			expect(screen.getByText(`${user4Be.name} is typing...`));
			jest.advanceTimersByTime(3000);
			act(() => {
				const stopWritingMessage = pausedStanza(mockedGroup.id, user4Be.id);
				onComposingMessageStanza.call(xmppClient, stopWritingMessage);
			});
			jest.advanceTimersByTime(7000);
			const ackIcon = screen.getByTestId(iconDoneAll);
			expect(ackIcon).toBeInTheDocument();
			const messageContent = screen.getByText(
				new RegExp(`${mockedTextMessageSentByMeIntoGroup.text}`, 'i')
			);
			expect(messageContent).toBeInTheDocument();
		});
	});

	describe('One to One List Item', () => {
		test('I sent a message', async () => {
			const store: RootStore = useStore.getState();
			store.newMessage(mockedTextMessageSentByMeIntoOneToOne);
			setup(<ExpandedSidebarListItem roomId={mockedOneToOne.id} />);
			const messageDisplayed = screen.getByText(`${mockedTextMessageSentByMeIntoOneToOne.text}`);
			const ackIcon = screen.getByTestId(iconDoneAll);
			expect(ackIcon).toBeInTheDocument();
			expect(messageDisplayed).toBeInTheDocument();
		});

		test('User cannot see message reads - I sent a message', async () => {
			const store: RootStore = useStore.getState();
			store.setCapabilities(createMockCapabilityList({ canSeeMessageReads: false }));
			store.newMessage(mockedTextMessageSentByMeIntoOneToOne);
			setup(<ExpandedSidebarListItem roomId={mockedOneToOne.id} />);
			const messageDisplayed = screen.getByText(`${mockedTextMessageSentByMeIntoOneToOne.text}`);
			expect(messageDisplayed).toBeInTheDocument();
			expect(screen.queryByTestId(iconDoneAll)).not.toBeInTheDocument();
		});

		test('User2 sent a message', async () => {
			const store: RootStore = useStore.getState();
			store.newMessage(mockedTextMessageSentByOther);
			setup(<ExpandedSidebarListItem roomId={mockedOneToOne.id} />);
			const messageDisplayed = screen.getByText(`${mockedTextMessageSentByOther.text}`);
			expect(messageDisplayed).toBeInTheDocument();
		});

		test('Check if there is the draft message', async () => {
			const store: RootStore = useStore.getState();
			store.newMessage(mockedTextMessageSentByOther);
			store.setDraftMessage(mockedOneToOne.id, false, 'hi everyone!');
			setup(<ExpandedSidebarListItem roomId={mockedOneToOne.id} />);
			const IconWithDraft = screen.getByTestId('icon: Edit2');
			expect(IconWithDraft).toBeVisible();
			const lastMessageOfConversation = screen.getByText(mockedTextMessageSentByOther.text);
			expect(lastMessageOfConversation).toBeVisible();
		});

		test('While user is typing nothing else is display if last message is an attachment', async () => {
			const store: RootStore = useStore.getState();
			store.newMessage(mockedAttachmentMessage);
			store.setIsWriting(mockedOneToOne.id, user2Be.id, true);
			setup(<ExpandedSidebarListItem roomId={mockedOneToOne.id} />);
			const imageIcon = screen.queryByTestId('icon: FileTextOutline');
			expect(imageIcon).not.toBeInTheDocument();
		});

		test('Last message sent by me, read by all and someone is typing -> after typing everything is display correct', async () => {
			const store: RootStore = useStore.getState();
			store.newMessage(mockedTextMessageSentByMeIntoOneToOne);
			setup(<ExpandedSidebarListItem roomId={mockedOneToOne.id} />);
			act(() => {
				const composingMessage = composingStanza(mockedOneToOne.id, user2Be.id);
				onComposingMessageStanza.call(xmppClient, composingMessage);
			});
			expect(screen.getByText(`${user2Be.name} is typing...`));
			jest.advanceTimersByTime(3000);
			act(() => {
				const stopWritingMessage = pausedStanza(mockedOneToOne.id, user2Be.id);
				onComposingMessageStanza.call(xmppClient, stopWritingMessage);
			});
			jest.advanceTimersByTime(7000);
			const ackIcon = screen.getByTestId(iconDoneAll);
			expect(ackIcon).toBeInTheDocument();
			const messageContent = screen.getByText(
				new RegExp(`${mockedTextMessageSentByMeIntoOneToOne.text}`, 'i')
			);
			expect(messageContent).toBeInTheDocument();
		});
	});
});
