/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { act, screen } from '@testing-library/react';

import RecordingInfo from './RecordingInfo';
import { EventName, sendCustomEvent } from '../../hooks/useEventListener';
import useStore from '../../store/Store';
import {
	createMockMeeting,
	createMockMember,
	createMockRoom,
	createMockUser
} from '../../tests/createMock';
import { setup } from '../../tests/test-utils';
import { MeetingBe, MeetingType } from '../../types/network/models/meetingBeTypes';
import { RoomBe } from '../../types/network/models/roomBeTypes';
import { WsEventType } from '../../types/network/websocket/wsEvents';
import { RoomType } from '../../types/store/RoomTypes';

const user1 = createMockUser({ id: 'user1', name: 'user1' });
const user2 = createMockUser({ id: 'user2', name: 'user2' });

const room: RoomBe = createMockRoom({
	type: RoomType.TEMPORARY,
	members: [createMockMember({ userId: user1.id, owner: true })]
});

const meeting: MeetingBe = createMockMeeting({
	roomId: 'id',
	type: MeetingType.SCHEDULED
});

beforeEach(() => {
	const store = useStore.getState();
	store.setLoginInfo(user1.id, 'user1');
	store.setUserInfo(user1);
	store.setUserInfo(user2);
	store.addRoom(room);
	store.addMeeting(meeting);
	store.meetingConnection(meeting.id, false, undefined, false, undefined);
});
describe('RecordingInfo tests', () => {
	test('Recording red bar is not visible only when the meeting is not being recorded', () => {
		setup(<RecordingInfo meetingId={meeting.id} />);
		expect(screen.queryByText('This meeting is being recorded')).toBeNull();
	});

	test('Recording red bar is visible when the meeting is being recorded', () => {
		useStore.getState().startRecording(meeting.id, '32423423', 'user1');
		setup(<RecordingInfo meetingId={meeting.id} />);
		expect(screen.queryByText('This meeting is being recorded')).toBeVisible();
	});

	test('A snackbar appears when the recording starts by another moderator', async () => {
		setup(<RecordingInfo meetingId={meeting.id} />);
		act(() => {
			sendCustomEvent({
				name: EventName.MEETING_RECORDING_STARTED,
				data: {
					type: WsEventType.MEETING_RECORDING_STARTED,
					meetingId: meeting.id,
					userId: user2.id,
					sentDate: new Date().toISOString()
				}
			});
		});

		const snackbar = await screen.findByText(
			`${user2.name} started the registration of this meeting`
		);
		expect(snackbar).toBeVisible();
	});

	test("A snackbar doesn't appear when the recording is started by me", () => {
		setup(<RecordingInfo meetingId={meeting.id} />);
		act(() => {
			sendCustomEvent({
				name: EventName.MEETING_RECORDING_STOPPED,
				data: {
					type: WsEventType.MEETING_RECORDING_STOPPED,
					meetingId: meeting.id,
					userId: user1.id,
					sentDate: new Date().toISOString()
				}
			});
		});

		const snackbar = screen.queryByText(`${user1.name} started the registration of this meeting`);
		expect(snackbar).not.toBeInTheDocument();
	});

	test('A snackbar appears when the recording stops by another moderator', async () => {
		setup(<RecordingInfo meetingId={meeting.id} />);
		act(() => {
			sendCustomEvent({
				name: EventName.MEETING_RECORDING_STOPPED,
				data: {
					type: WsEventType.MEETING_RECORDING_STOPPED,
					meetingId: meeting.id,
					userId: user2.id,
					sentDate: new Date().toISOString()
				}
			});
		});

		const snackbar = await screen.findByText(
			`${user2.name} stopped the registration of this meeting`
		);
		expect(snackbar).toBeVisible();
	});

	test("A snackbar doesn't appear when the recording is stopped by me", () => {
		setup(<RecordingInfo meetingId={meeting.id} />);
		act(() => {
			sendCustomEvent({
				name: EventName.MEETING_RECORDING_STOPPED,
				data: {
					type: WsEventType.MEETING_RECORDING_STOPPED,
					meetingId: meeting.id,
					userId: user1.id,
					sentDate: new Date().toISOString()
				}
			});
		});

		const snackbar = screen.queryByText(`${user1.name} stopped the registration of this meeting`);
		expect(snackbar).not.toBeInTheDocument();
	});
});
