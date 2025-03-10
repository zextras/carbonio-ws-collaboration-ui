/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { screen } from '@testing-library/react';

import FullScreenButton from './FullScreenButton';
import useStore from '../../../store/Store';
import {
	createMockMeeting,
	createMockMember,
	createMockParticipants,
	createMockRoom,
	createMockUser
} from '../../../tests/createMock';
import { requestFullscreen } from '../../../tests/mocks/global';
import { routerContextSetup, setup } from '../../../tests/test-utils';
import { MeetingBe } from '../../../types/network/models/meetingBeTypes';
import { RoomBe } from '../../../types/network/models/roomBeTypes';
import { UserBe } from '../../../types/network/models/userBeTypes';
import { MeetingViewType } from '../../../types/store/ActiveMeetingTypes';
import { RoomType } from '../../../types/store/RoomTypes';

const user1: UserBe = createMockUser({ id: 'user1Id', name: 'user 1' });
const user2: UserBe = createMockUser({ id: 'user2Id', name: 'user 2' });
const user3: UserBe = createMockUser({ id: 'user3Id', name: 'user 3' });

const room: RoomBe = createMockRoom({
	type: RoomType.GROUP,
	members: [
		createMockMember({ userId: user1.id, owner: true }),
		createMockMember({ userId: user3.id }),
		createMockMember({ userId: user2.id })
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

const fullScreenTestId = 'fullscreen-button';

beforeEach(() => {
	const store = useStore.getState();
	store.setLoginInfo(user1.id, user1.name);
	store.addRoom(room);
	store.addMeeting(meeting);
	store.meetingConnection(meeting.id, false, undefined, false, undefined);
});
describe('Meeting action bar - Fullscreen button interaction', () => {
	test('Check full screen mode is set correctly', async () => {
		const mockRequestFullscreen = jest
			.spyOn(document.documentElement, 'requestFullscreen')
			.mockImplementation(requestFullscreen);
		const { user } = setup(<FullScreenButton />);
		const fullScreenButton = await screen.findByTestId(fullScreenTestId);
		await user.click(fullScreenButton);
		expect(mockRequestFullscreen).toHaveBeenCalledTimes(1);
	});

	test('When full screen mode is enabled in grid view, meeting sidebar will be closed ', async () => {
		useStore.getState().setMeetingViewSelected(meeting.id, MeetingViewType.GRID);
		const { user } = routerContextSetup(<FullScreenButton />, {
			meetingId: meeting.id
		});
		const fullScreenButton = await screen.findByTestId(fullScreenTestId);
		await user.click(fullScreenButton);
		const { sidebarIsOpened } = useStore.getState().activeMeeting[meeting.id].sidebarStatus;
		expect(sidebarIsOpened).toBe(false);
	});

	test('When full screen mode is enabled in cinema view, meeting sidebar and carousel will be closed ', async () => {
		useStore.getState().setMeetingViewSelected(meeting.id, MeetingViewType.CINEMA);
		const { user } = routerContextSetup(<FullScreenButton />, {
			meetingId: meeting.id
		});
		const fullScreenButton = await screen.findByTestId(fullScreenTestId);
		await user.click(fullScreenButton);
		const { sidebarIsOpened } = useStore.getState().activeMeeting[meeting.id].sidebarStatus;
		expect(sidebarIsOpened).toBe(false);
		const { isCarouselVisible } = useStore.getState().activeMeeting[meeting.id];
		expect(isCarouselVisible).toBe(false);
	});
});
