/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen } from '@testing-library/react';

import Bubble from './Bubble';
import useStore from '../../../../store/Store';
import {
	createMockCapabilityList,
	createMockMember,
	createMockRoom,
	createMockTextMessage,
	createMockUser
} from '../../../../tests/createMock';
import { mockedSendChatMessageDeletion } from '../../../../tests/mockedXmppClient';
import { mockAttachmentTagElement } from '../../../../tests/mocks/global';
import {
	mockedDeleteAttachment,
	mockedGetImageThumbnailURL
} from '../../../../tests/mocks/network';
import { setup } from '../../../../tests/test-utils';
import { RoomBe } from '../../../../types/network/models/roomBeTypes';
import { MarkerStatus } from '../../../../types/store/MarkersTypes';
import { TextMessage } from '../../../../types/store/MessageTypes';
import { RoomType } from '../../../../types/store/RoomTypes';
import { RootStore } from '../../../../types/store/StoreTypes';
import { User, UserType } from '../../../../types/store/UserTypes';

const previewUrl = 'preview-url';
const iconDoneAll = 'icon: DoneAll';
const iconArrowIosDownward = 'icon: ArrowIosDownward';

const user1Be: User = createMockUser({
	id: 'user1',
	email: 'user1@domain.com',
	name: 'User1',
	lastSeen: 1234567890,
	statusMessage: "Hey there! I'm User 1"
});

const user2Be: User = createMockUser({
	id: 'user2',
	email: 'user2@domain.com',
	name: 'User2',
	lastSeen: 1234567890,
	statusMessage: "Hey there! I'm User 2"
});

const mockMember1 = createMockMember({ userId: user1Be.id, owner: true });
const mockMember2 = createMockMember({ userId: user2Be.id });

const guestUser: User = createMockUser({ type: UserType.GUEST });

const mockedTempRoom: RoomBe = createMockRoom({ type: RoomType.TEMPORARY, members: [mockMember1] });

const mockedMsgFromGuest = createMockTextMessage({ roomId: mockedTempRoom.id, from: guestUser.id });

const mockedRoom: RoomBe = createMockRoom({
	id: 'roomId',
	type: RoomType.GROUP,
	members: [mockMember1, mockMember2]
});

const mockedRepliedTextMessage = createMockTextMessage({
	roomId: mockedRoom.id,
	replyTo: 'insideId',
	repliedMessage: createMockTextMessage({
		id: 'insideId',
		text: 'Hi!'
	})
});

const mockedAttachmentMessageB = createMockTextMessage({
	roomId: mockedRoom.id,
	from: user1Be.id,
	attachment: {
		id: 'pngAttachmentId',
		name: 'image.png',
		mimeType: 'image/png',
		size: 21,
		area: '34x23'
	}
});

const mockedAttachmentMessageKb = createMockTextMessage({
	roomId: mockedRoom.id,
	from: user1Be.id,
	attachment: {
		id: 'pngAttachmentId',
		name: 'image.png',
		mimeType: 'image/png',
		size: 21412,
		area: '350x240'
	}
});

const mockedAttachmentMessageMb = createMockTextMessage({
	roomId: mockedRoom.id,
	from: user1Be.id,
	attachment: {
		id: 'pngAttachmentId',
		name: 'image.png',
		mimeType: 'image/png',
		size: 3349586,
		area: '34x23'
	}
});

const mockedAttachmentMessageGb = createMockTextMessage({
	roomId: mockedRoom.id,
	from: user1Be.id,
	attachment: {
		id: 'pngAttachmentId',
		name: 'image.jpeg',
		mimeType: 'image/png',
		size: 5697830293,
		area: '34x23'
	}
});

const mockedRepliedTextMessageWithAttachment = createMockTextMessage({
	roomId: mockedRoom.id,
	replyTo: 'insideId',
	repliedMessage: createMockTextMessage({
		id: 'insideId',
		text: 'Hi!',
		attachment: {
			id: 'pngAttachmentId',
			name: 'image.png',
			mimeType: 'image/png',
			size: 21412,
			area: '34x23'
		}
	})
});

const mockedTextMessageSentByMe = createMockTextMessage({
	id: 'idSimpleTextMessage',
	roomId: mockedRoom.id,
	read: MarkerStatus.READ,
	from: user1Be.id
});

const mockedTextMessageUnread = createMockTextMessage({
	id: 'idSimpleTextMessage',
	roomId: mockedRoom.id,
	from: user1Be.id,
	text: 'Hello guys! Does anyone know what happened to Luigi?'
});

const mockedTextMessageReadBySomeone = createMockTextMessage({
	id: 'idSimpleTextMessage',
	roomId: mockedRoom.id,
	read: MarkerStatus.READ_BY_SOMEONE,
	from: user1Be.id,
	text: 'This is a message'
});

const mockedTextMessagePending = createMockTextMessage({
	id: 'idSimpleTextMessage',
	roomId: mockedRoom.id,
	read: MarkerStatus.PENDING,
	from: user1Be.id,
	text: 'This is a message'
});

describe('Message bubble component visualization', () => {
	test('Display replied text message', () => {
		const store: RootStore = useStore.getState();
		store.addRoom(mockedRoom);
		setup(
			<Bubble
				message={mockedRepliedTextMessage}
				prevMessageIsFromSameSender={false}
				nextMessageIsFromSameSender={false}
				messageRef={React.createRef<HTMLDivElement>()}
			/>
		);
		const insideText = screen.getByText(
			new RegExp(`${mockedRepliedTextMessage.repliedMessage?.text}`, 'i')
		);
		expect(insideText).toBeVisible();
	});
	test('Display image', () => {
		const store: RootStore = useStore.getState();
		store.addRoom(mockedRoom);
		store.newMessage(mockedAttachmentMessageKb);
		mockedGetImageThumbnailURL.mockReturnValue(previewUrl);
		setup(
			<Bubble
				message={mockedAttachmentMessageKb}
				prevMessageIsFromSameSender={false}
				nextMessageIsFromSameSender={false}
				messageRef={React.createRef<HTMLDivElement>()}
			/>
		);
		expect(screen.getByTestId('attachmentImg')).toBeInTheDocument();
	});
	test('Hover on image reply', async () => {
		const store: RootStore = useStore.getState();
		store.addRoom(mockedRoom);
		mockedGetImageThumbnailURL.mockReturnValue(previewUrl);
		const { user } = setup(
			<Bubble
				message={mockedRepliedTextMessageWithAttachment}
				prevMessageIsFromSameSender={false}
				nextMessageIsFromSameSender={false}
				messageRef={React.createRef<HTMLDivElement>()}
			/>
		);
		await user.hover(screen.getByTestId('hover-container'));
		expect(screen.getByTestId('icon: EyeOutline')).toBeInTheDocument();
	});
});

const sizeFormatMessages: Array<[string, TextMessage, string]> = [
	['B', mockedAttachmentMessageB, 'PNG • 21B'],
	['Kb', mockedAttachmentMessageKb, 'PNG • 20.91KB'],
	['Mb', mockedAttachmentMessageMb, 'PNG • 3.19MB'],
	['Gb', mockedAttachmentMessageGb, 'PNG • 5.31GB']
];

const readsMessages: Array<[string, TextMessage, boolean, string]> = [
	['Reads - user can see reads', mockedTextMessageSentByMe, true, iconDoneAll],
	['someone reads - user can see reads', mockedTextMessageReadBySomeone, true, iconDoneAll],
	['unread - user can see reads', mockedTextMessageUnread, true, 'icon: Checkmark'],
	['someone reads - user can see reads', mockedTextMessageReadBySomeone, true, iconDoneAll],
	['pending status - user can see reads', mockedTextMessagePending, true, 'icon: ClockOutline'],
	['pending status - user cannot see reads', mockedTextMessagePending, false, 'icon: ClockOutline']
];

describe('Attachment footer', () => {
	test.each(sizeFormatMessages)('Display size in %s', async (format, msg, evaluate) => {
		const store: RootStore = useStore.getState();
		store.addRoom(mockedRoom);
		store.newMessage(msg);
		mockedGetImageThumbnailURL.mockReturnValue(previewUrl);
		setup(
			<Bubble
				message={mockedAttachmentMessageB}
				prevMessageIsFromSameSender={false}
				nextMessageIsFromSameSender={false}
				messageRef={React.createRef<HTMLDivElement>()}
			/>
		);
		const extensionFile = screen.getByText(new RegExp(evaluate, 'i'));
		expect(extensionFile).toBeInTheDocument();
	});
	test.each(readsMessages)('Display message sent from me, %s', (format, msg, cap, iconToCheck) => {
		const store: RootStore = useStore.getState();
		store.addRoom(mockedRoom);
		store.newMessage(msg);
		store.setLoginInfo(user1Be.id, user1Be.name);
		store.setCapabilities(createMockCapabilityList({ canSeeMessageReads: cap }));
		setup(
			<Bubble
				message={msg}
				prevMessageIsFromSameSender={false}
				nextMessageIsFromSameSender={false}
				messageRef={React.createRef<HTMLDivElement>()}
			/>
		);
		const ackIcon = screen.getByTestId(iconToCheck);
		expect(ackIcon).toBeInTheDocument();
	});
	test('Display reads for a message sent from me, me - user cannot see reads', () => {
		const store: RootStore = useStore.getState();
		store.addRoom(mockedRoom);
		store.newMessage(mockedTextMessageSentByMe);
		store.setLoginInfo(user1Be.id, user1Be.name);
		store.setCapabilities(createMockCapabilityList({ canSeeMessageReads: false }));
		setup(
			<Bubble
				message={mockedTextMessageSentByMe}
				prevMessageIsFromSameSender={false}
				nextMessageIsFromSameSender={false}
				messageRef={React.createRef<HTMLDivElement>()}
			/>
		);
		expect(screen.queryByTestId(iconDoneAll)).not.toBeInTheDocument();
	});
	test('Display unread message sent from me - user cannot see reads', () => {
		const store: RootStore = useStore.getState();
		store.addRoom(mockedRoom);
		store.newMessage(mockedTextMessageUnread);
		store.setLoginInfo(user1Be.id, user1Be.name);
		store.setCapabilities(createMockCapabilityList({ canSeeMessageReads: false }));
		setup(
			<Bubble
				message={mockedTextMessageUnread}
				prevMessageIsFromSameSender={false}
				nextMessageIsFromSameSender={false}
				messageRef={React.createRef<HTMLDivElement>()}
			/>
		);
		expect(screen.queryByTestId('icon: Checkmark')).not.toBeInTheDocument();
	});
});

describe('Message header', () => {
	test('Sender is guest user', async () => {
		const store: RootStore = useStore.getState();
		store.setLoginInfo(user1Be.id, user1Be.name);
		store.addRoom(mockedTempRoom);
		store.setUserInfo(guestUser);
		setup(
			<Bubble
				message={mockedMsgFromGuest}
				prevMessageIsFromSameSender={false}
				nextMessageIsFromSameSender={false}
				messageRef={React.createRef<HTMLDivElement>()}
			/>
		);
		const guestLabel = screen.queryByText('Guest');
		expect(guestLabel).toBeInTheDocument();
	});
	test('Sender is internal user', async () => {
		const store: RootStore = useStore.getState();
		store.setLoginInfo(user1Be.id, user1Be.name);
		store.addRoom(mockedTempRoom);
		store.setUserInfo(user1Be);
		setup(
			<Bubble
				message={mockedTextMessageSentByMe}
				prevMessageIsFromSameSender={false}
				nextMessageIsFromSameSender={false}
				messageRef={React.createRef<HTMLDivElement>()}
			/>
		);
		const guestLabel = screen.queryByText('Guest');
		expect(guestLabel).not.toBeInTheDocument();
	});
});

describe('Actions', () => {
	test('download an attachment', async () => {
		const store: RootStore = useStore.getState();
		store.setLoginInfo(user1Be.id, user1Be.name);
		store.addRoom(mockedTempRoom);
		store.setUserInfo(user1Be);
		const { user } = setup(
			<Bubble
				message={mockedAttachmentMessageGb}
				prevMessageIsFromSameSender={false}
				nextMessageIsFromSameSender={false}
				messageRef={React.createRef<HTMLDivElement>()}
			/>
		);
		jest.spyOn(document.body, 'appendChild').mockReturnValue(mockAttachmentTagElement);

		const arrowButton = screen.getByTestId(iconArrowIosDownward);
		await user.click(arrowButton);

		const downloadAction = await screen.findByText(/Download/i);
		await user.click(downloadAction);

		expect(document.body.appendChild).toHaveBeenCalledWith(
			expect.objectContaining({ download: 'image.jpeg' })
		);
	});
	test('Delete a message with attachment', async () => {
		mockedDeleteAttachment.mockReturnValue('deleted');

		const store: RootStore = useStore.getState();
		store.setLoginInfo(user1Be.id, user1Be.name);
		store.addRoom(mockedTempRoom);
		store.setUserInfo(user1Be);
		store.newMessage(mockedAttachmentMessageGb);
		const { user } = setup(
			<Bubble
				message={mockedAttachmentMessageGb}
				prevMessageIsFromSameSender={false}
				nextMessageIsFromSameSender={false}
				messageRef={React.createRef<HTMLDivElement>()}
			/>
		);

		const arrowButton = await screen.findByTestId(iconArrowIosDownward);
		await user.click(arrowButton);

		const deleteAction = await screen.findByText(/Delete for all/i);
		await user.click(deleteAction);

		expect(mockedDeleteAttachment).toHaveBeenCalled();
	});
	test('Delete a message', async () => {
		mockedSendChatMessageDeletion.mockReturnValue('deleted');

		const store: RootStore = useStore.getState();
		store.setLoginInfo(user1Be.id, user1Be.name);
		store.addRoom(mockedTempRoom);
		store.setUserInfo(user1Be);
		store.newMessage(mockedTextMessageSentByMe);
		const { user } = setup(
			<Bubble
				message={mockedTextMessageSentByMe}
				prevMessageIsFromSameSender={false}
				nextMessageIsFromSameSender={false}
				messageRef={React.createRef<HTMLDivElement>()}
			/>
		);

		const arrowButton = await screen.findByTestId(iconArrowIosDownward);
		await user.click(arrowButton);

		const deleteAction = await screen.findByText(/Delete for all/i);
		await user.click(deleteAction);

		expect(mockedSendChatMessageDeletion).toHaveBeenCalled();
	});
});
