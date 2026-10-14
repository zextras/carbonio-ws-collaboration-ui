/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { screen, within } from '@testing-library/react';
import { find } from 'lodash';

import MeetingParticipantsList from './MeetingParticipantsList';
import * as meetingsApi from '../../../../network/apis/MeetingsApi';
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
import { RoomType } from '../../../../types/store/RoomTypes';
import { UserType } from '../../../../types/store/UserTypes';

const moderator = createMockUser({ id: 'moderatorId', name: 'Moderator' });
const participant = createMockUser({ id: 'participantId', name: 'Camillo Fuffolo' });
const guest = createMockUser({ id: 'guestId', name: 'External Person', type: UserType.GUEST });

const storeSetup = (sessionUserId: string, participantsNumber = 3): MeetingBe => {
	const store = useStore.getState();
	const users = [moderator, participant, guest].slice(0, participantsNumber);
	const room = createMockRoom({
		type: RoomType.GROUP,
		members: [
			createMockMember({ userId: moderator.id, owner: true }),
			createMockMember({ userId: participant.id }),
			createMockMember({ userId: guest.id })
		]
	});
	const meeting = createMockMeeting({
		roomId: room.id,
		participants: users.map((user) => createMockParticipants({ userId: user.id }))
	});
	store.setUserInfo(users);
	store.setLoginInfo({ id: sessionUserId, name: 'Session user' });
	store.addRooms([room]);
	store.addMeetings([meeting]);
	store.meetingConnection(meeting.id);
	return meeting;
};

const getParticipantRow = (userName: string): HTMLElement =>
	find(screen.getAllByTestId('participant_element'), (element) =>
		within(element).queryByText(userName)
	) as HTMLElement;

const getMoreActionsButton = (userName: string): HTMLElement =>
	within(getParticipantRow(userName)).getByTestId('participant_more_actions');

const queryMoreActionsButton = (userName: string): HTMLElement | null =>
	within(getParticipantRow(userName)).queryByTestId('participant_more_actions');

describe('Meeting participant more actions', () => {
	test('More actions button is hidden on the own row', () => {
		const meeting = storeSetup(moderator.id);
		setup(<MeetingParticipantsList meetingId={meeting.id} />);
		expect(queryMoreActionsButton(moderator.name)).not.toBeInTheDocument();
		expect(getMoreActionsButton(participant.name)).toBeVisible();
	});

	test('Moderator sees promote, pin and remove actions', async () => {
		const meeting = storeSetup(moderator.id);
		const { user } = setup(<MeetingParticipantsList meetingId={meeting.id} />);
		await user.click(getMoreActionsButton(participant.name));
		expect(await screen.findByText(/Promote to moderator/i)).toBeVisible();
		expect(screen.getByText(/Pin video/i)).toBeVisible();
		expect(screen.getByText(/Remove from meeting/i)).toBeVisible();
	});

	test('Moderator cannot promote a guest but can remove them', async () => {
		const meeting = storeSetup(moderator.id);
		const { user } = setup(<MeetingParticipantsList meetingId={meeting.id} />);
		await user.click(getMoreActionsButton(guest.name));
		expect(await screen.findByText(/Remove from meeting/i)).toBeVisible();
		expect(screen.queryByText(/Promote to moderator/i)).not.toBeInTheDocument();
	});

	test('Participant sees only the pin action', async () => {
		const meeting = storeSetup(participant.id);
		const { user } = setup(<MeetingParticipantsList meetingId={meeting.id} />);
		await user.click(getMoreActionsButton(moderator.name));
		expect(await screen.findByText(/Pin video/i)).toBeVisible();
		expect(screen.queryByText(/Promote to moderator/i)).not.toBeInTheDocument();
		expect(screen.queryByText(/Remove from meeting/i)).not.toBeInTheDocument();
	});

	test('More actions button is hidden when a participant has no available actions', () => {
		const meeting = storeSetup(participant.id, 2);
		setup(<MeetingParticipantsList meetingId={meeting.id} />);
		expect(queryMoreActionsButton(moderator.name)).not.toBeInTheDocument();
	});
});

describe('Remove participant from meeting', () => {
	const openRemoveModal = async (): Promise<ReturnType<typeof setup>['user']> => {
		const meeting = storeSetup(moderator.id);
		const { user } = setup(<MeetingParticipantsList meetingId={meeting.id} />);
		await user.click(getMoreActionsButton(participant.name));
		await user.click(await screen.findByText(/Remove from meeting/i));
		return user;
	};

	test('Confirmation modal is displayed with the participant name', async () => {
		await openRemoveModal();
		expect(screen.getByTestId('remove_participant_modal')).toBeVisible();
		expect(screen.getByText(/Remove Camillo Fuffolo from the meeting\?/i)).toBeVisible();
		expect(
			screen.getByText(
				/Camillo Fuffolo will be removed from this meeting, even while sharing the screen or recording/i
			)
		).toBeVisible();
	});

	test('Cancel closes the modal without removing the participant', async () => {
		const spyOnRemove = vi.spyOn(meetingsApi, 'kickParticipant');
		const user = await openRemoveModal();
		await user.click(screen.getByRole('button', { name: /No, cancel/i }));
		expect(screen.queryByTestId('remove_participant_modal')).not.toBeInTheDocument();
		expect(spyOnRemove).not.toHaveBeenCalled();
	});

	test('Confirm removes the participant and shows a success snackbar', async () => {
		const spyOnRemove = vi.spyOn(meetingsApi, 'kickParticipant');
		const user = await openRemoveModal();
		await user.click(screen.getByRole('button', { name: /Yes, remove/i }));
		expect(spyOnRemove).toHaveBeenCalledWith('meetingId', participant.id);
		expect(
			await screen.findByText(/Camillo Fuffolo has been removed from the meeting/i)
		).toBeVisible();
		expect(screen.queryByTestId('remove_participant_modal')).not.toBeInTheDocument();
	});

	test('An error snackbar is shown when the removal fails', async () => {
		vi.spyOn(meetingsApi, 'kickParticipant').mockRejectedValue(false);
		const user = await openRemoveModal();
		await user.click(screen.getByRole('button', { name: /Yes, remove/i }));
		expect(
			await screen.findByText(/Couldn't remove Camillo Fuffolo. Please try again./i)
		).toBeVisible();
	});
});
