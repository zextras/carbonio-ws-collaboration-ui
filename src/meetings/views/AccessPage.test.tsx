/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { act, renderHook } from '@testing-library/react';
import { UserEvent } from '@testing-library/user-event';
import * as Shell from '@zextras/carbonio-shell-ui';
import * as ReactRouter from 'react-router-dom';

import AccessPage from './AccessPage';
import {
	mockGoToExternalLoginPage,
	mockGoToMeetingAccessPage
} from '../../hooks/__mocks__/useRouting';
import * as api from '../../network/apis/MeetingsApi';
import useStore from '../../store/Store';
import {
	createMockMeeting,
	createMockParticipants,
	createMockRoom,
	createMockUser
} from '../../tests/createMock';
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

const user1Participant: MeetingParticipant = createMockParticipants({ userId: 'user1' });

const user2Participant: MeetingParticipant = createMockParticipants({ userId: 'user2' });

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
		result.current.setUserInfo([user1, user2, user3]);
		result.current.setLoginInfo({ id: user3.id, name: user3.name });
		result.current.addRooms([groupRoom]);
		result.current.addMeetings([groupMeeting]);
		result.current.setChatsBeStatus(true);
		result.current.setWebsocketStatus(true);
		result.current.meetingConnection(groupMeeting.id);
	});
	const spyUseParams = vi.spyOn(ReactRouter, 'useParams');
	spyUseParams.mockReturnValue({ meetingId: groupMeeting.id });
	const { user } = setup(<AccessPage />);
	return { user, store: result.current };
};

const setupAccessPage = (): { user: UserEvent; store: RootStore } => {
	const { result } = renderHook(() => useStore());
	act(() => {
		result.current.setUserInfo([user2, user3]);
		result.current.setLoginInfo({ id: user2.id, name: user2.name });
		result.current.addRooms([groupForWaitingRoom]);
		result.current.addMeetings([meetingForWaitingRoom]);
		result.current.setChatsBeStatus(true);
		result.current.setWebsocketStatus(true);
		result.current.meetingConnection(groupMeeting.id);
	});
	const spyUseParams = vi.spyOn(ReactRouter, 'useParams');
	spyUseParams.mockReturnValue({ meetingId: groupForWaitingRoom.id });
	const { user } = setup(<AccessPage />);
	return { user, store: result.current };
};

const setupAccessPageNotAuthenticated = (): { user: UserEvent; store: RootStore } => {
	const { result } = renderHook(() => useStore());
	const { user } = setup(<AccessPage />);
	return { user, store: result.current };
};

vi.mock('../../hooks/useRouting');

describe('Meeting access page', () => {
	test('Authenticated user -> access the meeting -> redirect to the waiting room', async () => {
		vi.spyOn(Shell, 'useAuthenticated').mockReturnValue(true);
		setupAccessPage();
		expect(mockGoToMeetingAccessPage).toHaveBeenCalled();
	});

	test('Not authenticated user -> access the meeting -> reach the login external page', async () => {
		const spyOnGetScheduledMeetingName = vi.spyOn(api, 'getScheduledMeetingName');
		const mockUseAuthenticated = vi.spyOn(Shell, 'useAuthenticated').mockReturnValue(false);
		spyOnGetScheduledMeetingName.mockResolvedValueOnce(() => Promise.resolve('name'));
		setupAccessPageNotAuthenticated();

		expect(mockUseAuthenticated).toHaveBeenCalled();
		expect(spyOnGetScheduledMeetingName).toHaveBeenCalled();
		expect(await mockGoToExternalLoginPage).toHaveBeenCalled();
	});

	test('Authenticated user -> joins group meeting -> redirect to the waiting room', async () => {
		vi.spyOn(Shell, 'useAuthenticated').mockReturnValue(true);
		setupGroupForAccessPage();
		expect(mockGoToMeetingAccessPage).toHaveBeenCalled();
	});
});
