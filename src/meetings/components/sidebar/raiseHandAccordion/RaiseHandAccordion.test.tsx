/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { act, screen } from '@testing-library/react';

import RaiseHandAccordion from './RaiseHandAccordion';
import { EventName, sendCustomEvent } from '../../../../hooks/useEventListener';
import { wsEventsHandler } from '../../../../network/websocket/wsEventsHandler';
import useStore from '../../../../store/Store';
import {
	createMockMeeting,
	createMockMember,
	createMockRoom,
	createMockUser
} from '../../../../tests/createMock';
import { setup } from '../../../../tests/test-utils';
import { MeetingBe, MeetingType } from '../../../../types/network/models/meetingBeTypes';
import { RoomBe } from '../../../../types/network/models/roomBeTypes';
import { WsEventType } from '../../../../types/network/websocket/wsEvents';
import { MeetingAccordionType } from '../../../../types/store/ActiveMeetingTypes';
import { RoomType } from '../../../../types/store/RoomTypes';

const user1 = createMockUser({ id: 'user1', name: 'user1' });
const user2 = createMockUser({ id: 'user2', name: 'user2' });

const room: RoomBe = createMockRoom({
	type: RoomType.TEMPORARY,
	members: [
		createMockMember({ userId: user1.id, owner: true }),
		createMockMember({ userId: user2.id, owner: false })
	]
});

const meeting: MeetingBe = createMockMeeting({
	roomId: room.id,
	meetingType: MeetingType.SCHEDULED
});

beforeEach(() => {
	const store = useStore.getState();
	store.setLoginInfo(user1.id, 'user1');
	store.setUserInfo([user1, user2]);
	store.addRooms([room]);
	store.addMeetings([meeting]);
	store.meetingConnection(meeting.id);
	store.setMeetingSidebarStatus(MeetingAccordionType.RAISE_HAND, true); // default open
});

describe('RaiseHandAccordion', () => {
	test('is visible if users raised their hands', () => {
		const store = useStore.getState();
		setup(<RaiseHandAccordion meetingId={meeting.id} />);
		act(() => {
			store.setUserWithHandRaised(user2.id, true);
		});
		expect(screen.getByText(/1 raised hands/i)).toBeInTheDocument();
	});

	test("isn't visible if no users raised hand", () => {
		setup(<RaiseHandAccordion meetingId={meeting.id} />);
		expect(screen.queryByText(/raised hands/i)).not.toBeInTheDocument();
	});

	test('toggles open and closed state', async () => {
		const store = useStore.getState();

		const { user } = setup(<RaiseHandAccordion meetingId={meeting.id} />);
		act(() => {
			store.setUserWithHandRaised(user2.id, true);
		});
		const iconUp = 'icon: ChevronUp';
		const iconDown = 'icon: ChevronDown';

		expect(screen.getByTestId(iconUp)).toBeVisible();
		await user.click(screen.getByTestId(iconUp));
		expect(screen.getByTestId(iconDown)).toBeVisible();
		await user.click(screen.getByTestId(iconDown));
		expect(screen.getByTestId(iconUp)).toBeVisible();
	});

	test('are rendered in the list', () => {
		const store = useStore.getState();
		setup(<RaiseHandAccordion meetingId={meeting.id} />);
		act(() => {
			store.setUserWithHandRaised(user2.id, true);
		});
		expect(screen.getByTestId('icon: Hand')).toBeInTheDocument();
	});
});

describe('Snackbar notifications', () => {
	test('shows snackbar when another user raises hand', () => {
		setup(<RaiseHandAccordion meetingId={meeting.id} />);
		act(() => {
			wsEventsHandler({
				type: WsEventType.MEETING_PARTICIPANT_HAND_RAISED,
				userId: user2.id,
				sentDate: new Date().toISOString(),
				meetingId: meeting.id,
				raised: true
			});
		});
		expect(screen.getByText(/Someone raised his hand/i)).toBeInTheDocument();
	});

	test('shows snackbar when moderator lowers your hand', () => {
		const store = useStore.getState();
		act(() => {
			store.setLoginInfo(user2.id, 'user2');
			store.setUserWithHandRaised(user2.id, true);
		});
		setup(<RaiseHandAccordion meetingId={meeting.id} />);
		act(() => {
			sendCustomEvent({
				name: EventName.MEETING_PARTICIPANT_RAISE_HAND,
				data: {
					type: WsEventType.MEETING_PARTICIPANT_HAND_RAISED,
					userId: user2.id,
					sentDate: new Date().toISOString(),
					meetingId: meeting.id,
					raised: false,
					moderatorId: user1.id
				}
			});
		});
		expect(screen.getByText(/A moderator lowered your hand/i)).toBeInTheDocument();
	});

	test('closes snackbar when hand is lowered', () => {
		setup(<RaiseHandAccordion meetingId={meeting.id} />);
		act(() => {
			wsEventsHandler({
				type: WsEventType.MEETING_PARTICIPANT_HAND_RAISED,
				userId: user2.id,
				sentDate: new Date().toISOString(),
				meetingId: meeting.id,
				raised: true
			});
		});

		expect(screen.getByText(/Someone raised his hand/i)).toBeInTheDocument();

		act(() => {
			wsEventsHandler({
				type: WsEventType.MEETING_PARTICIPANT_HAND_RAISED,
				userId: user2.id,
				sentDate: new Date().toISOString(),
				meetingId: meeting.id,
				raised: false
			});
		});
		expect(screen.queryByText(/Someone raised his hand/i)).not.toBeInTheDocument();
	});
});
