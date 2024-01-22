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
	createMockRoom,
	createMockTextMessage
} from '../../../../tests/createMock';
import { mockedGetImageThumbnailURL } from '../../../../tests/mocks/network';
import { setup } from '../../../../tests/test-utils';
import { RoomBe } from '../../../../types/network/models/roomBeTypes';
import { MarkerStatus } from '../../../../types/store/MarkersTypes';
import { RoomType } from '../../../../types/store/RoomTypes';
import { RootStore } from '../../../../types/store/StoreTypes';
import { User } from '../../../../types/store/UserTypes';

const previewUrl = 'preview-url';
const iconDoneAll = 'icon: DoneAll';

const user1Be: User = {
	id: 'user1',
	email: 'user1@domain.com',
	name: 'User1',
	lastSeen: 1234567890,
	statusMessage: "Hey there! I'm User 1"
};

const user2Be: User = {
	id: 'user2',
	email: 'user2@domain.com',
	name: 'User2',
	lastSeen: 1234567890,
	statusMessage: "Hey there! I'm User 2"
};

const mockedRoom: RoomBe = createMockRoom({
	id: 'roomId',
	type: RoomType.GROUP,
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
		}
	]
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
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
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

describe('Attachment footer', () => {
	test('Display size in B', () => {
		const store: RootStore = useStore.getState();
		store.addRoom(mockedRoom);
		store.newMessage(mockedAttachmentMessageB);
		mockedGetImageThumbnailURL.mockReturnValue(previewUrl);
		setup(
			<Bubble
				message={mockedAttachmentMessageB}
				prevMessageIsFromSameSender={false}
				nextMessageIsFromSameSender={false}
				messageRef={React.createRef<HTMLDivElement>()}
			/>
		);
		const extensionFile = screen.getByText(/PNG • 21B/i);
		expect(extensionFile).toBeInTheDocument();
	});
	test('Display size in Kb', () => {
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
		const extensionFile = screen.getByText(/PNG • 20.91KB/i);
		expect(extensionFile).toBeInTheDocument();
	});
	test('Display size in Mb', () => {
		const store: RootStore = useStore.getState();
		store.addRoom(mockedRoom);
		store.newMessage(mockedAttachmentMessageMb);
		mockedGetImageThumbnailURL.mockReturnValue(previewUrl);
		setup(
			<Bubble
				message={mockedAttachmentMessageMb}
				prevMessageIsFromSameSender={false}
				nextMessageIsFromSameSender={false}
				messageRef={React.createRef<HTMLDivElement>()}
			/>
		);
		const extensionFile = screen.getByText(/PNG • 3.19MB/i);
		expect(extensionFile).toBeInTheDocument();
	});
	test('Display size in Gb', () => {
		const store: RootStore = useStore.getState();
		store.addRoom(mockedRoom);
		store.newMessage(mockedAttachmentMessageGb);
		mockedGetImageThumbnailURL.mockReturnValue(previewUrl);
		setup(
			<Bubble
				message={mockedAttachmentMessageGb}
				prevMessageIsFromSameSender={false}
				nextMessageIsFromSameSender={false}
				messageRef={React.createRef<HTMLDivElement>()}
			/>
		);
		const extensionFile = screen.getByText(/PNG • 5.31GB/i);
		expect(extensionFile).toBeInTheDocument();
	});
	test('Display reads for a message sent from me, me - user can see reads', () => {
		const store: RootStore = useStore.getState();
		store.addRoom(mockedRoom);
		store.newMessage(mockedTextMessageSentByMe);
		store.setLoginInfo(user1Be.id, user1Be.name);
		store.setCapabilities(createMockCapabilityList({ canSeeMessageReads: true }));
		setup(
			<Bubble
				message={mockedTextMessageSentByMe}
				prevMessageIsFromSameSender={false}
				nextMessageIsFromSameSender={false}
				messageRef={React.createRef<HTMLDivElement>()}
			/>
		);
		const ackIcon = screen.getByTestId(iconDoneAll);
		expect(ackIcon).toBeInTheDocument();
	});
	test('Display someone reads for a message sent from me - user can see reads', () => {
		const store: RootStore = useStore.getState();
		store.addRoom(mockedRoom);
		store.newMessage(mockedTextMessageReadBySomeone);
		store.setLoginInfo(user1Be.id, user1Be.name);
		store.setCapabilities(createMockCapabilityList({ canSeeMessageReads: true }));
		setup(
			<Bubble
				message={mockedTextMessageReadBySomeone}
				prevMessageIsFromSameSender={false}
				nextMessageIsFromSameSender={false}
				messageRef={React.createRef<HTMLDivElement>()}
			/>
		);
		const ackIcon = screen.getByTestId(iconDoneAll);
		expect(ackIcon).toBeInTheDocument();
	});
	test('Display unread message sent from me - user can see reads', () => {
		const store: RootStore = useStore.getState();
		store.addRoom(mockedRoom);
		store.newMessage(mockedTextMessageUnread);
		store.setLoginInfo(user1Be.id, user1Be.name);
		store.setCapabilities(createMockCapabilityList({ canSeeMessageReads: true }));
		setup(
			<Bubble
				message={mockedTextMessageUnread}
				prevMessageIsFromSameSender={false}
				nextMessageIsFromSameSender={false}
				messageRef={React.createRef<HTMLDivElement>()}
			/>
		);
		const ackIcon = screen.getByTestId('icon: Checkmark');
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
	test('Display someone reads for a message sent from me - user can see reads', () => {
		const store: RootStore = useStore.getState();
		store.addRoom(mockedRoom);
		store.newMessage(mockedTextMessageReadBySomeone);
		store.setLoginInfo(user1Be.id, user1Be.name);
		store.setCapabilities(createMockCapabilityList({ canSeeMessageReads: true }));
		setup(
			<Bubble
				message={mockedTextMessageReadBySomeone}
				prevMessageIsFromSameSender={false}
				nextMessageIsFromSameSender={false}
				messageRef={React.createRef<HTMLDivElement>()}
			/>
		);
		const ackIcon = screen.getByTestId(iconDoneAll);
		expect(ackIcon).toBeInTheDocument();
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
	test('Display pending status for message sent from me - user can see reads', () => {
		const store: RootStore = useStore.getState();
		store.addRoom(mockedRoom);
		store.newMessage(mockedTextMessagePending);
		store.setLoginInfo(user1Be.id, user1Be.name);
		store.setCapabilities(createMockCapabilityList({ canSeeMessageReads: true }));
		setup(
			<Bubble
				message={mockedTextMessagePending}
				prevMessageIsFromSameSender={false}
				nextMessageIsFromSameSender={false}
				messageRef={React.createRef<HTMLDivElement>()}
			/>
		);
		const ackIcon = screen.getByTestId('icon: ClockOutline');
		expect(ackIcon).toBeInTheDocument();
	});
	test('Display pending status for message sent from me - user cannot see reads', () => {
		const store: RootStore = useStore.getState();
		store.addRoom(mockedRoom);
		store.newMessage(mockedTextMessagePending);
		store.setLoginInfo(user1Be.id, user1Be.name);
		store.setCapabilities(createMockCapabilityList({ canSeeMessageReads: false }));
		setup(
			<Bubble
				message={mockedTextMessagePending}
				prevMessageIsFromSameSender={false}
				nextMessageIsFromSameSender={false}
				messageRef={React.createRef<HTMLDivElement>()}
			/>
		);
		const ackIcon = screen.getByTestId('icon: ClockOutline');
		expect(ackIcon).toBeInTheDocument();
	});
});
