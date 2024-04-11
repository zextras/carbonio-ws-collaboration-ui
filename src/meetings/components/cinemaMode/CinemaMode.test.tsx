/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { screen } from '@testing-library/react';
import { act, renderHook } from '@testing-library/react-hooks';
import { UserEvent } from '@testing-library/user-event';

import CinemaMode from './CinemaMode';
import { useParams } from '../../../../__mocks__/react-router';
import useStore from '../../../store/Store';
import {
	createMockMeeting,
	createMockMember,
	createMockParticipants,
	createMockRoom,
	createMockUser
} from '../../../tests/createMock';
import { setup } from '../../../tests/test-utils';
import { MeetingBe } from '../../../types/network/models/meetingBeTypes';
import { RoomBe, RoomType } from '../../../types/network/models/roomBeTypes';
import { MeetingParticipant } from '../../../types/store/MeetingTypes';
import { RootStore } from '../../../types/store/StoreTypes';

const user1 = createMockUser({ id: 'user1', name: 'User 1' });
const user2 = createMockUser({ id: 'user2', name: 'User 2' });
const user3 = createMockUser({ id: 'user3', name: 'User 3' });
const user4 = createMockUser({ id: 'user4', name: 'User 4' });

const groupRoom: RoomBe = createMockRoom({
	id: 'room-test',
	type: RoomType.GROUP,
	members: [
		createMockMember({ userId: user1.id, owner: true }),
		createMockMember({ userId: user2.id, owner: true })
	],
	userSettings: { muted: false }
});

const user1Participant: MeetingParticipant = createMockParticipants({
	userId: user1.id,
	sessionId: 'sessionIdUser1'
});

const user2Participant: MeetingParticipant = createMockParticipants({
	userId: user2.id,
	sessionId: 'sessionIdUser2'
});

const user3Participant: MeetingParticipant = createMockParticipants({
	userId: user3.id,
	sessionId: 'sessionIdUser3'
});

const user4Participant: MeetingParticipant = createMockParticipants({
	userId: user4.id,
	sessionId: 'sessionIdUser4'
});

const groupMeeting: MeetingBe = createMockMeeting({
	roomId: groupRoom.id,
	participants: [user1Participant, user2Participant, user3Participant, user4Participant]
});

const setupBasicGroupMeeting = (): { user: UserEvent; store: RootStore } => {
	const { result } = renderHook(() => useStore());
	act(() => {
		result.current.addRoom(groupRoom);
		result.current.addMeeting(groupMeeting);
		result.current.meetingConnection(groupMeeting.id, false, undefined, false, undefined);
	});
	useParams.mockReturnValue({ meetingId: groupMeeting.id });
	localStorage.setItem('settings', JSON.stringify({ 'settings.appearance_setting.scaling': 100 }));
	const { user } = setup(<CinemaMode />);
	return { user, store: result.current };
};

describe('CinemaMode', () => {
	test('It should display the CinemaMode component', async () => {
		setupBasicGroupMeeting();
		const cinemaModeView = await screen.findByTestId('cinemaModeView');
		expect(cinemaModeView).toBeInTheDocument();
	});
});
