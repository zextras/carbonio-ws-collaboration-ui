/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { screen } from '@testing-library/react';
import * as ReactRouter from 'react-router';

import WhoIsSpeaking from './WhoIsSpeaking';
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
import { STREAM_TYPE, TileData } from '../../../types/store/ActiveMeetingTypes';
import { RootStore } from '../../../types/store/StoreTypes';

const user1: UserBe = createMockUser({ id: 'user1Id', name: 'user 1' });
const user2: UserBe = createMockUser({ id: 'user2Id', name: 'user 2' });
const user3: UserBe = createMockUser({ id: 'user3Id', name: 'user 3' });

const room: RoomBe = createMockRoom({
	members: [
		createMockMember({ userId: user1.id }),
		createMockMember({ userId: user2.id }),
		createMockMember({ userId: user3.id })
	]
});

const meeting: MeetingBe = createMockMeeting({
	roomId: room.id,
	participants: [
		createMockParticipants({ userId: user1.id }),
		createMockParticipants({ userId: user3.id }),
		createMockParticipants({ userId: user2.id })
	]
});

const centralTileVideo: TileData = {
	userId: user3.id,
	type: STREAM_TYPE.VIDEO
};

const centralTileScreen: TileData = {
	userId: user3.id,
	type: STREAM_TYPE.SCREEN
};

beforeEach(() => {
	const store: RootStore = useStore.getState();
	store.setUserInfo(user1);
	store.setUserInfo(user2);
	store.setUserInfo(user3);
	store.setLoginInfo(user1.id, user1.name);
	store.addRoom(room);
	store.addMeeting(meeting);
	store.meetingConnection(meeting.id, false, undefined, false, undefined);
	store.setTalkingUser(meeting.id, user3.id, true);
	store.setTalkingUser(meeting.id, user2.id, true);
	store.setTalkingUser(meeting.id, user1.id, true);
});

describe('Who is speaking', () => {
	test('Talking user in central tile is not displayed if the central tile is his video', () => {
		const spyUseParams = jest.spyOn(ReactRouter, 'useParams');
		spyUseParams.mockReturnValue({ meetingId: meeting.id });
		setup(<WhoIsSpeaking centralTile={centralTileVideo} />);

		expect(screen.getByText(user2.name)).toBeInTheDocument();
		expect(screen.queryByText(user3.name)).not.toBeInTheDocument();
	});

	test('Talking user in central tile is displayed if the central tile is his screen', () => {
		const spyUseParams = jest.spyOn(ReactRouter, 'useParams');
		spyUseParams.mockReturnValue({ meetingId: meeting.id });
		setup(<WhoIsSpeaking centralTile={centralTileScreen} />);

		expect(screen.getByText(user2.name)).toBeInTheDocument();
		expect(screen.getByText(user3.name)).toBeInTheDocument();
	});

	test('Talking logged user is not displayed', () => {
		const spyUseParams = jest.spyOn(ReactRouter, 'useParams');
		spyUseParams.mockReturnValue({ meetingId: meeting.id });
		setup(<WhoIsSpeaking centralTile={centralTileScreen} />);

		expect(screen.queryByText(user1.name)).not.toBeInTheDocument();
		expect(screen.getByText(user2.name)).toBeInTheDocument();
		expect(screen.getByText(user3.name)).toBeInTheDocument();
	});
});
