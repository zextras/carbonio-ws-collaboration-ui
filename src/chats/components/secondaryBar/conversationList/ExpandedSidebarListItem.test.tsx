/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { act, screen } from '@testing-library/react';

import ExpandedSidebarListItem from './ExpandedSidebarListItem';
import { onComposingMessageStanza } from '../../../../network/xmpp/handlers/composingMessageHandler';
import { xmppClient } from '../../../../network/xmpp/XMPPClient';
import useStore from '../../../../store/Store';
import { buildComposingStanza } from '../../../../tests/buildXmppStanza';
import {
	createMockAttributesList,
	createMockConfigurationMessage,
	createMockMember,
	createMockRoom,
	createMockTextMessage,
	createMockUser
} from '../../../../tests/createMock';
import { setup } from '../../../../tests/test-utils';
import { RoomBe, RoomType } from '../../../../types/network/models/roomBeTypes';
import {
	MarkerStatus,
	ConfigurationMessage,
	MessageType,
	OperationType
} from '../../../../types/store/ChatsRegistryTypes';
import { RootStore } from '../../../../types/store/StoreTypes';
import { User } from '../../../../types/store/UserTypes';

const iconDoneAll = 'icon: DoneAll';

const iconEdit2 = 'icon: Edit2';

const user2Be: User = createMockUser({
	id: 'user2Id',
	email: 'user2@domain.com',
	name: 'User2'
});

const user1Be: User = createMockUser({
	id: 'user1Id',
	email: 'user1@domain.com',
	name: 'User1'
});

const user4Be: User = createMockUser({
	id: 'user4Id',
	email: 'user4@domain.com',
	name: 'User4'
});

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
	store.setLoginInfo({ id: user1Be.id, name: user1Be.name });
	store.setUserInfo([user1Be, user2Be, user4Be]);
	store.addRooms([mockedGroup, mockedOneToOne]);
	store.setAttributes(createMockAttributesList({ carbonioWscShowMessageReads: 'TRUE' }));
});

describe('Expanded sidebar list item', () => {
	describe('ACK status', () => {
		describe('carbonioWscShowMessageReads = true', () => {
			test('User sent a message', async () => {
				const store: RootStore = useStore.getState();
				store.setInboxMessages([mockedTextMessageUnread]);
				setup(<ExpandedSidebarListItem roomId={mockedGroup.id} />);
				expect(screen.getByTestId('icon: Checkmark')).toBeVisible();
				expect(screen.getByText(mockedTextMessageUnread.text)).toBeVisible();
			});

			test('User sent a message and someone read it', async () => {
				const store: RootStore = useStore.getState();
				store.setInboxMessages([mockedTextMessageReadBySomeone]);
				setup(<ExpandedSidebarListItem roomId={mockedGroup.id} />);
				expect(screen.getByTestId(iconDoneAll)).toBeVisible();
				expect(screen.getByText(mockedTextMessageReadBySomeone.text)).toBeVisible();
			});

			test('User sent a message and everyone read it', async () => {
				const store: RootStore = useStore.getState();
				store.setInboxMessages([mockedTextMessageRead]);
				setup(<ExpandedSidebarListItem roomId={mockedGroup.id} />);
				expect(screen.getByTestId(iconDoneAll)).toBeVisible();
				expect(screen.getByText(mockedTextMessageRead.text)).toBeVisible();
			});
		});

		describe('carbonioWscShowMessageReads = false', () => {
			test('User sent a message', async () => {
				const store: RootStore = useStore.getState();
				store.setAttributes(createMockAttributesList({ carbonioWscShowMessageReads: 'FALSE' }));
				store.setInboxMessages([mockedTextMessageUnread]);
				setup(<ExpandedSidebarListItem roomId={mockedGroup.id} />);
				expect(screen.queryByTestId('icon: Checkmark')).not.toBeInTheDocument();
				expect(screen.getByText(mockedTextMessageUnread.text)).toBeInTheDocument();
			});

			test('User sent a message and someone read it', async () => {
				const store: RootStore = useStore.getState();
				store.setAttributes(createMockAttributesList({ carbonioWscShowMessageReads: 'FALSE' }));
				store.setInboxMessages([mockedTextMessageReadBySomeone]);
				setup(<ExpandedSidebarListItem roomId={mockedGroup.id} />);
				expect(screen.queryByTestId(iconDoneAll)).not.toBeInTheDocument();
				expect(screen.getByText(mockedTextMessageReadBySomeone.text)).toBeVisible();
			});
		});
	});

	describe('Group List Item', () => {
		test('A user of a group sent a message', async () => {
			const store: RootStore = useStore.getState();
			store.setInboxMessages([mockedTextMessageSentBySomeoneElse]);
			setup(<ExpandedSidebarListItem roomId={mockedGroup.id} />);
			const message = `${user2Be.name}: ${mockedTextMessageSentBySomeoneElse.text}`;
			expect(screen.getByText(message)).toBeVisible();
		});

		test('Added a new member message', () => {
			const store: RootStore = useStore.getState();
			store.setInboxMessages([mockedAddMemberMessage]);
			setup(<ExpandedSidebarListItem roomId={mockedGroup.id} />);
			expect(
				screen.getByText(new RegExp(`${user4Be.name} has been added to ${mockedGroup.name}`, 'i'))
			).toBeVisible();
		});

		test('Deleted image message', () => {
			const store: RootStore = useStore.getState();
			store.setLoginInfo({ id: user2Be.id, name: user2Be.name });
			store.setInboxMessages([mockedConfigurationMessage]);
			setup(<ExpandedSidebarListItem roomId={mockedGroup.id} />);
			expect(
				screen.getByText(
					new RegExp(`${user1Be.name} restored the default ${mockedGroup.name}'s image`, 'i')
				)
			).toBeVisible();
		});
	});

	describe('One to One List Item', () => {
		test('Other user sent a message', async () => {
			const store: RootStore = useStore.getState();
			store.setInboxMessages([mockedTextMessageSentByOther]);
			setup(<ExpandedSidebarListItem roomId={mockedOneToOne.id} />);
			expect(screen.getByText(`${mockedTextMessageSentByOther.text}`)).toBeVisible();
		});

		test('when another user is typing, "is typing" message is rendered without an attachment icon', async () => {
			const store: RootStore = useStore.getState();
			store.setInboxMessages([mockedAttachmentMessage]);
			store.setIsWriting(mockedOneToOne.id, user2Be.id, true);
			setup(<ExpandedSidebarListItem roomId={mockedOneToOne.id} />);
			expect(screen.queryByTestId('icon: FileTextOutline')).not.toBeInTheDocument();
			expect(screen.queryByText(mockedAttachmentMessage.attachment!.name)).not.toBeInTheDocument();
			expect(screen.getByText(`${user2Be.name} is typing...`)).toBeVisible();
		});
	});

	describe('Icon and message', () => {
		test('draft message situation', async () => {
			const store: RootStore = useStore.getState();
			store.setInboxMessages([mockedTextMessageRead]);
			const draftMessage = 'hi everyone!';
			store.setDraftMessage(mockedGroup.id, draftMessage);
			setup(<ExpandedSidebarListItem roomId={mockedGroup.id} />);
			expect(screen.getByTestId(iconEdit2)).toBeVisible();
			expect(screen.getByText(draftMessage)).toBeVisible();
		});

		test('draft message and unread messages', async () => {
			const store: RootStore = useStore.getState();
			store.setDraftMessage(mockedGroup.id, 'Hi!');
			store.incrementUnreadCount(mockedGroup.id, 1);
			setup(<ExpandedSidebarListItem roomId={mockedGroup.id} />);
			expect(screen.queryByTestId(iconEdit2)).not.toBeInTheDocument();
		});

		test('should not render the attachment icon if there is a draft content and the last message is an attachment', async () => {
			const store: RootStore = useStore.getState();
			store.setInboxMessages([mockedAttachmentMessage]);
			store.setDraftMessage(mockedGroup.id, 'draft');
			setup(<ExpandedSidebarListItem roomId={mockedGroup.id} />);
			expect(screen.queryByTestId('icon: FileTextOutline')).not.toBeInTheDocument();
		});

		test('when another user is typing and there is a draft, "is typing" message is rendered without an draft icon', async () => {
			const store: RootStore = useStore.getState();
			store.setInboxMessages([mockedTextMessageRead]);
			const draftMessage = 'hi everyone!';
			store.setDraftMessage(mockedGroup.id, draftMessage);
			store.setIsWriting(mockedGroup.id, user2Be.id, true);
			setup(<ExpandedSidebarListItem roomId={mockedGroup.id} />);

			expect(screen.queryByTestId(iconEdit2)).not.toBeInTheDocument();
			expect(screen.queryByText(draftMessage)).not.toBeInTheDocument();
			expect(screen.getByText(`${user2Be.name} is typing...`)).toBeVisible();
		});

		test('when another user stops typing, after 7 seconds the last message sent is rendered', async () => {
			const store: RootStore = useStore.getState();
			store.setInboxMessages([mockedTextMessageSentByMeIntoGroup]);
			setup(<ExpandedSidebarListItem roomId={mockedGroup.id} />);
			act(() => {
				onComposingMessageStanza.call(
					xmppClient,
					buildComposingStanza({
						roomId: mockedGroup.id,
						from: user4Be.id,
						isWriting: true
					})
				);
			});
			expect(screen.getByText(`${user4Be.name} is typing...`)).toBeVisible();
			vi.advanceTimersByTime(3000);
			act(() => {
				onComposingMessageStanza.call(
					xmppClient,
					buildComposingStanza({
						roomId: mockedGroup.id,
						from: user4Be.id,
						isWriting: false
					})
				);
			});
			vi.advanceTimersByTime(7000);
			expect(screen.getByTestId(iconDoneAll)).toBeVisible();
			const messageContent = screen.getByText(
				new RegExp(`${mockedTextMessageSentByMeIntoGroup.text}`, 'i')
			);
			expect(messageContent).toBeVisible();
		});
	});
});
