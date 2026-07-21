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
import { RootStore, STREAM_TYPE, RoomType } from 'wsc-shared';

const user1 = createMockUser({ id: 'user1Id', name: 'user 1' });
const user2 = createMockUser({ id: 'user2Id', name: 'user 2' });
const user3 = createMockUser({ id: 'user3Id', name: 'user 3' });
const user4 = createMockUser({ id: 'user4Id', name: 'user 4' });

const member1 = { userId: user1.id, owner: true };
const member2 = { userId: user2.id, owner: false };
const member3 = { userId: user3.id, owner: true };
const member4 = { userId: user4.id, owner: false };

const room = createMockRoom({
	name: '',
	description: '',
	type: RoomType.GROUP,
	members: [member1, member2, member3, member4]
});

const user1Participant = createMockParticipants({ userId: user1.id });

const user2Participant = createMockParticipants({ userId: user2.id });

const user3Participant = createMockParticipants({ userId: user3.id });

const meeting = createMockMeeting({
	roomId: room.id,
	participants: [user1Participant, user2Participant, user3Participant]
});

const storeSetupGroupMeetingPip = (): { user: UserEvent; store: RootStore } => {
	const store = useStore.getState();
	store.setUserInfo([user1, user2, user3]);
	store.setLoginInfo({ id: user1.id, name: user1.name });
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
