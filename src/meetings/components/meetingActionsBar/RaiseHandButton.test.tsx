/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { act, screen } from '@testing-library/react';
import { UserEvent } from '@testing-library/user-event';
import * as ReactRouter from 'react-router';

import RaiseHandButton from './RaiseHandButton';
import useStore from '../../../store/Store';
import {
	createMockMeeting,
	createMockParticipants,
	createMockRoom,
	createMockUser
} from '../../../tests/createMock';
import { MeetingsApiToSpy, spyOnMeetingsApi } from '../../../tests/mocks/network';
import { setup } from '../../../tests/test-utils';
import { MeetingBe } from '../../../types/network/models/meetingBeTypes';
import { MemberBe, RoomBe } from '../../../types/network/models/roomBeTypes';
import { UserBe } from '../../../types/network/models/userBeTypes';
import { MeetingParticipant } from '../../../types/store/MeetingTypes';
import { RoomType } from '../../../types/store/RoomTypes';
import { RootStore } from '../../../types/store/StoreTypes';

const user1: UserBe = createMockUser({ id: 'user1Id', name: 'user 1' });
const user2: UserBe = createMockUser({ id: 'user2Id', name: 'user 2' });
const user3: UserBe = createMockUser({
	id: 'user3Id',
	name: 'user 3'
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

const user1Participant: MeetingParticipant = createMockParticipants({ userId: user1.id });

const user3Participant: MeetingParticipant = createMockParticipants({ userId: user3.id });

const user2Participant: MeetingParticipant = createMockParticipants({ userId: user2.id });

const meeting: MeetingBe = createMockMeeting({
	roomId: room.id,
	participants: [user1Participant, user2Participant, user3Participant]
});

const storeSetupGroupMeeting = (): { user: UserEvent; store: RootStore } => {
	const store = useStore.getState();
	act(() => {
		store.setUserInfo(user1);
		store.setUserInfo(user2);
		store.setUserInfo(user3);
		store.setLoginInfo(user1.id, user1.name);
		store.addRoom(room);
		store.addMeeting(meeting);
		store.meetingConnection(meeting.id, false, undefined, false, undefined);
	});
	const spyUseParams = jest.spyOn(ReactRouter, 'useParams');
	spyUseParams.mockReturnValue({ meetingId: meeting.id });
	const { user } = setup(<RaiseHandButton />);

	return { user, store };
};

describe('Raise hand button', () => {
	test('User Raise Hand', async () => {
		const spyOnRaiseHand = spyOnMeetingsApi(MeetingsApiToSpy.RAISE_HAND);

		const { user } = storeSetupGroupMeeting();

		expect(useStore.getState().activeMeeting[meeting.id].usersWithHandRaised).toStrictEqual([]);

		const handButton = await screen.findByTestId('icon: HandOutline');
		await user.click(handButton);

		expect(spyOnRaiseHand).toHaveBeenCalled();
	});
});
