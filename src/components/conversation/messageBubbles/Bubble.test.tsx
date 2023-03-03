/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { screen } from '@testing-library/react';
import React from 'react';
import { setup } from 'test-utils';

import { mockedGetURLPreview } from '../../../../jest-mocks';
import useStore from '../../../store/Store';
import { createMockRoom, createMockTextMessage } from '../../../tests/createMock';
import { RoomBe } from '../../../types/network/models/roomBeTypes';
import { RoomType } from '../../../types/store/RoomTypes';
import { RootStore } from '../../../types/store/StoreTypes';
import Bubble from './Bubble';

const mockedRoom: RoomBe = createMockRoom({
	id: 'roomId',
	type: RoomType.GROUP
});

const mockedRepliedTextMessage = createMockTextMessage({
	roomId: mockedRoom.id,
	replyTo: 'insideId',
	repliedMessage: createMockTextMessage({
		id: 'insideId',
		text: 'Hi!'
	})
});

const mockedRepliedTextMessageWithAttachment = createMockTextMessage({
	roomId: mockedRoom.id,
	replyTo: 'insideId',
	repliedMessage: createMockTextMessage({
		id: 'insideId',
		text: 'Hi!',
		attachment: { id: 'pngAttachmentId', name: 'image.png', mimeType: 'image/png', size: 21412 }
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
	test('Hover on image reply', async () => {
		const store: RootStore = useStore.getState();
		store.addRoom(mockedRoom);
		mockedGetURLPreview.mockReturnValue('preview-url');
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
