/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { screen, act } from '@testing-library/react';
import { UserEvent } from '@testing-library/user-event';

import MeetingParticipantsAccordion from './MeetingParticipantsAccordion';
import MeetingParticipantsList from './MeetingParticipantsList';
import useStore from '../../../../store/Store';
import {
	createMockMeeting,
	createMockMember,
	createMockParticipants,
	createMockRoom,
	createMockUser
} from '../../../../tests/createMock';
import { setup } from '../../../../tests/test-utils';
import { MeetingBe, RoomType, RootStore, STREAM_TYPE } from 'wsc-shared';

const user1 = createMockUser({ id: 'user1Id', name: 'user 1' });
const user2 = createMockUser({ id: 'user2Id', name: 'user 2' });
const user3 = createMockUser({ id: 'user3Id', name: 'user 3' });

const member1 = createMockMember({ userId: user1.id, owner: true });
const member2 = createMockMember({ userId: user2.id });
const member3 = createMockMember({ userId: user3.id, owner: true });

const user1Participant = createMockParticipants({ userId: user1.id });
const user3Participant = createMockParticipants({ userId: user3.id });
const user2Participant = createMockParticipants({
	userId: user2.id,
	audioStreamEnabled: true
});

// setup of the store when I'm a moderator
const storeSetupGroupMeetingModerator = (): { user: UserEvent; store: RootStore } => {
	const store = useStore.getState();

	const room = createMockRoom({
		name: '',
		description: '',
		type: RoomType.GROUP,
		members: [member1, member2, member3]
	});
	store.setUserInfo([user1, user2, user3]);
	store.setLoginInfo({ id: user1.id, name: user1.name });
	store.addRooms([room]);
	const meeting = createMockMeeting({
		roomId: room.id,
		participants: [user1Participant, user2Participant, user3Participant]
	});
	store.addMeetings([meeting]);
	const { user } = setup(<MeetingParticipantsAccordion meetingId={meeting.id} />);
	return { user, store };
};

// setup of the store of a Participant list and I'm a moderator
const storeSetupParticipantModerator = (): {
	meeting: MeetingBe;
	user: UserEvent;
	store: RootStore;
} => {
	const store = useStore.getState();

	const room = createMockRoom({
		name: '',
		description: '',
		type: RoomType.GROUP,
		members: [member1, member2]
	});
	store.setUserInfo([user1, user2]);
	store.setLoginInfo({ id: user1.id, name: user1.name });
	store.addRooms([room]);

	const meeting = createMockMeeting({
		roomId: room.id,
		participants: [user1Participant, user2Participant]
	});
	store.addMeetings([meeting]);
	store.meetingConnection(meeting.id);

	const { user } = setup(<MeetingParticipantsList meetingId={meeting.id} />);
	return { meeting, user, store };
};

describe("Meeting Participants Accordion - moderator's side", () => {
	test('toggle of the Participants accordion and render of the elements', async () => {
		const { user } = storeSetupGroupMeetingModerator();
		const chevron = screen.getByTestId('icon: ChevronDown');
		await user.click(chevron);
		const chevronUp = await screen.findByTestId('icon: ChevronUp');
		expect(chevronUp).toBeInTheDocument();
		const searchInput = screen.getByRole('textbox', { name: /Search participants/i });
		expect(searchInput).toBeInTheDocument();
		const participantList = screen.getAllByTestId('participant_element');
		expect(participantList).toHaveLength(3);
	});

	test('promote moderator', async () => {
		const { user } = storeSetupParticipantModerator();

		const promoteButton = screen.getByTestId('icon: CrownOutline');
		expect(promoteButton).toBeInTheDocument();
		expect(promoteButton).toBeEnabled();

		// promote member
		await user.click(promoteButton);
		const button = await screen.findByTestId('icon: Crown');
		expect(button).toBeInTheDocument();
	});

	test('Search one member inside list', async () => {
		const { user } = storeSetupParticipantModerator();
		const searchInput = screen.getByRole('textbox', { name: /Search participants/i });
		const list = await screen.findByTestId('meeting_participants_list');
		await user.type(searchInput, 'user 1');
		expect(list.children).toHaveLength(1);
	});

	test('Search more members inside list', async () => {
		const { user } = storeSetupParticipantModerator();
		const searchInput = screen.getByRole('textbox', { name: /Search participants/i });
		const list = await screen.findByTestId('meeting_participants_list');
		await user.type(searchInput, 'user');
		expect(list.children).toHaveLength(2);
	});

	test('Search a user that is not in the list', async () => {
		const { user } = storeSetupParticipantModerator();
		const searchInput = screen.getByRole('textbox', { name: /Search participants/i });
		const list = await screen.findByTestId('meeting_participants_list');
		await user.type(searchInput, 'user 4');

		const placeholderText = await screen.findByText(
			/Your search returned no results, try another keyword./i
		);
		expect(placeholderText).toBeInTheDocument();
		expect(list).not.toBeInTheDocument();

		const closeButton = await screen.findByTestId('close_button');
		await user.click(closeButton);
		expect(placeholderText).not.toBeInTheDocument();
	});

	test('mute a member if you are a moderator', async () => {
		const { meeting, user, store } = storeSetupParticipantModerator();

		act(() => {
			store.changeStreamStatus(meeting.id, user2.id, STREAM_TYPE.AUDIO, true);
		});

		const muteButton = screen.getByTestId('icon: MicOffOutline');

		expect(muteButton).toBeInTheDocument();
		expect(muteButton).toBeEnabled();

		await user.click(muteButton);

		const micOff = await screen.findByTestId('icon: MicOff');

		expect(micOff).toBeVisible();
	});
});
