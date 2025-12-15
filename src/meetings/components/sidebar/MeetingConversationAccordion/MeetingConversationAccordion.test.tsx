/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen, waitFor, act, renderHook } from '@testing-library/react';
import { UserEvent } from '@testing-library/user-event';

import { mockDarkReaderIsEnabled } from '../../../../../__mocks__/darkreader';
import useStore from '../../../../store/Store';
import {
	createMockAttributesList,
	createMockMeeting,
	createMockMember,
	createMockParticipants,
	createMockRoom,
	createMockUser
} from '../../../../tests/createMock';
import { routerContextSetup } from '../../../../tests/test-utils';
import { MeetingBe } from '../../../../types/network/models/meetingBeTypes';
import { RoomBe, RoomType } from '../../../../types/network/models/roomBeTypes';
import { MeetingParticipant } from '../../../../types/store/MeetingTypes';
import { RootStore } from '../../../../types/store/StoreTypes';
import MeetingSidebar from '../MeetingSidebar';

const heightRem = 'height: 2.75rem';
const heightPercentage = 'height: 100%';

const mockUser1 = createMockUser({
	id: 'user1',
	name: 'User 1'
});

const mockUser2 = createMockUser({
	id: 'user2',
	name: 'User 2'
});

const mockUser3 = createMockUser({
	id: 'user3',
	name: 'User 3'
});

const groupRoom: RoomBe = createMockRoom({
	id: 'room-test',
	type: RoomType.GROUP,
	members: [
		createMockMember({ userId: mockUser1.id, owner: true }),
		createMockMember({ userId: mockUser2.id, owner: true }),
		createMockMember({ userId: mockUser3.id, owner: true })
	],
	userSettings: { muted: false }
});

const user1Participant: MeetingParticipant = createMockParticipants({ userId: mockUser1.id });

const groupMeeting: MeetingBe = createMockMeeting({
	roomId: groupRoom.id,
	participants: [user1Participant]
});

const setupBasicGroup = (): { user: UserEvent; store: RootStore } => {
	const { result } = renderHook(() => useStore());
	act(() => {
		result.current.setAttributes(createMockAttributesList({ carbonioWscVideoCallEnabled: 'TRUE' }));
		result.current.setLoginInfo(mockUser1.id, mockUser1.name);
		result.current.setUserInfo([mockUser2]);
		result.current.addRooms([groupRoom]);
		result.current.addMeetings([groupMeeting]);
		result.current.meetingConnection(groupMeeting.id);
	});
	const { user } = routerContextSetup(<MeetingSidebar />, { meetingId: groupMeeting.id });
	return { user, store: result.current };
};

describe('Meeting sidebar', () => {
	test('close - open chat accordion', async () => {
		const { user } = setupBasicGroup();
		const toggleChatExpanded = screen.queryByTestId('toggleChatExpanded');
		expect(toggleChatExpanded).toBeInTheDocument();
		const toggleChatBtn = screen.getByTestId('toggleChatStatus');
		await user.click(toggleChatBtn);
		const chatAccordion = await screen.findByTestId('MeetingConversationAccordion');
		expect(chatAccordion).toHaveStyle(heightRem);
		await waitFor(() => user.click(toggleChatBtn));
		expect(chatAccordion).toHaveStyle(heightPercentage);
		const composer = await screen.findByTestId('textAreaComposer');
		expect(composer).toBeInTheDocument();
	});
	test('open - expand - collapse chat accordion', async () => {
		const { user } = setupBasicGroup();
		const toggleChatExpanded = screen.getByTestId('toggleChatExpanded');
		await waitFor(() => user.click(toggleChatExpanded));
		const chatAccordion = await screen.findByTestId('MeetingConversationAccordion');
		expect(chatAccordion).toHaveStyle(heightPercentage);
		await waitFor(() => user.click(toggleChatExpanded));
		expect(chatAccordion).toHaveStyle(heightPercentage);
	});
	test('open - expand - close chat accordion', async () => {
		const { user } = setupBasicGroup();
		const toggleChatBtn = screen.getByTestId('toggleChatStatus');
		const toggleChatExpanded = screen.getByTestId('toggleChatExpanded');
		await waitFor(() => user.click(toggleChatExpanded));
		const chatAccordion = await screen.findByTestId('MeetingConversationAccordion');
		expect(chatAccordion).toHaveStyle(heightPercentage);
		await waitFor(() => user.click(toggleChatBtn));
		expect(toggleChatBtn).toHaveStyle('height: fit');
	});
	test('Display meeting chat with darkMode disabled', async () => {
		mockDarkReaderIsEnabled.mockReturnValueOnce(false);
		setupBasicGroup();
		const wrapperMeetingChat = screen.getByTestId('WrapperMeetingChat');
		expect(wrapperMeetingChat).toHaveStyle(`background-image: url('papyrus.png')`);
	});
	test('Display meeting chat with darkMode enabled', async () => {
		mockDarkReaderIsEnabled.mockReturnValueOnce(true);
		setupBasicGroup();
		const wrapperMeetingChat = screen.getByTestId('WrapperMeetingChat');
		expect(wrapperMeetingChat).toHaveStyle(`background-image: url('papyrus-dark.png')`);
	});

	test('title of the accordion changes when a user is writing', async () => {
		const { store } = setupBasicGroup();
		expect(screen.getByText(`Chat - ${groupRoom.name}`)).toBeInTheDocument();

		act(() => {
			store.setIsWriting(groupRoom.id, mockUser2.id, true);
		});

		expect(await screen.findByText(/User is typing.../i)).toBeInTheDocument();
		expect(screen.queryByText(`Chat - ${groupRoom.name}`)).not.toBeInTheDocument();

		act(() => {
			store.setIsWriting(groupRoom.id, mockUser2.id, false);
			vi.advanceTimersByTime(4000);
		});

		expect(screen.queryByText(/User is typing.../i)).not.toBeInTheDocument();
		expect(await screen.findByText(`Chat - ${groupRoom.name}`)).toBeInTheDocument();
	});
	test('title of the accordion when two or more users are typing', async () => {
		const { store } = setupBasicGroup();

		act(() => {
			store.setIsWriting(groupRoom.id, mockUser2.id, true);
			store.setIsWriting(groupRoom.id, mockUser3.id, true);
		});

		expect(await screen.findByText(/2 people are typing.../i)).toBeInTheDocument();

		act(() => {
			store.setIsWriting(groupRoom.id, mockUser2.id, false);
			store.setIsWriting(groupRoom.id, mockUser3.id, false);
			vi.advanceTimersByTime(4000);
		});

		expect(screen.queryByText(/2 people are typing.../i)).not.toBeInTheDocument();
	});
});
