/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen } from '@testing-library/react';
import { act, renderHook } from '@testing-library/react-hooks';
import { UserEvent } from '@testing-library/user-event/setup/setup';

import { mockUseParams } from '../../../../../jest-mocks';
import useStore from '../../../../store/Store';
import {
	createMockMeeting,
	createMockMember,
	createMockParticipants,
	createMockRoom
} from '../../../../tests/createMock';
import { setup } from '../../../../tests/test-utils';
import { MeetingBe } from '../../../../types/network/models/meetingBeTypes';
import { RoomBe, RoomType } from '../../../../types/network/models/roomBeTypes';
import { MeetingParticipant } from '../../../../types/store/MeetingTypes';
import { RootStore } from '../../../../types/store/StoreTypes';
import MeetingSidebar from '../MeetingSidebar';

const groupRoom: RoomBe = createMockRoom({
	id: 'room-test',
	type: RoomType.GROUP,
	members: [
		createMockMember({ userId: 'user1', owner: true }),
		createMockMember({ userId: 'user2', owner: true })
	],
	userSettings: { muted: false }
});

const user1Participant: MeetingParticipant = createMockParticipants({
	userId: 'user1',
	sessionId: 'sessionIdUser1'
});

const groupMeeting: MeetingBe = createMockMeeting({
	roomId: groupRoom.id,
	participants: [user1Participant]
});

const setupBasicGroup = (): { user: UserEvent; store: RootStore } => {
	const { result } = renderHook(() => useStore());
	act(() => {
		result.current.addRoom(groupRoom);
		result.current.addMeeting(groupMeeting);
		result.current.meetingConnection(groupMeeting.id, false, undefined, false, undefined);
	});
	mockUseParams.mockReturnValue({ meetingId: groupMeeting.id });
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
		await user.click(toggleChatBtn);
		expect(chatAccordion).toHaveStyle('height: fit');
	});
	test('open - expand - collapse chat accordion', async () => {
		const { user } = setupBasicGroup();
		const toggleChatBtn = screen.getByTestId('toggleChatStatus');
		await user.click(toggleChatBtn);
		const toggleChatExpanded = screen.getByTestId('toggleChatExpanded');
		await user.click(toggleChatExpanded);
		const chatAccordion = await screen.findByTestId('MeetingConversationAccordion');
		expect(chatAccordion).toHaveStyle('height: 100%');
		await user.click(toggleChatExpanded);
		expect(chatAccordion).toHaveStyle('height: 50%');
	});
	test('open - expand - close chat accordion', async () => {
		const { user } = setupBasicGroup();
		const toggleChatBtn = screen.getByTestId('toggleChatStatus');
		await user.click(toggleChatBtn);
		const toggleChatExpanded = screen.getByTestId('toggleChatExpanded');
		await user.click(toggleChatExpanded);
		const chatAccordion = await screen.findByTestId('MeetingConversationAccordion');
		expect(chatAccordion).toHaveStyle('height: 100%');
		await user.click(toggleChatBtn);
		expect(toggleChatBtn).toHaveStyle('height: fit');
	});
});
