/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen } from '@testing-library/react';

import BubbleFooter from './BubbleFooter';
import useStore from '../../../../store/Store';
import { createMockRoom } from '../../../../tests/createMock';
import { setup } from '../../../../tests/test-utils';
import { RoomType } from '../../../../types/network/models/roomBeTypes';
import { MarkerStatus } from '../../../../types/store/MarkersTypes';

const iconDoneAll = 'icon: DoneAll';
const colorGray = 'color: gray';

describe('BubbleFooter test', () => {
	test('Read icon on my message when it is unread', () => {
		setup(
			<BubbleFooter
				date={Date.now()}
				isMyMessage
				messageRead={MarkerStatus.UNREAD}
				canSeeMessageReads
			/>
		);
		const icon = screen.getByTestId('icon: Checkmark');
		expect(icon).toBeInTheDocument();
		expect(icon).toHaveStyle(colorGray);
	});

	test('Read icon on my message when it is read by someone', () => {
		setup(
			<BubbleFooter
				date={Date.now()}
				isMyMessage
				messageRead={MarkerStatus.READ_BY_SOMEONE}
				canSeeMessageReads
			/>
		);
		const icon = screen.getByTestId(iconDoneAll);
		expect(icon).toBeInTheDocument();
		expect(icon).toHaveStyle(colorGray);
	});

	test('Read icon on my message when it is read by all', () => {
		setup(
			<BubbleFooter
				date={Date.now()}
				isMyMessage
				messageRead={MarkerStatus.READ}
				canSeeMessageReads
			/>
		);
		const icon = screen.getByTestId(iconDoneAll);
		expect(icon).toBeInTheDocument();
		expect(icon).not.toHaveStyle(colorGray);
	});

	test('Read icon on my message when it is in pending', () => {
		setup(
			<BubbleFooter
				date={Date.now()}
				isMyMessage
				messageRead={MarkerStatus.PENDING}
				canSeeMessageReads
			/>
		);
		const icon = screen.getByTestId('icon: ClockOutline');
		expect(icon).toBeInTheDocument();
		expect(icon).toHaveStyle(colorGray);
	});

	test('Read icon is not displayed into other message', () => {
		setup(
			<BubbleFooter
				date={Date.now()}
				isMyMessage={false}
				messageRead={MarkerStatus.READ}
				canSeeMessageReads
			/>
		);
		expect(screen.queryByTestId(iconDoneAll)).not.toBeInTheDocument();
	});

	test('Read icon is not displayed if capability is set to false', () => {
		setup(
			<BubbleFooter
				date={Date.now()}
				isMyMessage
				messageRead={MarkerStatus.READ}
				canSeeMessageReads={false}
			/>
		);
		expect(screen.queryByTestId(iconDoneAll)).not.toBeInTheDocument();
	});

	test('On my read message, I can see the read by dropdown on group messages', async () => {
		const room = createMockRoom({ id: 'roomId', type: RoomType.GROUP });
		useStore.getState().addRoom(room);
		const { user } = setup(
			<BubbleFooter
				date={Date.now()}
				isMyMessage
				messageRead={MarkerStatus.READ}
				canSeeMessageReads
				roomId={room.id}
				stanzaId={'stanzaId'}
			/>
		);
		const icon = screen.getByTestId(iconDoneAll);
		await user.click(icon);
		expect(screen.getByText('Seen by:')).toBeInTheDocument();
	});

	test('On my read message, I cannot see the read by dropdown on one-to-one messages', async () => {
		const room = createMockRoom({ id: 'roomId', type: RoomType.ONE_TO_ONE });
		useStore.getState().addRoom(room);
		const { user } = setup(
			<BubbleFooter
				date={Date.now()}
				isMyMessage
				messageRead={MarkerStatus.READ}
				canSeeMessageReads
				roomId={room.id}
				stanzaId={'stanzaId'}
			/>
		);
		const icon = screen.getByTestId(iconDoneAll);
		await user.click(icon);
		expect(screen.queryByTestId('Seen by:')).not.toBeInTheDocument();
	});
});
