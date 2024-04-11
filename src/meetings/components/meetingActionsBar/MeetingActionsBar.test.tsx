/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen, waitFor } from '@testing-library/react';

import MeetingActionsBar from './MeetingActionsBar';
import { useParams } from '../../../../__mocks__/react-router';
import useStore from '../../../store/Store';
import {
	createMockMeeting,
	createMockParticipants,
	createMockRoom,
	createMockUser
} from '../../../tests/createMock';
import { setup } from '../../../tests/test-utils';
import { MeetingBe } from '../../../types/network/models/meetingBeTypes';
import { MemberBe, RoomBe, RoomType } from '../../../types/network/models/roomBeTypes';
import { UserBe } from '../../../types/network/models/userBeTypes';
import { MeetingParticipant } from '../../../types/store/MeetingTypes';
import { RootStore } from '../../../types/store/StoreTypes';
import MeetingSkeleton from '../../views/MeetingSkeleton';

const user1: UserBe = createMockUser({ id: 'user1Id', name: 'user 1' });
const user2: UserBe = createMockUser({ id: 'user2Id', name: 'user 2' });
const user3: UserBe = createMockUser({
	id: 'user3Id',
	name: 'user 3',
	pictureUpdatedAt: '2022-08-25T17:24:28.961+02:00'
});
const member1: MemberBe = { userId: user1.id, owner: true };
const member2: MemberBe = { userId: user2.id, owner: false };
const member3: MemberBe = { userId: user3.id, owner: true };

const room: RoomBe = createMockRoom({
	name: '',
	description: '',
	type: RoomType.GROUP,
	members: [member1, member2, member3]
});

const user1Participant: MeetingParticipant = createMockParticipants({
	userId: user1.id,
	sessionId: 'sessionIdUser1'
});
const user3Participant: MeetingParticipant = createMockParticipants({
	userId: user3.id,
	sessionId: 'sessionIdUser3'
});
const user2Participant: MeetingParticipant = createMockParticipants({
	userId: user2.id,
	sessionId: 'sessionIdUser2'
});
const meeting: MeetingBe = createMockMeeting({
	roomId: room.id,
	participants: [user1Participant, user2Participant, user3Participant]
});

const streamRef = React.createRef<HTMLDivElement>();

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
describe('Meeting action bar', () => {
	test('everything is rendered correctly', async () => {
		setup(<MeetingActionsBar streamsWrapperRef={streamRef} />);
		const buttons = await screen.findAllByRole('button');
		expect(buttons).toHaveLength(8);
	});

	test('Meeting duration is displayed', async () => {
		setup(<MeetingActionsBar streamsWrapperRef={streamRef} />);
		const meetingDuration = await screen.findByTestId('meeting_duration_component');
		expect(meetingDuration).toBeInTheDocument();
	});
});

describe('Meeting action bar interaction with skeleton', () => {
	test('hover on different elements of the skeleton makes action bar appear and disappear', async () => {
		const { user } = setup(<MeetingSkeleton />);
		const meetingActionBar = await screen.findByTestId('meeting-action-bar');
		await waitFor(() => user.hover(screen.getByTestId('meeting_sidebar')));
		expect(meetingActionBar).toHaveStyle('transform: translateY( 5rem )');
		await waitFor(() => user.hover(screen.getByTestId('meeting_view_container')));
		expect(meetingActionBar).toHaveStyle('transform: translateY( -1rem )');
	});
});
