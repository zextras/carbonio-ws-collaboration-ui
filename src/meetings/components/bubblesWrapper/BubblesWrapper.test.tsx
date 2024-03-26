/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { screen, waitFor } from '@testing-library/react';
import { UserEvent } from '@testing-library/user-event';
import { act } from 'react-dom/test-utils';

import BubblesWrapper from './BubblesWrapper';
import { useParams } from '../../../../__mocks__/react-router';
import { EventName, sendCustomEvent } from '../../../hooks/useEventListener';
import useStore from '../../../store/Store';
import {
	createMockMeeting,
	createMockParticipants,
	createMockRoom,
	createMockTextMessage,
	createMockUser
} from '../../../tests/createMock';
import { setup } from '../../../tests/test-utils';
import { MeetingBe } from '../../../types/network/models/meetingBeTypes';
import { MemberBe, RoomBe, RoomType } from '../../../types/network/models/roomBeTypes';
import { UserBe } from '../../../types/network/models/userBeTypes';
import { MeetingChatVisibility } from '../../../types/store/ActiveMeetingTypes';
import { MarkerStatus } from '../../../types/store/MarkersTypes';
import { MeetingParticipant } from '../../../types/store/MeetingTypes';
import { MessageType } from '../../../types/store/MessageTypes';
import { RootStore } from '../../../types/store/StoreTypes';

const user1: UserBe = createMockUser({ id: 'user1Id', name: 'user 1' });
const user2: UserBe = createMockUser({ id: 'user2Id', name: 'user 2' });
const user3: UserBe = createMockUser({
	id: 'user3Id',
	name: 'user 3',
	pictureUpdatedAt: '2022-08-25T17:24:28.961+02:00'
});
const member1: MemberBe = { userId: user1.id, owner: true };
const member2: MemberBe = { userId: user2.id, owner: false };
const member3: MemberBe = { userId: user3.id, owner: true };

const room: RoomBe = createMockRoom({
	name: '',
	description: '',
	type: RoomType.GROUP,
	members: [member1, member2, member3]
});

const user1Participant: MeetingParticipant = createMockParticipants({
	userId: user1.id,
	sessionId: 'sessionIdUser1'
});
const user3Participant: MeetingParticipant = createMockParticipants({
	userId: user3.id,
	sessionId: 'sessionIdUser3'
});
const user2Participant: MeetingParticipant = createMockParticipants({
	userId: user2.id,
	sessionId: 'sessionIdUser2'
});
const meeting: MeetingBe = createMockMeeting({
	roomId: room.id,
	participants: [user1Participant, user2Participant, user3Participant]
});

const message = createMockTextMessage({
	id: '1111-409408-555555',
	roomId: room.id,
	date: 1665409408796,
	type: MessageType.TEXT_MSG,
	stanzaId: 'stanzaId-1111-409408-555555',
	from: user2.id,
	text: '11111',
	read: MarkerStatus.READ
});

const storeBasicActiveMeetingSetup = (): { user: UserEvent; store: RootStore } => {
	const store: RootStore = useStore.getState();
	store.setLoginInfo(user1.id, user1.name);
	store.setUserInfo(user1);
	store.setUserInfo(user2);
	store.setUserInfo(user3);
	store.addRoom(room);
	store.addMeeting(meeting);
	store.meetingConnection(meeting.id, false, undefined, false, undefined);
	store.setMeetingSidebarStatus(meeting.id, false);
	useParams.mockReturnValue({ meetingId: meeting.id });
	const { user } = setup(<BubblesWrapper />);

	return { store, user };
};

describe('BubblesWrapper', () => {
	test('when a message arrives It should be displayed for 3 seconds and then disappear', async () => {
		const { store } = storeBasicActiveMeetingSetup();

		act(() => {
			store.newMessage(message);
			sendCustomEvent({ name: EventName.NEW_MESSAGE, data: message });
		});
		const messageBubble = await screen.findByTestId(`Bubble-${message.id}`);
		expect(messageBubble).toBeVisible();

		act(() => {
			jest.advanceTimersByTime(4000);
		});

		await waitFor(() =>
			expect(screen.queryByTestId(`Bubble-${message.id}`)).not.toBeInTheDocument()
		);
	});

	test('clicking a bubble that appears in a meeting opens sidebar and chat accordion', async () => {
		const { store, user } = storeBasicActiveMeetingSetup();

		act(() => {
			store.newMessage(message);
			sendCustomEvent({ name: EventName.NEW_MESSAGE, data: message });
		});
		const messageBubble = await screen.findByTestId(`Bubble-${message.id}`);

		await waitFor(() => user.click(messageBubble));

		const updatedStore = useStore.getState();
		expect(updatedStore.activeMeeting[meeting.id].sidebarStatus.sidebarIsOpened).toBeTruthy();
		expect(updatedStore.activeMeeting[meeting.id].chatVisibility).toBe(MeetingChatVisibility.OPEN);
	});
});
