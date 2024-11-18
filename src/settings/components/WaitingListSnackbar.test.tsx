/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { act, screen, waitFor } from '@testing-library/react';

import WaitingListSnackbar from './WaitingListSnackbar';
import { EventName, sendCustomEvent } from '../../hooks/useEventListener';
import useStore from '../../store/Store';
import { createMockMeeting, createMockRoom, createMockUser } from '../../tests/createMock';
import { setup } from '../../tests/test-utils';
import { MeetingType } from '../../types/network/models/meetingBeTypes';
import { WsEventType } from '../../types/network/websocket/wsEvents';
import { RoomType } from '../../types/store/RoomTypes';

const user = createMockUser({ id: 'userId', name: 'User' });
const user0 = createMockUser({ id: 'userId0', name: 'User' });
const room = createMockRoom({ id: 'roomId', type: RoomType.ONE_TO_ONE });
const meeting = createMockMeeting({
	id: 'meetingId',
	roomId: room.id,
	meetingType: MeetingType.SCHEDULED
});

beforeEach(() => {
	const store = useStore.getState();
	store.setUserInfo(user);
	store.setUserInfo(user0);
	store.addRoom(room);
	store.addMeeting(meeting);
});

describe('WaitingListSnackbar', () => {
	test('Should render the snackbar', async () => {
		setup(<WaitingListSnackbar />);

		act(() => {
			sendCustomEvent({
				name: EventName.NEW_WAITING_USER,
				data: {
					type: WsEventType.MEETING_WAITING_PARTICIPANT_JOINED,
					userId: user0.id,
					sentDate: new Date().toISOString(),
					meetingId: meeting.id
				}
			});
		});

		await waitFor(() => {
			const snackbar = screen.getByTestId('notification_snackbar');
			expect(snackbar).toBeInTheDocument();
		});
	});
});
