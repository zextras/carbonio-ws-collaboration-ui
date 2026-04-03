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
	createMockConfigurationMessage,
	createMockMeeting,
	createMockMember,
	createMockParticipants,
	createMockRoom,
	createMockTextMessage,
	createMockUser
} from '../../../../tests/createMock';
import { routerContextSetup } from '../../../../tests/test-utils';
import { MeetingBe } from '../../../../types/network/models/meetingBeTypes';
import { RoomBe, RoomType } from '../../../../types/network/models/roomBeTypes';
import { OperationType } from '../../../../types/store/ChatsRegistryTypes';
import { MeetingParticipant } from '../../../../types/store/MeetingTypes';
import { RootStore } from '../../../../types/store/StoreTypes';
import { dateToTimestamp } from '../../../../utils/dateUtils';
import MeetingSidebar from '../MeetingSidebar';

const heightRem = 'height: 2.75rem';
const heightPercentage = 'height: 100%';
const clearHistoryLabel = 'Clear history';

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
		result.current.setLoginInfo({ id: mockUser1.id });
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
		expect(wrapperMeetingChat).toHaveStyle(
			`background-image: url('/src/chats/assets/papyrus.png')`
		);
	});
	test('Display meeting chat with darkMode enabled', async () => {
		mockDarkReaderIsEnabled.mockReturnValueOnce(true);
		setupBasicGroup();
		const wrapperMeetingChat = screen.getByTestId('WrapperMeetingChat');
		expect(wrapperMeetingChat).toHaveStyle(
			`background-image: url('/src/chats/assets/papyrus-dark.png')`
		);
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

const temporaryRoom: RoomBe = createMockRoom({
	id: 'temp-room-test',
	type: RoomType.TEMPORARY,
	members: [
		createMockMember({ userId: mockUser1.id, owner: true }),
		createMockMember({ userId: mockUser2.id })
	],
	userSettings: { muted: false }
});

const temporaryMeeting: MeetingBe = createMockMeeting({
	roomId: temporaryRoom.id,
	participants: [user1Participant]
});

const setupTemporaryRoom = (
	chatsRegistry?: RootStore['chatsRegistry']
): { user: UserEvent; store: RootStore } => {
	const { result } = renderHook(() => useStore());
	act(() => {
		result.current.setAttributes(createMockAttributesList({ carbonioWscVideoCallEnabled: 'TRUE' }));
		result.current.setLoginInfo({ id: mockUser1.id });
		result.current.setUserInfo([mockUser2]);
		result.current.setApiVersion('1.6.7');
		result.current.addRooms([temporaryRoom]);
		result.current.addMeetings([temporaryMeeting]);
		result.current.meetingConnection(temporaryMeeting.id);
		if (chatsRegistry) {
			useStore.setState({ chatsRegistry });
		}
	});
	const { user } = routerContextSetup(<MeetingSidebar />, { meetingId: temporaryMeeting.id });
	return { user, store: result.current };
};

describe('Clear history in virtual rooms', () => {
	test('Clear history buttons are visible when temporary room has messages', () => {
		const now = new Date();
		setupTemporaryRoom({
			[temporaryRoom.id]: {
				messages: [
					createMockTextMessage({
						id: 'msg-1',
						roomId: temporaryRoom.id,
						date: dateToTimestamp(now.toISOString())
					})
				],
				fastenings: {},
				markers: {},
				searchResults: [],
				unread: 0,
				backfillQueue: []
			}
		});
		expect(screen.getByText(clearHistoryLabel)).toBeInTheDocument();
		expect(screen.getByText('Export messages')).toBeInTheDocument();
	});

	test('Clear history buttons are hidden when only CLEARED_HISTORY config messages remain', () => {
		const now = new Date();
		setupTemporaryRoom({
			[temporaryRoom.id]: {
				messages: [
					createMockConfigurationMessage({
						id: 'clear-msg',
						roomId: temporaryRoom.id,
						operation: OperationType.CLEARED_HISTORY,
						date: dateToTimestamp(now.toISOString())
					})
				],
				fastenings: {},
				markers: {},
				searchResults: [],
				unread: 0,
				backfillQueue: []
			}
		});
		expect(screen.queryByText(clearHistoryLabel)).not.toBeInTheDocument();
		expect(screen.queryByText('Export messages')).not.toBeInTheDocument();
	});

	test('Clear history buttons are hidden for GROUP rooms even with messages', () => {
		const now = new Date();
		setupBasicGroup();
		act(() => {
			useStore.setState({
				chatsRegistry: {
					[groupRoom.id]: {
						messages: [
							createMockTextMessage({
								id: 'msg-1',
								roomId: groupRoom.id,
								date: dateToTimestamp(now.toISOString())
							})
						],
						fastenings: {},
						markers: {},
						searchResults: [],
						unread: 0,
						backfillQueue: []
					}
				}
			});
		});
		expect(screen.queryByText(clearHistoryLabel)).not.toBeInTheDocument();
	});
});
