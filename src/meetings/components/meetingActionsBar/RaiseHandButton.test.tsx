/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { act, screen } from '@testing-library/react';
import { UserEvent } from '@testing-library/user-event';
import * as ReactRouter from 'react-router-dom';

import RaiseHandButton from './RaiseHandButton';
import useStore from '../../../store/Store';
import {
	createMockMeeting,
	createMockParticipants,
	createMockRoom,
	createMockUser
} from '../../../tests/createMock';
import { routerContextSetup, setup } from '../../../tests/test-utils';
import { RootStore, RoomType } from 'wsc-shared';
import * as api from 'wsc-shared';

const user1 = createMockUser({ id: 'user1Id', name: 'user 1' });
const user2 = createMockUser({ id: 'user2Id', name: 'user 2' });
const user3 = createMockUser({
	id: 'user3Id',
	name: 'user 3'
});

const member1 = { userId: user1.id, owner: true };
const member2 = { userId: user2.id, owner: false };
const member3 = { userId: user3.id, owner: true };

const room = createMockRoom({
	name: '',
	description: '',
	type: RoomType.GROUP,
	members: [member1, member2, member3]
});

const user1Participant = createMockParticipants({ userId: user1.id });

const user3Participant = createMockParticipants({ userId: user3.id });

const user2Participant = createMockParticipants({ userId: user2.id });

const meeting = createMockMeeting({
	roomId: room.id,
	participants: [user1Participant, user2Participant, user3Participant]
});

const storeSetupGroupMeeting = (): { user: UserEvent; store: RootStore } => {
	const store = useStore.getState();
	store.setUserInfo([user1, user2, user3]);
	store.setLoginInfo({ id: user1.id, name: user1.name });
	store.addRooms([room]);
	store.addMeetings([meeting]);
	store.meetingConnection(meeting.id);
	store.setWebsocketStatus(true);
	const spyUseParams = vi.spyOn(ReactRouter, 'useParams');
	spyUseParams.mockReturnValue({ meetingId: meeting.id });
	const { user } = routerContextSetup(<RaiseHandButton />, { meetingId: meeting.id });

	return { user, store };
};

describe('Raise hand button', () => {
	test('User Raise Hand', async () => {
		const spyOnRaiseHand = vi.spyOn(api, 'raiseHand');

		const { user } = storeSetupGroupMeeting();

		expect(useStore.getState().activeMeeting?.usersWithHandRaised).toStrictEqual([]);

		const handButton = await screen.findByTestId('icon: HandOutline');
		await user.click(handButton);

		expect(spyOnRaiseHand).toHaveBeenCalled();
	});

	test('Icon button changes', async () => {
		storeSetupGroupMeeting();

		expect(screen.getByTestId('icon: HandOutline')).toBeInTheDocument();
		expect(useStore.getState().activeMeeting?.usersWithHandRaised).toStrictEqual([]);

		act(() => {
			useStore.getState().setUserWithHandRaised(user1.id, true);
		});

		expect(useStore.getState().activeMeeting?.usersWithHandRaised).toStrictEqual([user1.id]);

		expect(screen.getByTestId('icon: Hand')).toBeInTheDocument();
	});

	test('RaiseHand button is disabled when websocket is down', async () => {
		useStore.getState().setWebsocketStatus(false);
		setup(<RaiseHandButton />);
		expect(await screen.findByRole('button')).toBeDisabled();
	});

	test('RaiseHand button is disabled when message broker is down', async () => {
		useStore.getState().setMessageBrokerStatus(false);
		setup(<RaiseHandButton />);
		expect(await screen.findByRole('button')).toBeDisabled();
	});
});
