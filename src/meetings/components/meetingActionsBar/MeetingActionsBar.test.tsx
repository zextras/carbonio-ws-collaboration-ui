/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen } from '@testing-library/react';

import MeetingActionsBar from './MeetingActionsBar';
import { useParams } from '../../../../__mocks__/react-router';
import useStore from '../../../store/Store';
import {
	createMockCapabilityList,
	createMockMeeting,
	createMockParticipants,
	createMockRoom,
	createMockUser
} from '../../../tests/createMock';
import { mockMediaDevicesResolve } from '../../../tests/mocks/global';
import { setup } from '../../../tests/test-utils';
import { MeetingBe } from '../../../types/network/models/meetingBeTypes';
import { MemberBe, RoomBe, RoomType } from '../../../types/network/models/roomBeTypes';
import { UserBe } from '../../../types/network/models/userBeTypes';
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

const streamRef = React.createRef<HTMLDivElement>();

const mockUseContainerDimensions = jest.fn(() => ({ width: 100 }));
jest.mock('../../../hooks/useContainerDimensions', () => ({
	__esModule: true,
	default: (): { width: number } => mockUseContainerDimensions()
}));

beforeAll(() => {
	mockMediaDevicesResolve();
});

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
	store.setCapabilities(createMockCapabilityList());
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

	test('MetingActionBar is not compact by default', async () => {
		setup(<MeetingActionsBar streamsWrapperRef={streamRef} />);
		const meetingActionBar = await screen.findByTestId('meeting-action-bar');
		expect(meetingActionBar).toHaveStyle('padding: 0px 3.25rem 0px 3.25rem');
	});

	test('Leave meeting button is shown in a separate wrapper by default', async () => {
		setup(<MeetingActionsBar streamsWrapperRef={streamRef} />);
		const secondActionsWrapper = await screen.findByTestId('second_actions_wrapper');
		expect(secondActionsWrapper).toBeInTheDocument();
	});

	test('Leave meeting button and ActionsWrapper are different component when window is large', async () => {
		mockUseContainerDimensions.mockReturnValue({ width: 100 });
		const { rerender } = setup(<MeetingActionsBar streamsWrapperRef={streamRef} />);
		const mainActionsWrapper = screen.getByTestId('main_actions_wrapper');
		const secondActionsWrapper = await screen.findByTestId('second_actions_wrapper');
		expect(secondActionsWrapper).toBeInTheDocument();
		jest
			.spyOn(mainActionsWrapper, 'getBoundingClientRect')
			.mockImplementation(() => ({ width: 30 }) as DOMRect);
		jest
			.spyOn(secondActionsWrapper, 'getBoundingClientRect')
			.mockImplementation(() => ({ width: 20 }) as DOMRect);
		mockUseContainerDimensions.mockReturnValueOnce({ width: 99 });
		rerender(<MeetingActionsBar streamsWrapperRef={streamRef} />);

		const secondActionsWrapper2 = screen.getByTestId('second_actions_wrapper');
		expect(secondActionsWrapper2).toBeVisible();
	});

	test('Leave meeting button is merged into ActionsWrapper when window is tight', async () => {
		mockUseContainerDimensions.mockReturnValue({ width: 50 });
		const { rerender } = setup(<MeetingActionsBar streamsWrapperRef={streamRef} />);
		const mainActionsWrapper = screen.getByTestId('main_actions_wrapper');
		const secondActionsWrapper = await screen.findByTestId('second_actions_wrapper');
		expect(secondActionsWrapper).toBeInTheDocument();
		jest
			.spyOn(mainActionsWrapper, 'getBoundingClientRect')
			.mockImplementation(() => ({ width: 30 }) as DOMRect);
		jest
			.spyOn(secondActionsWrapper, 'getBoundingClientRect')
			.mockImplementation(() => ({ width: 20 }) as DOMRect);
		mockUseContainerDimensions.mockReturnValueOnce({ width: 49 });
		rerender(<MeetingActionsBar streamsWrapperRef={streamRef} />);

		const secondActionsWrapper2 = screen.getByTestId('second_actions_wrapper');
		expect(secondActionsWrapper2).not.toBeVisible();
	});
});
