/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { PinMessage } from './PinMessage';
import useStore from '../../../store/Store';
import {
	createMockMember,
	createMockRoom,
	createMockTextMessage,
	createMockUser
} from '../../../tests/createMock';
import { screen, setup } from '../../../tests/test-utils';
import { RoomBe } from '../../../types/network/models/roomBeTypes';
import { RoomType } from '../../../types/store/RoomTypes';

const user1 = createMockUser({ id: 'user1', name: 'user1' });
const user2 = createMockUser({ id: 'user2', name: 'user2' });
const user3 = createMockUser({ id: 'user3', name: 'user3' });

const oneToOneRoom: RoomBe = createMockRoom({
	type: RoomType.ONE_TO_ONE,
	members: [createMockMember({ userId: user1.id, owner: true })]
});
beforeEach(() => {
	const store = useStore.getState();
	store.setLoginInfo({ id: user1.id, name: 'user1' });
	store.setUserInfo([user1, user2, user3]);
	store.addRooms([oneToOneRoom]);
});

const iconClose = 'icon: Unpin3';

describe('PinMessage', () => {
	describe('One to one', () => {
		it('should render your pin message', () => {
			const mockedTextMessage = createMockTextMessage({
				id: 'idSimpleTextMessage',
				roomId: oneToOneRoom.id,
				from: 'user1'
			});
			setup(<PinMessage pinnedMessage={mockedTextMessage} />);

			expect(screen.getByText(/you/i)).toBeVisible();
			expect(screen.getByText(mockedTextMessage.text)).toBeVisible();
			expect(screen.getByText(/show more/i)).toBeVisible();
			expect(screen.getByTestId(iconClose)).toBeVisible();
		});

		it('should render the user pin message', () => {
			const mockedTextMessage = createMockTextMessage({
				id: 'idSimpleTextMessage',
				roomId: oneToOneRoom.id,
				from: 'user2'
			});
			setup(<PinMessage pinnedMessage={mockedTextMessage} />);

			expect(screen.getByText(/user2/i)).toBeVisible();
			expect(screen.getByText(mockedTextMessage.text)).toBeVisible();
			expect(screen.getByText(/show more/i)).toBeVisible();
			expect(screen.getByTestId(iconClose)).toBeVisible();
		});
	});

	describe('Group', () => {
		const members = [
			createMockMember({ userId: 'user1', owner: true }),
			createMockMember({ userId: 'user2' }),
			createMockMember({ userId: 'user3' })
		];
		const group: RoomBe = createMockRoom({
			type: RoomType.GROUP,
			members
		});

		beforeEach(() => {
			const store = useStore.getState();
			store.setLoginInfo({ id: user1.id, name: 'user1' });
			store.setUserInfo([user1, user2, user3]);
			store.addRooms([group]);
		});

		it('should render the username owner and unpin icon if you are the moderator', () => {
			const mockedTextMessage = createMockTextMessage({
				id: 'idSimpleTextMessage',
				roomId: group.id,
				from: 'user2'
			});
			setup(<PinMessage pinnedMessage={mockedTextMessage} />);

			expect(screen.getByText(/user2/i)).toBeVisible();
			expect(screen.getByText(mockedTextMessage.text)).toBeVisible();
			expect(screen.getByText(/show more/i)).toBeVisible();
			expect(screen.getByTestId(iconClose)).toBeVisible();
		});

		it('should not render unpin icon if you are not the moderator', () => {
			const mockedTextMessage = createMockTextMessage({
				id: 'idSimpleTextMessage',
				roomId: group.id,
				from: 'user1'
			});
			const store = useStore.getState();
			store.setLoginInfo({ id: user2.id, name: 'user2' });

			setup(<PinMessage pinnedMessage={mockedTextMessage} />);

			expect(screen.getByText(/user1/i)).toBeVisible();
			expect(screen.getByText(mockedTextMessage.text)).toBeVisible();
			expect(screen.getByText(/show more/i)).toBeVisible();
			expect(screen.queryByTestId(iconClose)).not.toBeInTheDocument();
		});
	});

	it('should toggle show more button', async () => {
		const mockedTextMessage = createMockTextMessage({
			id: 'idSimpleTextMessage',
			roomId: oneToOneRoom.id,
			from: 'user1'
		});
		const { user } = setup(<PinMessage pinnedMessage={mockedTextMessage} />);

		await user.click(screen.getByText(/show more/i));
		expect(screen.getByText(/hide/i)).toBeVisible();
	});

	it('should render tooltip of unpin message', async () => {
		const mockedTextMessage = createMockTextMessage({
			id: 'idSimpleTextMessage',
			roomId: oneToOneRoom.id,
			from: 'user1'
		});
		const { user } = setup(<PinMessage pinnedMessage={mockedTextMessage} />);

		await user.hover(screen.getByTestId(iconClose));
		expect(await screen.findByText(/unpin message/i)).toBeVisible();
	});

	it('should render the forwarded pin message', async () => {
		const forwardedTextMessage = createMockTextMessage({
			id: 'idSimpleTextMessage',
			roomId: oneToOneRoom.id,
			from: 'user1',
			forwarded: { id: 'forwardedId', date: 1661441294393, from: 'user2', count: 1 }
		});
		const { user } = setup(<PinMessage pinnedMessage={forwardedTextMessage} />);

		await user.click(screen.getByText(/show more/i));
		expect(screen.getByText('Originally sent by:')).toBeVisible();
		expect(screen.getByText(/user2/i)).toBeVisible();
		expect(screen.getByText(forwardedTextMessage.text)).toBeVisible();
	});

	describe.each([
		{
			description: 'image attachment',
			mimeType: 'image/png',
			expectedIcon: 'icon: Image'
		},
		{
			description: 'PDF attachment',
			mimeType: 'application/pdf',
			expectedIcon: 'icon: FilePdf'
		},
		{
			description: 'text file attachment',
			mimeType: 'text/plain',
			expectedIcon: 'icon: FileText'
		},
		{
			description: 'generic file attachment',
			mimeType: 'application/octet-stream',
			expectedIcon: 'icon: FileText'
		}
	])('Attachment - $description', ({ mimeType, expectedIcon }) => {
		it('should render the correct icon with its name file if the pin message has an attachment', () => {
			const mockedTextMessage = createMockTextMessage({
				id: 'idSimpleTextMessage',
				roomId: oneToOneRoom.id,
				from: 'user1',
				attachment: {
					id: 'attachmentId',
					name: 'file_name',
					mimeType,
					size: 1661441294393
				},
				text: ''
			});
			setup(<PinMessage pinnedMessage={mockedTextMessage} />);

			expect(screen.getByTestId(expectedIcon)).toBeVisible();
			expect(screen.getByText(mockedTextMessage.attachment!.name)).toBeVisible();
		});

		it('should render the text of the pinned message with the attachment icon', () => {
			const mockedTextMessage = createMockTextMessage({
				id: 'idSimpleTextMessage',
				roomId: oneToOneRoom.id,
				from: 'user1',
				attachment: {
					id: 'attachmentId',
					name: 'file_name',
					mimeType,
					size: 1661441294393
				},
				text: 'content'
			});
			setup(<PinMessage pinnedMessage={mockedTextMessage} />);

			expect(screen.getByTestId(expectedIcon)).toBeVisible();
			expect(screen.getByText(mockedTextMessage.text)).toBeVisible();
			expect(screen.queryByText(mockedTextMessage.attachment!.name)).not.toBeInTheDocument();
		});

		it('should render the thumbnail, the name file and text content if the pinned message is expanded', async () => {
			const mockedTextMessage = createMockTextMessage({
				id: 'idSimpleTextMessage',
				roomId: oneToOneRoom.id,
				from: 'user1',
				attachment: {
					id: 'attachmentId',
					name: 'file_name',
					mimeType,
					size: 1661441294393
				},
				text: 'content'
			});
			const { user } = setup(<PinMessage pinnedMessage={mockedTextMessage} />);

			await user.click(screen.getByText(/show more/i));
			// attachment is visible
			expect(screen.getByTestId('hover-container')).toBeVisible();
			expect(screen.getByText(mockedTextMessage.attachment!.name)).toBeVisible();
			expect(screen.getByText(mockedTextMessage.text)).toBeVisible();
			expect(screen.queryByTestId(`icon: ${expectedIcon}`)).not.toBeInTheDocument();
		});
	});
});
