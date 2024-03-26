/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen, waitFor } from '@testing-library/react';
import { act, renderHook } from '@testing-library/react-hooks';
import { UserEvent } from '@testing-library/user-event';

import { mockDarkReaderIsEnabled } from '../../../../../__mocks__/darkreader';
import { useParams } from '../../../../../__mocks__/react-router';
import useStore from '../../../../store/Store';
import {
	createMockMeeting,
	createMockMember,
	createMockParticipants,
	createMockRoom,
	createMockUser
} from '../../../../tests/createMock';
import { setup } from '../../../../tests/test-utils';
import { MeetingBe } from '../../../../types/network/models/meetingBeTypes';
import { RoomBe, RoomType } from '../../../../types/network/models/roomBeTypes';
import { MeetingParticipant } from '../../../../types/store/MeetingTypes';
import { RootStore } from '../../../../types/store/StoreTypes';
import MeetingSidebar from '../MeetingSidebar';

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

const user1Participant: MeetingParticipant = createMockParticipants({
	userId: mockUser1.id,
	sessionId: 'sessionIdUser1'
});

const groupMeeting: MeetingBe = createMockMeeting({
	roomId: groupRoom.id,
	participants: [user1Participant]
});

const setupBasicGroup = (): { user: UserEvent; store: RootStore } => {
	const { result } = renderHook(() => useStore());
	act(() => {
		result.current.setLoginInfo(mockUser1.id, mockUser1.name);
		result.current.setUserInfo(mockUser2);
		result.current.addRoom(groupRoom);
		result.current.addMeeting(groupMeeting);
		result.current.meetingConnection(groupMeeting.id, false, undefined, false, undefined);
	});
	useParams.mockReturnValue({ meetingId: groupMeeting.id });
	const { user } = setup(<MeetingSidebar />);
	return { user, store: result.current };
};

describe('Meeting sidebar', () => {
	test('open - close chat accordion', async () => {
		const { user } = setupBasicGroup();
		const toggleChatExpanded = screen.queryByTestId('toggleChatExpanded');
		expect(toggleChatExpanded).not.toBeInTheDocument();
		const toggleChatBtn = screen.getByTestId('toggleChatStatus');
		await user.click(toggleChatBtn);
		const chatAccordion = await screen.findByTestId('MeetingConversationAccordion');
		expect(chatAccordion).toHaveStyle('height: 50%');
		const composer = await screen.findByTestId('textAreaComposer');
		expect(composer).toBeInTheDocument();
		await waitFor(() => user.click(toggleChatBtn));
		expect(chatAccordion).toHaveStyle('height: 2.75rem');
	});
	test('open - expand - collapse chat accordion', async () => {
		const { user } = setupBasicGroup();
		const toggleChatBtn = screen.getByTestId('toggleChatStatus');
		await user.click(toggleChatBtn);
		const toggleChatExpanded = screen.getByTestId('toggleChatExpanded');
		await waitFor(() => user.click(toggleChatExpanded));
		const chatAccordion = await screen.findByTestId('MeetingConversationAccordion');
		expect(chatAccordion).toHaveStyle('height: 100%');
		await waitFor(() => user.click(toggleChatExpanded));
		expect(chatAccordion).toHaveStyle('height: 50%');
	});
	test('open - expand - close chat accordion', async () => {
		const { user } = setupBasicGroup();
		const toggleChatBtn = screen.getByTestId('toggleChatStatus');
		await user.click(toggleChatBtn);
		const toggleChatExpanded = screen.getByTestId('toggleChatExpanded');
		await waitFor(() => user.click(toggleChatExpanded));
		const chatAccordion = await screen.findByTestId('MeetingConversationAccordion');
		expect(chatAccordion).toHaveStyle('height: 100%');
		await waitFor(() => user.click(toggleChatBtn));
		expect(toggleChatBtn).toHaveStyle('height: fit');
	});
	test('Display meeting chat with darkMode disabled', async () => {
		mockDarkReaderIsEnabled.mockReturnValueOnce(false);
		const { user } = setupBasicGroup();
		const toggleChatBtn = screen.getByTestId('toggleChatStatus');
		await waitFor(() => user.click(toggleChatBtn));
		const wrapperMeetingChat = screen.getByTestId('WrapperMeetingChat');
		expect(wrapperMeetingChat).toHaveStyle(`background-image: url('papyrus.png')`);
	});
	test('Display meeting chat with darkMode enabled', async () => {
		mockDarkReaderIsEnabled.mockReturnValueOnce(true);
		const { user } = setupBasicGroup();
		const toggleChatBtn = screen.getByTestId('toggleChatStatus');
		await waitFor(() => user.click(toggleChatBtn));
		const wrapperMeetingChat = screen.getByTestId('WrapperMeetingChat');
		expect(wrapperMeetingChat).toHaveStyle(`background-image: url('papyrus-dark.png')`);
	});

	test('title of the accordion changes when a user is writing', async () => {
		const { store } = setupBasicGroup();

		const chatTitle = screen.getByTestId('chat_title');
		expect(chatTitle).toBeVisible();

		act(() => {
			store.setIsWriting(groupRoom.id, mockUser2.id, true);
		});

		const isWritingText = await screen.findByTestId('is_writing_title');
		expect(isWritingText).toBeVisible();
		expect(chatTitle).not.toBeVisible();

		act(() => {
			store.setIsWriting(groupRoom.id, mockUser2.id, false);
			jest.advanceTimersByTime(4000);
		});

		expect(isWritingText).not.toBeVisible();
		expect(chatTitle).toBeVisible();
	});
	test('title of the accordion when two or more users are typing', async () => {
		const { store } = setupBasicGroup();

		act(() => {
			store.setIsWriting(groupRoom.id, mockUser2.id, true);
			store.setIsWriting(groupRoom.id, mockUser3.id, true);
		});

		const isWritingText = await screen.findByText(/2 people are typing.../i);
		expect(isWritingText).toBeVisible();

		act(() => {
			store.setIsWriting(groupRoom.id, mockUser2.id, false);
			store.setIsWriting(groupRoom.id, mockUser3.id, false);
			jest.advanceTimersByTime(4000);
		});

		expect(isWritingText).not.toBeVisible();
	});
});
