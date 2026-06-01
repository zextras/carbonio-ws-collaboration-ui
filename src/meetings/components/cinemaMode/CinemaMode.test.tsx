/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { screen } from '@testing-library/react';

import CinemaMode from './CinemaMode';
import useStore from '../../../store/Store';
import {
	createMockMeeting,
	createMockMember,
	createMockParticipants,
	createMockRoom,
	createMockUser
} from '../../../tests/createMock';
import { routerContextSetup } from '../../../tests/test-utils';
import {RoomType} from 'wsc-shared';

const user1 = createMockUser({ id: 'user1', name: 'User 1' });
const user2 = createMockUser({ id: 'user2', name: 'User 2' });
const user3 = createMockUser({ id: 'user3', name: 'User 3' });
const user4 = createMockUser({ id: 'user4', name: 'User 4' });

const groupRoom = createMockRoom({
	id: 'room-test',
	type: RoomType.GROUP,
	members: [
		createMockMember({ userId: user1.id, owner: true }),
		createMockMember({ userId: user2.id, owner: true })
	],
	userSettings: { muted: false }
});

const user1Participant = createMockParticipants({ userId: user1.id });

const user2Participant = createMockParticipants({ userId: user2.id });

const user3Participant = createMockParticipants({ userId: user3.id });

const user4Participant = createMockParticipants({ userId: user4.id });

const groupMeeting = createMockMeeting({
	roomId: groupRoom.id,
	participants: [user1Participant, user2Participant, user3Participant, user4Participant]
});

describe('CinemaMode', () => {
	test('It should display the CinemaMode component', async () => {
		const store = useStore.getState();
		store.addRooms([groupRoom]);
		store.addMeetings([groupMeeting]);
		store.meetingConnection(groupMeeting.id);
		localStorage.setItem(
			'settings',
			JSON.stringify({ 'settings.appearance_setting.scaling': 100 })
		);
		routerContextSetup(<CinemaMode />, { meetingId: groupMeeting.id });
		const cinemaModeView = await screen.findByTestId('cinemaModeView');
		expect(cinemaModeView).toBeInTheDocument();
	});
});
