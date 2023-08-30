/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { screen } from '@testing-library/react';
import React from 'react';
import { setup } from 'test-utils';

import Bubble from './Bubble';
import { mockedGetImageThumbnailURL } from '../../../../jest-mocks';
import useStore from '../../../store/Store';
import { createMockRoom, createMockTextMessage } from '../../../tests/createMock';
import { RoomBe } from '../../../types/network/models/roomBeTypes';
import { RoomType } from '../../../types/store/RoomTypes';
import { RootStore } from '../../../types/store/StoreTypes';
import { User } from '../../../types/store/UserTypes';

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

describe('Message bubble component visualization', () => {
	test('Display replied text message', () => {
		const store: RootStore = useStore.getState();
		store.addRoom(mockedRoom);
		setup(
			<Bubble
				message={mockedRepliedTextMessage}
				prevMessageIsFromSameSender={false}
				nextMessageIsFromSameSender={false}
				messageRef={React.createRef<HTMLElement>()}
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
		mockedGetImageThumbnailURL.mockReturnValue('preview-url');
		setup(
			<Bubble
				message={mockedAttachmentMessageKb}
				prevMessageIsFromSameSender={false}
				nextMessageIsFromSameSender={false}
				messageRef={React.createRef<HTMLElement>()}
			/>
		);
		expect(screen.getByTestId('attachmentImg')).toBeInTheDocument();
	});
	test('Hover on image reply', async () => {
		const store: RootStore = useStore.getState();
		store.addRoom(mockedRoom);
		mockedGetImageThumbnailURL.mockReturnValue('preview-url');
		const { user } = setup(
			<Bubble
				message={mockedRepliedTextMessageWithAttachment}
				prevMessageIsFromSameSender={false}
				nextMessageIsFromSameSender={false}
				messageRef={React.createRef<HTMLElement>()}
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
		mockedGetImageThumbnailURL.mockReturnValue('preview-url');
		setup(
			<Bubble
				message={mockedAttachmentMessageB}
				prevMessageIsFromSameSender={false}
				nextMessageIsFromSameSender={false}
				messageRef={React.createRef<HTMLElement>()}
			/>
		);
		const extensionFile = screen.getByText(/PNG • 21B/i);
		expect(extensionFile).toBeInTheDocument();
	});
	test('Display size in Kb', () => {
		const store: RootStore = useStore.getState();
		store.addRoom(mockedRoom);
		store.newMessage(mockedAttachmentMessageKb);
		mockedGetImageThumbnailURL.mockReturnValue('preview-url');
		setup(
			<Bubble
				message={mockedAttachmentMessageKb}
				prevMessageIsFromSameSender={false}
				nextMessageIsFromSameSender={false}
				messageRef={React.createRef<HTMLElement>()}
			/>
		);
		const extensionFile = screen.getByText(/PNG • 20.91KB/i);
		expect(extensionFile).toBeInTheDocument();
	});
	test('Display size in Mb', () => {
		const store: RootStore = useStore.getState();
		store.addRoom(mockedRoom);
		store.newMessage(mockedAttachmentMessageMb);
		mockedGetImageThumbnailURL.mockReturnValue('preview-url');
		setup(
			<Bubble
				message={mockedAttachmentMessageMb}
				prevMessageIsFromSameSender={false}
				nextMessageIsFromSameSender={false}
				messageRef={React.createRef<HTMLElement>()}
			/>
		);
		const extensionFile = screen.getByText(/PNG • 3.19MB/i);
		expect(extensionFile).toBeInTheDocument();
	});
	test('Display size in Gb', () => {
		const store: RootStore = useStore.getState();
		store.addRoom(mockedRoom);
		store.newMessage(mockedAttachmentMessageGb);
		mockedGetImageThumbnailURL.mockReturnValue('preview-url');
		setup(
			<Bubble
				message={mockedAttachmentMessageGb}
				prevMessageIsFromSameSender={false}
				nextMessageIsFromSameSender={false}
				messageRef={React.createRef<HTMLElement>()}
			/>
		);
		const extensionFile = screen.getByText(/PNG • 5.31GB/i);
		expect(extensionFile).toBeInTheDocument();
	});
});
