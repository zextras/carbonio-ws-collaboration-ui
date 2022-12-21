/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { screen } from '@testing-library/react';
import React from 'react';
import { setup } from 'test-utils';

import useStore from '../../../store/Store';
import { createMockRoom, createMockTextMessage } from '../../../tests/createMock';
import { RoomBe } from '../../../types/network/models/roomBeTypes';
import { TextMessage } from '../../../types/store/MessageTypes';
import { RoomType } from '../../../types/store/RoomTypes';
import { RootStore } from '../../../types/store/StoreTypes';
import BubbleFactory from './BubbleFactory';

const mockedRoom: RoomBe = createMockRoom({
	id: 'roomId',
	type: RoomType.GROUP
});

const mockedRepliedTextMessage: TextMessage = createMockTextMessage({
	roomId: mockedRoom.id,
	replyTo: 'insideId',
	repliedMessage: createMockTextMessage({
		id: 'insideId',
		text: 'Hi!'
	})
});

describe('Message bubble component visualization', () => {
	test('Display replied text message', () => {
		const store: RootStore = useStore.getState();
		store.addRoom(mockedRoom);
		setup(
			<BubbleFactory
				message={mockedRepliedTextMessage}
				prevMessageIsFromSameSender={false}
				nextMessageIsFromSameSender={false}
				messageRef={React.createRef<HTMLElement>()}
			/>
		);
		const insideText = screen.getByText(
			new RegExp(`${mockedRepliedTextMessage.repliedMessage?.text}`, 'i')
		);
		expect(insideText).toBeVisible();
	});
});
