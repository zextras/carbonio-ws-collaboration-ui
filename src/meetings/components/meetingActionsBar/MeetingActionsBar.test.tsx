/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { act, screen } from '@testing-library/react';

import MeetingActionsBar from './MeetingActionsBar';
import * as useContainerDimensionsModule from '../../../hooks/useContainerDimensions';
import useStore from '../../../store/Store';
import {
	createMockAttributesList,
	createMockMeeting,
	createMockParticipants,
	createMockRoom,
	createMockUser
} from '../../../tests/createMock';
import { routerContextSetup, setup } from '../../../tests/test-utils';
import { MeetingBe } from '../../../types/network/models/meetingBeTypes';
import { MemberBe, RoomBe, RoomType } from '../../../types/network/models/roomBeTypes';
import { UserBe } from '../../../types/network/models/userBeTypes';
import { MeetingParticipant } from '../../../types/store/MeetingTypes';
import { RootStore } from '../../../types/store/StoreTypes';

const user1: UserBe = createMockUser({ id: 'user1Id', name: 'user 1' });
const user2: UserBe = createMockUser({ id: 'user2Id', name: 'user 2' });
const user3: UserBe = createMockUser({ id: 'user3Id', name: 'user 3' });
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

const streamRef = React.createRef<HTMLDivElement>();

beforeEach(() => {
	const store: RootStore = useStore.getState();
	store.setLoginInfo({ id: user1.id, name: user1.name });
	store.setUserInfo([user1, user2, user3]);
	store.addRooms([room]);
	store.addMeetings([meeting]);
	store.startMeeting(meeting.id, '2024-08-25T17:24:28.961+02:00');
	store.meetingConnection(meeting.id);
	store.setAttributes(createMockAttributesList());
});

describe('Meeting action bar', () => {
	test('everything is rendered correctly', async () => {
		routerContextSetup(<MeetingActionsBar streamsWrapperRef={streamRef} />, {
			meetingId: meeting.id
		});
		const buttons = await screen.findAllByRole('button');
		expect(buttons).toHaveLength(8);
	});

	test('Meeting duration is displayed', async () => {
		routerContextSetup(<MeetingActionsBar streamsWrapperRef={streamRef} />, {
			meetingId: meeting.id
		});
		const meetingDuration = await screen.findByTestId('meeting_duration_component');
		expect(meetingDuration).toBeInTheDocument();
	});

	test('MetingActionBar is not compact by default', async () => {
		routerContextSetup(<MeetingActionsBar streamsWrapperRef={streamRef} />, {
			meetingId: meeting.id
		});
		const meetingActionBar = await screen.findByTestId('meeting-action-bar');
		expect(meetingActionBar).toHaveStyle('padding: 0px 3.25rem 0px 3.25rem');
	});

	test('Leave meeting button is shown in a separate wrapper by default', async () => {
		routerContextSetup(<MeetingActionsBar streamsWrapperRef={streamRef} />, {
			meetingId: meeting.id
		});
		const secondActionsWrapper = await screen.findByTestId('second_actions_wrapper');
		expect(secondActionsWrapper).toBeInTheDocument();
	});

	test('Leave meeting button and ActionsWrapper are different component when window is large', async () => {
		const mockUseContainerDimensions = vi
			.spyOn(useContainerDimensionsModule, 'default')
			.mockReturnValue({ width: 100, height: 0 });
		const { rerender } = setup(<MeetingActionsBar streamsWrapperRef={streamRef} />);
		const secondActionsWrapper = await screen.findByTestId('second_actions_wrapper');
		expect(secondActionsWrapper).toBeInTheDocument();

		mockUseContainerDimensions.mockReturnValueOnce({ width: 99, height: 0 });
		await act(async () => {
			rerender(<MeetingActionsBar streamsWrapperRef={streamRef} />);
		});
		const secondActionsWrapper2 = screen.getByTestId('second_actions_wrapper');
		expect(secondActionsWrapper2).toBeVisible();
	});

	test('Leave meeting button is merged into ActionsWrapper when window is tight', async () => {
		const mockUseContainerDimensions = vi
			.spyOn(useContainerDimensionsModule, 'default')
			.mockReturnValue({ width: 5, height: 0 });
		const { rerender } = setup(<MeetingActionsBar streamsWrapperRef={streamRef} />);
		const mainActionsWrapper = screen.getByTestId('main_actions_wrapper');
		const secondActionsWrapper = await screen.findByTestId('second_actions_wrapper');
		expect(secondActionsWrapper).toBeInTheDocument();
		vi.spyOn(mainActionsWrapper, 'getBoundingClientRect').mockImplementation(
			() => ({ width: 30 }) as DOMRect
		);
		vi.spyOn(secondActionsWrapper, 'getBoundingClientRect').mockImplementation(
			() => ({ width: 20 }) as DOMRect
		);
		mockUseContainerDimensions.mockReturnValueOnce({ width: 49, height: 0 });
		await act(async () => {
			rerender(<MeetingActionsBar streamsWrapperRef={streamRef} />);
		});

		const secondActionsWrapper2 = screen.getByTestId('second_actions_wrapper');
		expect(secondActionsWrapper2).not.toBeVisible();
	});
});
