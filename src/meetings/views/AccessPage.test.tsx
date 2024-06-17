/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { renderHook } from '@testing-library/react-hooks';
import { UserEvent } from '@testing-library/user-event';
import { act } from 'react-dom/test-utils';

import AccessPage from './AccessPage';
import { mockUseAuthenticated } from '../../../__mocks__/@zextras/carbonio-shell-ui';
import { useParams } from '../../../__mocks__/react-router';
import useStore from '../../store/Store';
import {
	createMockMeeting,
	createMockParticipants,
	createMockRoom,
	createMockUser
} from '../../tests/createMock';
import { mockedGetMeetingRequest, mockedGetScheduledMeetingName } from '../../tests/mocks/network';
import { mockGoToExternalLoginPage, mockGoToMeetingAccessPage } from '../../tests/mocks/useRouting';
import { setup } from '../../tests/test-utils';
import { MeetingBe, MeetingType } from '../../types/network/models/meetingBeTypes';
import { MemberBe, RoomBe } from '../../types/network/models/roomBeTypes';
import { UserBe } from '../../types/network/models/userBeTypes';
import { MeetingParticipant } from '../../types/store/MeetingTypes';
import { RoomType } from '../../types/store/RoomTypes';
import { RootStore } from '../../types/store/StoreTypes';

const user1: UserBe = createMockUser({ id: 'user1Id', name: 'user 1' });
const user2: UserBe = createMockUser({ id: 'user2Id', name: 'user 2' });
const user3: UserBe = createMockUser({ id: 'user3Id', name: 'user 3' });

const member1: MemberBe = { userId: user1.id, owner: true };
const member2: MemberBe = { userId: user2.id, owner: false };
const member3: MemberBe = { userId: user3.id, owner: true };

const groupRoom: RoomBe = createMockRoom({
	id: 'room-test',
	type: RoomType.GROUP,
	members: [member1, member2],
	userSettings: { muted: false }
});

const user1Participant: MeetingParticipant = createMockParticipants({
	userId: 'user1',
	sessionId: 'sessionIdUser1'
});

const user2Participant: MeetingParticipant = createMockParticipants({
	userId: 'user2',
	sessionId: 'sessionIdUser2'
});

const groupMeeting: MeetingBe = createMockMeeting({
	roomId: groupRoom.id,
	participants: [user1Participant, user2Participant]
});

const groupForWaitingRoom: RoomBe = createMockRoom({
	id: 'room-test',
	type: RoomType.TEMPORARY,
	members: [member3]
});

const meetingForWaitingRoom: MeetingBe = createMockMeeting({
	roomId: groupForWaitingRoom.id,
	meetingType: MeetingType.SCHEDULED
});

const setupGroupForAccessPage = (): { user: UserEvent; store: RootStore } => {
	const { result } = renderHook(() => useStore());
	act(() => {
		result.current.setUserInfo(user1);
		result.current.setUserInfo(user2);
		result.current.setLoginInfo(user3.id, user3.name);
		result.current.addRoom(groupRoom);
		result.current.addMeeting(groupMeeting);
		result.current.setChatsBeStatus(true);
		result.current.setWebsocketStatus(true);
		result.current.meetingConnection(groupMeeting.id, false, undefined, false, undefined);
	});
	useParams.mockReturnValue({ meetingId: groupMeeting.id });
	const { user } = setup(<AccessPage />);
	return { user, store: result.current };
};

const setupAccessPage = (): { user: UserEvent; store: RootStore } => {
	const { result } = renderHook(() => useStore());
	act(() => {
		result.current.setUserInfo(user3);
		result.current.setUserInfo(user2);
		result.current.setLoginInfo(user2.id, user2.name);
		result.current.addRoom(groupForWaitingRoom);
		result.current.addMeeting(meetingForWaitingRoom);
		result.current.setChatsBeStatus(true);
		result.current.setWebsocketStatus(true);
		result.current.meetingConnection(groupMeeting.id, false, undefined, false, undefined);
	});
	useParams.mockReturnValue({ meetingId: groupForWaitingRoom.id });
	const { user } = setup(<AccessPage />);
	return { user, store: result.current };
};

const setupAccessPageNotAuthenticated = (): { user: UserEvent; store: RootStore } => {
	const { result } = renderHook(() => useStore());
	const { user } = setup(<AccessPage />);
	return { user, store: result.current };
};

describe('Meeting access page', () => {
	test('Authenticated user -> access the meeting -> redirect to the waiting room', async () => {
		mockUseAuthenticated.mockReturnValue(true);
		setupAccessPage();
		expect(mockGoToMeetingAccessPage).toHaveBeenCalled();
	});

	test('Not authenticated user -> access the meeting -> reach the login external page', async () => {
		mockUseAuthenticated.mockReturnValue(false);
		mockedGetScheduledMeetingName.mockReturnValueOnce('name');
		setupAccessPageNotAuthenticated();

		expect(mockUseAuthenticated).toHaveBeenCalled();
		expect(mockedGetScheduledMeetingName).toHaveBeenCalled();
		expect(await mockGoToExternalLoginPage).toHaveBeenCalled();
	});

	test('Authenticated user -> joins group meeting -> redirect to the waiting room', async () => {
		mockUseAuthenticated.mockReturnValueOnce(true);
		mockedGetMeetingRequest.mockReturnValueOnce('meeting');
		setupGroupForAccessPage();
		expect(mockGoToMeetingAccessPage).toHaveBeenCalled();
	});
});
