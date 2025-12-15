/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen } from '@testing-library/react';

import MeetingNotification from './MeetingNotification';
import useStore from '../../store/Store';
import { createMockMeeting, createMockRoom, createMockUser } from '../../tests/createMock';
import { setup } from '../../tests/test-utils';
import { RoomType } from '../../types/store/RoomTypes';

const sendAQuickMessage = 'Send a quick message';
const joinMeeting = 'Join meeting';

const user = createMockUser({ id: 'userId', name: 'User' });
const room = createMockRoom({ id: 'roomId', type: RoomType.ONE_TO_ONE });
const meeting = createMockMeeting({ id: 'meetingId', roomId: room.id });
const mockRemoveNotification = vi.fn();

beforeEach(() => {
	const store = useStore.getState();
	store.setUserInfo([user]);
	store.addRooms([room]);
	store.addMeetings([meeting]);
});

describe('MeetingNotification', () => {
	test('Everything is rendered correctly', () => {
		setup(
			<MeetingNotification
				id={'notificationId'}
				from={user.id}
				meetingId={'meetingId'}
				removeNotification={mockRemoveNotification}
				stopMeetingSound={vi.fn()}
			/>
		);

		expect(screen.getByTitle(user.name)).toBeInTheDocument();
		expect(screen.getByText(sendAQuickMessage)).toBeInTheDocument();
		expect(screen.getByTestId('icon: Navigation2')).toBeInTheDocument();
		expect(screen.getByText('Decline')).toBeInTheDocument();
		expect(screen.getByText('Decline')).not.toBeDisabled();
		expect(screen.getByText(joinMeeting)).toBeInTheDocument();
		expect(screen.getByText(joinMeeting)).not.toBeDisabled();
	});

	test('User can send a message clicking to the button Send message', async () => {
		const spyOnSendChatMessage = vi.spyOn(
			useStore.getState().connections.xmppClient,
			'sendChatMessage'
		);
		const { user: userEvent } = setup(
			<MeetingNotification
				id={'notificationId'}
				from={user.id}
				meetingId={'meetingId'}
				removeNotification={mockRemoveNotification}
				stopMeetingSound={vi.fn()}
			/>
		);
		await userEvent.type(screen.getByPlaceholderText(sendAQuickMessage), 'Hello');
		await userEvent.click(screen.getByTestId('icon: Navigation2'));
		expect(spyOnSendChatMessage).toHaveBeenCalled();
	});

	test('User can send a message clicking Enter', async () => {
		const spyOnSendChatMessage = vi.spyOn(
			useStore.getState().connections.xmppClient,
			'sendChatMessage'
		);
		const { user: userEvent } = setup(
			<MeetingNotification
				id={'notificationId'}
				from={user.id}
				meetingId={'meetingId'}
				removeNotification={mockRemoveNotification}
				stopMeetingSound={vi.fn()}
			/>
		);
		await userEvent.type(screen.getByPlaceholderText(sendAQuickMessage), 'Hello{enter}');
		expect(spyOnSendChatMessage).toHaveBeenCalled();
	});

	test('Declining a meeting removes the notification', async () => {
		const { user: userEvent } = setup(
			<MeetingNotification
				id={'notificationId'}
				from={user.id}
				meetingId={'meetingId'}
				removeNotification={mockRemoveNotification}
				stopMeetingSound={vi.fn()}
			/>
		);
		await userEvent.click(screen.getByText('Decline'));
		expect(mockRemoveNotification).toHaveBeenCalled();
	});

	test('Joining a meeting removes the notification', async () => {
		vi.spyOn(window, 'open').mockImplementation(() => null);
		const { user: userEvent } = setup(
			<MeetingNotification
				id={'notificationId'}
				from={user.id}
				meetingId={'meetingId'}
				removeNotification={mockRemoveNotification}
				stopMeetingSound={vi.fn()}
			/>
		);
		await userEvent.click(screen.getByText(joinMeeting));
		expect(mockRemoveNotification).toHaveBeenCalled();
	});
});
