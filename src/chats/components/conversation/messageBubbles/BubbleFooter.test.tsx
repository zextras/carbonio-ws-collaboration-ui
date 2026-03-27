/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen } from '@testing-library/react';

import BubbleFooter from './BubbleFooter';
import useStore from '../../../../store/Store';
import { createMockRoom, createMockTextMessage } from '../../../../tests/createMock';
import { setup } from '../../../../tests/test-utils';
import { RoomType } from '../../../../types/network/models/roomBeTypes';
import { MarkerStatus } from '../../../../types/store/ChatsRegistryTypes';

const iconDoneAll = 'icon: DoneAll';
const colorGray = { color: 'rgb(128, 128, 128)' };

describe('BubbleFooter test', () => {
	const mockedTextMessage = createMockTextMessage();
	test('Read icon on my message when it is unread', () => {
		setup(<BubbleFooter isMyMessage canSeeMessageReads message={mockedTextMessage} />);
		const icon = screen.getByTestId('icon: Checkmark');
		expect(icon).toBeInTheDocument();
		expect(icon).toHaveStyle(colorGray);
	});

	test('Read icon on my message when it is read by someone', () => {
		setup(
			<BubbleFooter
				isMyMessage
				canSeeMessageReads
				message={{ ...mockedTextMessage, read: MarkerStatus.READ_BY_SOMEONE }}
			/>
		);
		const icon = screen.getByTestId(iconDoneAll);
		expect(icon).toBeInTheDocument();
		expect(icon).toHaveStyle(colorGray);
	});

	test('Read icon on my message when it is read by all', () => {
		setup(
			<BubbleFooter
				isMyMessage
				canSeeMessageReads
				message={{ ...mockedTextMessage, read: MarkerStatus.READ }}
			/>
		);
		const icon = screen.getByTestId(iconDoneAll);
		expect(icon).toBeInTheDocument();
		expect(icon).not.toHaveStyle(colorGray);
	});

	test('Read icon on my message when it is in pending', () => {
		setup(
			<BubbleFooter
				isMyMessage
				canSeeMessageReads
				message={{ ...mockedTextMessage, read: MarkerStatus.PENDING }}
			/>
		);
		const icon = screen.getByTestId('icon: ClockOutline');
		expect(icon).toBeInTheDocument();
		expect(icon).toHaveStyle(colorGray);
	});

	test('Read icon is not displayed into other message', () => {
		setup(<BubbleFooter isMyMessage={false} canSeeMessageReads message={mockedTextMessage} />);
		expect(screen.queryByTestId(iconDoneAll)).not.toBeInTheDocument();
	});

	test('Read icon is not displayed if capability is set to false', () => {
		setup(<BubbleFooter isMyMessage canSeeMessageReads={false} message={mockedTextMessage} />);
		expect(screen.queryByTestId(iconDoneAll)).not.toBeInTheDocument();
	});

	test('On my read message, I can see the read by dropdown on group messages', async () => {
		const room = createMockRoom({ id: 'roomId', type: RoomType.GROUP });
		useStore.getState().addRooms([room]);
		const { user } = setup(
			<BubbleFooter
				isMyMessage
				canSeeMessageReads
				message={{ ...mockedTextMessage, read: MarkerStatus.READ }}
			/>
		);
		const icon = screen.getByTestId(iconDoneAll);
		await user.click(icon);
		expect(screen.getByText('Seen by:')).toBeInTheDocument();
	});

	test('On my read message, I cannot see the read by dropdown on one-to-one messages', async () => {
		const room = createMockRoom({ id: 'roomId', type: RoomType.ONE_TO_ONE });
		useStore.getState().addRooms([room]);
		const { user } = setup(
			<BubbleFooter
				isMyMessage
				canSeeMessageReads
				message={{ ...mockedTextMessage, read: MarkerStatus.READ }}
			/>
		);
		const icon = screen.getByTestId(iconDoneAll);
		await user.click(icon);
		expect(screen.queryByTestId('Seen by:')).not.toBeInTheDocument();
	});
});
