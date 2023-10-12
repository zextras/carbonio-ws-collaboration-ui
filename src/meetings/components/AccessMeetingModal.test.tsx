/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen } from '@testing-library/react';
import { act, renderHook } from '@testing-library/react-hooks';
import { UserEvent } from '@testing-library/user-event/setup/setup';

import AccessMeetingModal from './AccessMeetingModal';
import {
	mockedEnterMeetingRequest,
	mockedJoinMeetingRequest,
	mockUseParams
} from '../../../jest-mocks';
import useStore from '../../store/Store';
import {
	createMockMeeting,
	createMockParticipants,
	createMockRoom,
	createMockUser
} from '../../tests/createMock';
import { setup } from '../../tests/test-utils';
import { MeetingBe } from '../../types/network/models/meetingBeTypes';
import { MemberBe, RoomBe, RoomType } from '../../types/network/models/roomBeTypes';
import { UserBe } from '../../types/network/models/userBeTypes';
import { MeetingParticipant } from '../../types/store/MeetingTypes';
import { RootStore } from '../../types/store/StoreTypes';

const user1: UserBe = createMockUser({ id: 'user1Id', name: 'user 1' });
const user2: UserBe = createMockUser({ id: 'user2Id', name: 'user 2' });

const member1: MemberBe = { userId: user1.id, owner: true };
const member2: MemberBe = { userId: user2.id, owner: false };

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

const setupBasicGroup = (): { user: UserEvent; store: RootStore } => {
	const { result } = renderHook(() => useStore());
	act(() => {
		result.current.setUserInfo(user1);
		result.current.setUserInfo(user2);
		result.current.setLoginInfo(user1.id, user1.name);
		result.current.addRoom(groupRoom);
		result.current.addMeeting(groupMeeting);
		result.current.setChatsBeStatus(true);
		result.current.setWebsocketStatus(true);
		result.current.meetingConnection(groupMeeting.id, false, undefined, false, undefined);
	});
	mockUseParams.mockReturnValue({ meetingId: groupMeeting.id });
	const { user } = setup(<AccessMeetingModal roomId={groupRoom.id} />);
	return { user, store: result.current };
};

describe('AccessMeetingModal - enter to meeting', () => {
	test('Enter to meeting', async () => {
		mockedEnterMeetingRequest.mockReturnValueOnce('meetingId');

		const { user } = setupBasicGroup();

		// Click on enter button to join the meeting
		const enterButton = await screen.findByText('Enter');
		await user.click(enterButton);

		expect(mockedEnterMeetingRequest).toBeCalled();
	});

	test('Select audio device', async () => {
		mockedJoinMeetingRequest.mockReturnValueOnce(groupMeeting);

		const { user } = setupBasicGroup();

		const audioButtonSelect = await screen.findAllByTestId('icon: ChevronDownOutline');
		await user.click(audioButtonSelect[1]);

		const device = await screen.findByText('Audio Device 2');
		expect(device).toBeInTheDocument();
		// not selected
		expect(device).toHaveStyle('font-weight: 400');

		await user.click(device);
		await user.click(audioButtonSelect[1]);
		const deviceSelected = await screen.findByText('Audio Device 2');
		expect(deviceSelected).toBeInTheDocument();
		// selected
		expect(deviceSelected).toHaveStyle('font-weight: 700');
	});
	test('Select video device', async () => {
		mockedJoinMeetingRequest.mockReturnValueOnce(groupMeeting);

		const { user } = setupBasicGroup();

		const videoButtonSelect = await screen.findAllByTestId('icon: ChevronDownOutline');
		await user.click(videoButtonSelect[0]);

		const device = await screen.findByText('Video Device 2');
		expect(device).toBeInTheDocument();
		// not selected
		expect(device).toHaveStyle('font-weight: 400');

		await user.click(device);
		await user.click(videoButtonSelect[0]);
		const deviceSelected = await screen.findByText('Video Device 2');
		expect(deviceSelected).toBeInTheDocument();
		// selected
		expect(deviceSelected).toHaveStyle('font-weight: 700');
	});
	test('turn on video', async () => {
		mockedJoinMeetingRequest.mockReturnValueOnce(groupMeeting);

		const { user } = setupBasicGroup();

		const videoOff = screen.getByTestId('icon: VideoOff');
		await act(() => user.click(videoOff));
		const videoOn = await screen.findByTestId('icon: Video');
		expect(videoOn).toBeInTheDocument();
	});
	test('turn on audio', async () => {
		mockedJoinMeetingRequest.mockReturnValueOnce(groupMeeting);

		const { user } = setupBasicGroup();

		const audioOff = screen.getByTestId('icon: MicOff');
		await act(() => user.click(audioOff));
		const audioOn = await screen.findByTestId('icon: Mic');
		expect(audioOn).toBeInTheDocument();
	});
});
