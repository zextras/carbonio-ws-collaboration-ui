/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { screen } from '@testing-library/react';

import WhoIsSpeaking from './WhoIsSpeaking';
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
import { MeetingViewType, STREAM_TYPE, TileData } from '../../../types/store/ActiveMeetingTypes';
import { MeetingParticipant } from '../../../types/store/MeetingTypes';
import { RootStore } from '../../../types/store/StoreTypes';

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

const centralTileVideo: TileData = {
	userId: user1.id,
	type: STREAM_TYPE.VIDEO
};

const centralTileScreen: TileData = {
	userId: user1.id,
	type: STREAM_TYPE.SCREEN
};

const setupActiveMeeting = (): void => {
	const store: RootStore = useStore.getState();
	store.setUserInfo(user1);
	store.setUserInfo(user2);
	store.setUserInfo(user3);
	store.setLoginInfo(user1.id, user1.name);
	store.addRoom(room);
	store.addMeeting(meeting);
	store.meetingConnection(meeting.id, false, undefined, false, undefined);
	store.setMeetingViewSelected(meeting.id, MeetingViewType.CINEMA);
	store.setIsCarouseVisible(meeting.id, false);
	store.setTalkingUser(meeting.id, user3.id, true);
	store.setTalkingUser(meeting.id, user2.id, true);
	store.setTalkingUser(meeting.id, user1.id, true);
};

describe('Who is speaking', () => {
	it('has to be rendered correctly - central tile is a video', () => {
		useParams.mockReturnValue({ meetingId: meeting.id });
		setupActiveMeeting();
		setup(<WhoIsSpeaking centralTile={centralTileVideo} />);

		expect(screen.getByText(user3.name)).toBeVisible();
		expect(screen.getByText(user2.name)).toBeVisible();
	});

	it('has to be rendered correctly - central tile is a screen', () => {
		useParams.mockReturnValue({ meetingId: meeting.id });
		setupActiveMeeting();
		setup(<WhoIsSpeaking centralTile={centralTileScreen} />);

		expect(screen.getByText(user1.name)).toBeVisible();
		expect(screen.getByText(user3.name)).toBeVisible();
		expect(screen.getByText(user2.name)).toBeVisible();
	});
});
