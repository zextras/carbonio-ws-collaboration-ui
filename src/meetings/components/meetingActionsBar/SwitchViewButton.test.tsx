/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { screen, act } from '@testing-library/react';

import SwitchViewButton from './SwitchViewButton';
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
import { MeetingViewType } from '../../../types/store/ActiveMeetingTypes';
import { RoomType } from '../../../types/store/RoomTypes';

const user1 = createMockUser({ id: 'user1Id', name: 'user 1' });
const user2 = createMockUser({ id: 'user2Id', name: 'user 2' });
const user3 = createMockUser({ id: 'user3Id', name: 'user 3' });
const user4 = createMockUser({ id: 'user4Id', name: 'user 4' });

const room: RoomBe = createMockRoom({
	type: RoomType.GROUP,
	members: [
		createMockMember({ userId: user1.id, owner: true }),
		createMockMember({ userId: user2.id }),
		createMockMember({ userId: user3.id }),
		createMockMember({ userId: user4.id })
	]
});

const meeting: MeetingBe = createMockMeeting({
	roomId: room.id,
	participants: [createMockParticipants({ userId: user1.id })]
});

beforeEach(() => {
	const store = useStore.getState();
	store.addRoom(room);
	store.addMeeting(meeting);
	store.meetingConnection(meeting.id, false, undefined, false, undefined);
	useParams.mockReturnValue({ meetingId: meeting.id });
});

describe('SwitchViewButton tests', () => {
	test('SwitchView button is not visible with one or two participants', async () => {
		setup(<SwitchViewButton />);
		expect(screen.queryByRole('button')).not.toBeInTheDocument();

		// Add a second participant
		act(() => {
			useStore.getState().addParticipant(meeting.id, createMockParticipants({ userId: user4.id }));
		});
		expect(screen.queryByRole('button')).not.toBeInTheDocument();
	});

	test('SwitchView button becomes visible with at least three participants', async () => {
		setup(<SwitchViewButton />);
		const store = useStore.getState();
		act(() => {
			store.addParticipant(meeting.id, createMockParticipants({ userId: user2.id }));
			store.addParticipant(meeting.id, createMockParticipants({ userId: user3.id }));
		});
		expect(screen.getByRole('button')).toBeInTheDocument();

		// Add a fourth participant
		act(() => {
			store.addParticipant(meeting.id, createMockParticipants({ userId: user4.id }));
		});
		expect(screen.getByRole('button')).toBeInTheDocument();
	});

	test('SwitchView button toggles between grid and cinema view', async () => {
		const { user } = setup(<SwitchViewButton />);
		const store = useStore.getState();
		act(() => {
			store.addParticipant(meeting.id, createMockParticipants({ userId: user2.id }));
			store.addParticipant(meeting.id, createMockParticipants({ userId: user3.id }));
			store.addParticipant(meeting.id, createMockParticipants({ userId: user4.id }));
		});

		expect(store.activeMeeting[meeting.id].meetingViewSelected).toBe(MeetingViewType.GRID);

		await user.click(screen.getByRole('button'));

		expect(useStore.getState().activeMeeting[meeting.id].meetingViewSelected).toBe(
			MeetingViewType.CINEMA
		);
	});
});
