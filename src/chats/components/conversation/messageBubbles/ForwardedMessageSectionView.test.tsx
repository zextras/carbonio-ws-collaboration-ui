/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { screen } from '@testing-library/react';
import React from 'react';

import ForwardedMessageSectionView from './ForwardedMessageSectionView';
import useStore from '../../../../store/Store';
import { createMockTextMessage, createMockUser } from '../../../../tests/createMock';
import { setup } from '../../../../tests/test-utils';
import { UserBe } from '../../../../types/network/models/userBeTypes';
import { RootStore } from '../../../../types/store/StoreTypes';

const forwardedUser: UserBe = createMockUser({ id: 'forwardedUserId', name: 'User' });

const textMessage = createMockTextMessage({ from: forwardedUser.id });
const forwardedInfo = {
	id: textMessage.id,
	date: textMessage.date,
	from: textMessage.from,
	count: 1
};

describe('Forward Message Section View', () => {
	test('All elements are rendered', () => {
		const store: RootStore = useStore.getState();
		store.setUserInfo(forwardedUser);
		const forwardedMessage = createMockTextMessage({
			id: 'forwardedMessageId',
			forwarded: forwardedInfo
		});
		setup(
			<ForwardedMessageSectionView
				message={forwardedMessage}
				forwardedInfo={forwardedInfo}
				isMyMessage={false}
			/>
		);

		// Displayed username is the username of who forward message
		const userName = screen.getByText(new RegExp(forwardedUser.name, 'i'));
		expect(userName).toBeInTheDocument();

		// Displayed text is the text of the forwarded message
		const message = screen.getByText(new RegExp(forwardedMessage.text, 'i'));
		expect(message).toBeInTheDocument();
	});

	test('Forward file is rendered - no description', () => {
		const store: RootStore = useStore.getState();
		store.setUserInfo(forwardedUser);
		const forwardedMessageWithAttachment = createMockTextMessage({
			id: 'forwardedTextMessageWithAttachmentId',
			text: '',
			attachment: {
				id: 'attachmentId',
				name: 'attachmentName',
				mimeType: 'image/png',
				size: 1000
			},
			forwarded: forwardedInfo
		});
		setup(
			<ForwardedMessageSectionView
				message={forwardedMessageWithAttachment}
				forwardedInfo={forwardedMessageWithAttachment.forwarded!}
				isMyMessage={false}
			/>
		);

		// Displayed text is the name of the file
		const fileName = forwardedMessageWithAttachment.attachment?.name || '';
		const message = screen.getByText(new RegExp(fileName, 'i'));
		expect(message).toBeInTheDocument();
	});

	test('Forward file is rendered - with description', () => {
		const forwardedMessageWithAttachment = createMockTextMessage({
			id: 'forwardedTextMessageWithAttachmentId',
			text: 'description',
			attachment: {
				id: 'attachmentId',
				name: 'attachmentName',
				mimeType: 'image/png',
				size: 1000
			},
			forwarded: forwardedInfo
		});

		const store: RootStore = useStore.getState();
		store.setUserInfo(forwardedUser);
		setup(
			<ForwardedMessageSectionView
				message={forwardedMessageWithAttachment}
				forwardedInfo={forwardedInfo}
				isMyMessage={false}
			/>
		);

		// Displayed text is the text of the forwarded message
		const message = screen.getByText(new RegExp(forwardedMessageWithAttachment.text, 'i'));
		expect(message).toBeInTheDocument();
	});
});
