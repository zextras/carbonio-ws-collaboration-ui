/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { screen, waitFor } from '@testing-library/react';
import { act, renderHook } from '@testing-library/react-hooks';
import { UserEvent } from '@testing-library/user-event/setup/setup';

import MeetingSkeleton from './MeetingSkeleton';
import { useParams } from '../../../__mocks__/react-router';
import useStore from '../../store/Store';
import {
	createMockMeeting,
	createMockParticipants,
	createMockRoom,
	createMockUser
} from '../../tests/createMock';
import { setup } from '../../tests/test-utils';
import { MeetingBe } from '../../types/network/models/meetingBeTypes';
import { MemberBe, RoomBe } from '../../types/network/models/roomBeTypes';
import { UserBe } from '../../types/network/models/userBeTypes';
import { MeetingParticipant } from '../../types/store/MeetingTypes';
import { RoomType } from '../../types/store/RoomTypes';

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

const storeSetupGroupMeetingSkeleton = (): { user: UserEvent } => {
	const { result } = renderHook(() => useStore());
	act(() => {
		result.current.setUserInfo(user1);
		result.current.setUserInfo(user2);
		result.current.setUserInfo(user3);
		result.current.setLoginInfo(user1.id, user1.name);
		result.current.addRoom(room);
		result.current.addMeeting(meeting);
		result.current.meetingConnection(meeting.id, false, undefined, false, undefined);
	});
	useParams.mockReturnValue({ meetingId: meeting.id });
	const { user } = setup(<MeetingSkeleton />);

	return { user };
};

test('Enable full screen and sidebar must be closed', async () => {
	const { user } = storeSetupGroupMeetingSkeleton();
	await waitFor(() => user.hover(screen.getByTestId('meeting-action-bar')));
	const fullScreenButton = await screen.findByTestId('fullscreen-button');
	await waitFor(() => {
		act(() => {
			user.click(fullScreenButton);
		});
	});
	const meetingSidebar = screen.queryByTestId('meeting_sidebar');
	expect(meetingSidebar).toHaveStyle('width: 0');
});
