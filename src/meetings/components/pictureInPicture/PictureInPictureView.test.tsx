/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { act, screen } from '@testing-library/react';
import { UserEvent } from '@testing-library/user-event';

import PictureInPictureView from './PictureInPictureView';
import useStore from '../../../store/Store';
import {
	createMockAttributesList,
	createMockMeeting,
	createMockParticipants,
	createMockRoom,
	createMockUser
} from '../../../tests/createMock';
import { routerContextSetup } from '../../../tests/test-utils';
import { MeetingBe } from '../../../types/network/models/meetingBeTypes';
import { MemberBe, RoomBe } from '../../../types/network/models/roomBeTypes';
import { UserBe } from '../../../types/network/models/userBeTypes';
import { STREAM_TYPE } from '../../../types/store/ActiveMeetingTypes';
import { MeetingParticipant } from '../../../types/store/MeetingTypes';
import { RoomType } from '../../../types/store/RoomTypes';
import { RootStore } from '../../../types/store/StoreTypes';

const user1: UserBe = createMockUser({ id: 'user1Id', name: 'user 1' });
const user2: UserBe = createMockUser({ id: 'user2Id', name: 'user 2' });
const user3: UserBe = createMockUser({ id: 'user3Id', name: 'user 3' });
const user4: UserBe = createMockUser({ id: 'user4Id', name: 'user 4' });

const member1: MemberBe = { userId: user1.id, owner: true };
const member2: MemberBe = { userId: user2.id, owner: false };
const member3: MemberBe = { userId: user3.id, owner: true };
const member4: MemberBe = { userId: user4.id, owner: false };

const room: RoomBe = createMockRoom({
	name: '',
	description: '',
	type: RoomType.GROUP,
	members: [member1, member2, member3, member4]
});

const user1Participant: MeetingParticipant = createMockParticipants({ userId: user1.id });

const user2Participant: MeetingParticipant = createMockParticipants({ userId: user2.id });

const user3Participant: MeetingParticipant = createMockParticipants({ userId: user3.id });

const meeting: MeetingBe = createMockMeeting({
	roomId: room.id,
	participants: [user1Participant, user2Participant, user3Participant]
});

const storeSetupGroupMeetingPip = (): { user: UserEvent; store: RootStore } => {
	const store = useStore.getState();
	store.setUserInfo([user1, user2, user3]);
	store.setLoginInfo(user1.id, user1.name);
	store.addRooms([room]);
	store.addMeetings([meeting]);
	store.meetingConnection(meeting.id);
	store.setLocalStreams(STREAM_TYPE.VIDEO, new MediaStream());
	store.setAttributes(createMockAttributesList());
	store.setTalkingUser(user2.id, true);
	const { user } = routerContextSetup(<PictureInPictureView />, { meetingId: meeting.id });

	return { user, store };
};

describe('PictureInPictureView', () => {
	test('should render without crashing', async () => {
		await act(async () => {
			storeSetupGroupMeetingPip();
		});
		expect(screen.getByText('user 2 is speaking.')).toBeInTheDocument();
		const cameraButton = screen.getByTestId('icon: VideoOff');
		expect(cameraButton).toBeInTheDocument();
		const micOff = screen.getByTestId('icon: MicOffOutline');
		expect(micOff).toBeInTheDocument();
		const logoutButton = screen.getByTestId('icon: LogOutOutline');
		expect(logoutButton).toBeInTheDocument();
	});
});
