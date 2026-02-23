/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { act, screen } from '@testing-library/react';

import ConversationHeaderMeetingButton from './ConversationHeaderMeetingButton';
import { mockGoToRoomPage } from '../../../hooks/__mocks__/useRouting';
import meetingsApi from '../../../network/apis/MeetingsApi';
import useStore from '../../../store/Store';
import {
	createMockAttributesList,
	createMockMeeting,
	createMockMember,
	createMockParticipants,
	createMockRoom,
	createMockUser
} from '../../../tests/createMock';
import { setup } from '../../../tests/test-utils';
import { UserBe } from '../../../types/network/models/userBeTypes';
import { RoomType } from '../../../types/store/RoomTypes';

const user1: UserBe = createMockUser({ id: 'user1Id', name: 'user 1' });

const user2: UserBe = createMockUser({ id: 'user2Id', name: 'user 2' });

const user3: UserBe = createMockUser({
	id: 'user3Id',
	name: 'user 3'
});

const oneToOneRoom = createMockRoom({
	id: 'oneToOneRoomId',
	type: RoomType.ONE_TO_ONE,
	members: [createMockMember({ userId: user1.id }), createMockMember({ userId: user2.id })]
});

const meetingOneToOne = createMockMeeting({
	id: 'meetingOneToOneId',
	roomId: oneToOneRoom.id,
	participants: [
		createMockParticipants({ userId: user1.id }),
		createMockParticipants({ userId: user2.id })
	]
});

const groupRoom = createMockRoom({
	id: 'groupRoomId',
	type: RoomType.GROUP,
	members: [
		createMockMember({ userId: user1.id, owner: true }),
		createMockMember({ userId: user2.id }),
		createMockMember({ userId: user3.id })
	]
});

const groupMeeting = createMockMeeting({
	id: 'meetingGroupId',
	roomId: groupRoom.id,
	participants: [
		createMockParticipants({ userId: user1.id }),
		createMockParticipants({ userId: user2.id }),
		createMockParticipants({ userId: user3.id })
	]
});

vi.mock('../../../hooks/useRouting');

beforeEach(() => {
	window.open = vi.fn(() => null);
	const store = useStore.getState();
	store.setLoginInfo(user1.id, user1.name);
	store.setUserInfo([user1, user2, user3]);
	store.addRooms([oneToOneRoom, groupRoom]);
	store.setAttributes(
		createMockAttributesList({
			carbonioWscPrivateChatCreation: 'TRUE'
		})
	);
});

describe('Conversation header meeting button - one to one', () => {
	test('everything is rendered correctly', () => {
		setup(<ConversationHeaderMeetingButton roomId={oneToOneRoom.id} />);
		const joinMeetingButton = screen.getByTestId('join_meeting_button');
		expect(joinMeetingButton).toBeVisible();
		expect(joinMeetingButton).not.toBeDisabled();
	});

	test('everything is rendered correctly - meeting started', () => {
		useStore.getState().addMeetings([meetingOneToOne]);
		setup(<ConversationHeaderMeetingButton roomId={oneToOneRoom.id} />);
		const disabledButton = screen.getByTestId('join_meeting_button');
		expect(disabledButton).toBeEnabled();
	});
});

describe('Conversation header meeting button - group', () => {
	test('everything is rendered correctly', () => {
		setup(<ConversationHeaderMeetingButton roomId={groupRoom.id} />);
		const joinMeetingButton = screen.getByTestId('join_meeting_button');
		expect(joinMeetingButton).toBeVisible();
		expect(joinMeetingButton).not.toBeDisabled();
	});

	test('open meeting for the first time', async () => {
		const spyOnCreateMeeting = vi.spyOn(meetingsApi, 'createMeeting');
		const { user } = setup(<ConversationHeaderMeetingButton roomId={groupRoom.id} />);

		const joinMeetingButton = screen.getByTestId('join_meeting_button');
		await user.click(joinMeetingButton);

		expect(spyOnCreateMeeting).toHaveBeenCalled();
	});

	test('everything is rendered correctly - meeting started', () => {
		useStore.getState().addMeetings([groupMeeting]);
		setup(<ConversationHeaderMeetingButton roomId={groupRoom.id} />);
		const disabledButton = screen.getByTestId('join_meeting_button');
		expect(disabledButton).toBeEnabled();
		const videoButton = screen.getByTestId('video_button');
		expect(videoButton).toBeVisible();
		const participantListButton = screen.getByTestId('participant_list_button');
		expect(participantListButton).toBeVisible();
	});

	test("toggle dropdown - I'm inside the meeting", async () => {
		useStore.getState().addMeetings([groupMeeting]);
		const { user } = setup(<ConversationHeaderMeetingButton roomId={groupRoom.id} />);

		const participantListButton = screen.getByTestId('participant_list_button');
		expect(screen.getByTestId('participant_dropdown')).not.toBeVisible();
		await user.click(participantListButton);
		const participantDropdown = await screen.findByTestId('participant_dropdown');
		expect(participantDropdown).toBeVisible();

		const list = await screen.findByTestId('participant_list');
		expect(list).toBeInTheDocument();
		expect(list.children).toHaveLength(3);
	});

	test("toggle dropdown - I'm not inside the meeting", async () => {
		const store = useStore.getState();
		store.addMeetings([groupMeeting]);
		store.removeParticipant(groupMeeting.id, user1.id);
		const { user } = setup(<ConversationHeaderMeetingButton roomId={groupRoom.id} />);

		const participantListButton = screen.getByTestId('participant_list_button');
		expect(participantListButton).not.toBeDisabled();
		expect(screen.getByTestId('participant_dropdown')).not.toBeVisible();
		await user.click(participantListButton);
		const participantDropdown = await screen.findByTestId('participant_dropdown');
		expect(participantDropdown).toBeVisible();

		const list = await screen.findByTestId('participant_list');
		expect(list).toBeInTheDocument();
		expect(list.children).toHaveLength(2);

		const goToPrivateChatButton = await screen.findAllByTestId('go_to_private_chat');
		expect(goToPrivateChatButton).toHaveLength(2);
	});

	test('go to private chat from dropdown', async () => {
		useStore.getState().addMeetings([groupMeeting]);
		const { user } = setup(<ConversationHeaderMeetingButton roomId={groupRoom.id} />);

		const participantListButton = screen.getByTestId('participant_list_button');
		await user.click(participantListButton);

		// there's two participants inside the meeting, so the one who's not me will have the 'go to private chat' button
		const goToPrivateChatButton = await screen.findAllByTestId('go_to_private_chat');
		expect(goToPrivateChatButton).toHaveLength(2);
		await user.click(goToPrivateChatButton[0]);
		expect(mockGoToRoomPage).toBeCalled();
	});

	test('open meeting', async () => {
		const meetingOpen = vi.spyOn(window, 'open');
		const store = useStore.getState();
		store.addMeetings([groupMeeting]);
		store.removeParticipant(groupMeeting.id, user1.id);
		const { user } = setup(<ConversationHeaderMeetingButton roomId={groupRoom.id} />);
		const joinMeetingButton = screen.getByTestId('join_meeting_button');
		expect(joinMeetingButton).toBeVisible();
		expect(joinMeetingButton).not.toBeDisabled();

		await user.click(joinMeetingButton);
		expect(meetingOpen).toHaveBeenCalledTimes(1);
	});

	test("hide dropdown when there's no one else inside the meeting", async () => {
		const store = useStore.getState();
		store.addMeetings([groupMeeting]);
		store.removeParticipant(groupMeeting.id, user1.id);
		const { user } = setup(<ConversationHeaderMeetingButton roomId={groupRoom.id} />);
		const participantListButton = screen.getByTestId('participant_list_button');
		expect(screen.getByTestId('participant_dropdown')).not.toBeVisible();
		await user.click(participantListButton);
		expect(screen.getByTestId('participant_dropdown')).toBeVisible();

		act(() => {
			useStore.getState().removeParticipant(groupMeeting.id, user2.id);
			useStore.getState().removeParticipant(groupMeeting.id, user3.id);
		});
		expect(screen.getByTestId('participant_dropdown')).not.toBeVisible();
	});
});
