/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen } from '@testing-library/react';
import { act } from 'react-dom/test-utils';

import ConversationHeaderMeetingButton from './ConversationHeaderMeetingButton';
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
import { RoomBe } from '../../../types/network/models/roomBeTypes';
import { UserBe } from '../../../types/network/models/userBeTypes';
import { RoomType } from '../../../types/store/RoomTypes';
import { RootStore } from '../../../types/store/StoreTypes';

const user1: UserBe = createMockUser({ id: 'user1Id', name: 'user 1' });
const user2: UserBe = createMockUser({ id: 'user2Id', name: 'user 2' });
const user3: UserBe = createMockUser({ id: 'user3Id', name: 'user 3' });

const room: RoomBe = createMockRoom({
	type: RoomType.GROUP,
	members: [
		createMockMember({ userId: user1.id, owner: true }),
		createMockMember({ userId: user2.id }),
		createMockMember({ userId: user3.id })
	]
});

const meeting: MeetingBe = createMockMeeting({
	roomId: room.id,
	participants: [
		createMockParticipants({ userId: user1.id }),
		createMockParticipants({ userId: user2.id }),
		createMockParticipants({ userId: user3.id })
	]
});

beforeEach(() => {
	const store: RootStore = useStore.getState();
	store.setLoginInfo(user1.id, user1.name);
	store.setUserInfo(user1);
	store.setUserInfo(user2);
	store.setUserInfo(user3);
	store.addRoom(room);
	store.addMeeting(meeting);
	store.startMeeting(meeting.id, '2024-08-25T17:24:28.961+02:00');
	store.meetingConnection(meeting.id, false, undefined, false, undefined);
	useParams.mockReturnValue({ meetingId: meeting.id });
});
describe('ActiveMeetingParticipantsDropdown tests', () => {
	test('ParticipantList title is displayed correctly', async () => {
		setup(<ConversationHeaderMeetingButton roomId={room.id} />);
		const participantsTitle = screen.getByText("3 meeting's participants");
		expect(participantsTitle).toBeInTheDocument();
	});

	test('ParticipantList has correct number of participants', async () => {
		setup(<ConversationHeaderMeetingButton roomId={room.id} />);
		const participants = screen.getAllByTestId('participant_element');
		expect(participants).toHaveLength(3);
	});

	test('Meeting duration is displayed correctly', async () => {
		setup(<ConversationHeaderMeetingButton roomId={room.id} />);
		const meetingDuration = screen.getByTestId('meeting_duration_component');
		expect(meetingDuration).toBeInTheDocument();
	});

	test('Close dropdown when there are no participants', async () => {
		setup(<ConversationHeaderMeetingButton roomId={room.id} />);
		const store: RootStore = useStore.getState();
		act(() => {
			store.removeParticipant(meeting.id, user1.id);
			store.removeParticipant(meeting.id, user2.id);
			store.removeParticipant(meeting.id, user3.id);
		});
		const dropdown = screen.getByTestId('participant_dropdown');
		expect(dropdown).toHaveStyle('opacity: 0');
	});
});
