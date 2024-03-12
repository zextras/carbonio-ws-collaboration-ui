/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { screen, waitFor } from '@testing-library/react';
import { act, renderHook } from '@testing-library/react-hooks';
import { UserEvent } from '@testing-library/user-event';

import WaitingRoom from './WaitingRoom';
import { useParams } from '../../../../../__mocks__/react-router';
import { EventName, sendCustomEvent } from '../../../../hooks/useEventListener';
import { PAGE_INFO_TYPE } from '../../../../hooks/useRouting';
import useStore from '../../../../store/Store';
import { createMockMeeting, createMockRoom, createMockUser } from '../../../../tests/createMock';
import {
	mockedEnterMeetingRequest,
	mockedJoinMeetingRequest
} from '../../../../tests/mocks/network';
import { mockGoToInfoPage, mockGoToMeetingPage } from '../../../../tests/mocks/useRouting';
import { setup } from '../../../../tests/test-utils';
import { MeetingBe, MeetingType } from '../../../../types/network/models/meetingBeTypes';
import { MemberBe, RoomBe } from '../../../../types/network/models/roomBeTypes';
import { UserBe } from '../../../../types/network/models/userBeTypes';
import { WsEventType } from '../../../../types/network/websocket/wsEvents';
import { RoomType } from '../../../../types/store/RoomTypes';
import { RootStore } from '../../../../types/store/StoreTypes';

const user1: UserBe = createMockUser({ id: 'user1Id', name: 'user 1' });
const user2: UserBe = createMockUser({ id: 'user2Id', name: 'user 2' });

const readyButtonLabel = 'Ready to participate';
const acceptedInMeeting = 'accepted insideMeeting';

const member1: MemberBe = { userId: user1.id, owner: true };

const groupRoom: RoomBe = createMockRoom({
	id: 'room-test',
	type: RoomType.TEMPORARY,
	members: [member1]
});

const groupMeeting: MeetingBe = createMockMeeting({
	roomId: groupRoom.id,
	meetingType: MeetingType.SCHEDULED
});

const setupBasicGroup = (): { user: UserEvent; store: RootStore } => {
	const { result } = renderHook(() => useStore());
	act(() => {
		result.current.setUserInfo(user1);
		result.current.setUserInfo(user2);
		result.current.setLoginInfo(user2.id, user2.name);
		result.current.addRoom(groupRoom);
		result.current.addMeeting(groupMeeting);
		result.current.setChatsBeStatus(true);
		result.current.setWebsocketStatus(true);
		result.current.meetingConnection(
			groupMeeting.id,
			true,
			'Audio Device 1',
			true,
			'Video Device 1'
		);
	});
	useParams.mockReturnValue({ meetingId: groupMeeting.id });
	const { user } = setup(<WaitingRoom meetingId={groupMeeting.id} meetingName={'MeetingName'} />);
	return { user, store: result.current };
};

describe('Waiting room', () => {
	test('user hangs up', async () => {
		const { user } = setupBasicGroup();

		const hangButton = await screen.findByText('Hang up');
		await user.click(hangButton);

		expect(mockGoToInfoPage).toBeCalledWith(PAGE_INFO_TYPE.HANG_UP_PAGE);
	});
	test('user is ready to participate', async () => {
		mockedJoinMeetingRequest.mockReturnValue({ status: 'WAITING' });
		const { user } = setupBasicGroup();

		const enterButton = await screen.findByText(readyButtonLabel);
		await act(() => user.click(enterButton));

		const changedString = await screen.findByText('Everything is set! Make yourself comfortable.');
		expect(changedString).toBeInTheDocument();
	});
	test('user is accepted in the scheduled meeting', async () => {
		mockedJoinMeetingRequest.mockReturnValue('joined');
		mockedEnterMeetingRequest.mockReturnValue(acceptedInMeeting);
		const { user } = setupBasicGroup();

		const enterButton = await screen.findByText(readyButtonLabel);
		await act(() => user.click(enterButton));

		await waitFor(() =>
			sendCustomEvent({
				name: EventName.MEETING_USER_ACCEPTED,
				data: {
					type: WsEventType.MEETING_USER_ACCEPTED,
					userId: user2.id,
					sentDate: '1234567',
					meetingId: groupMeeting.id
				}
			})
		);

		expect(mockGoToMeetingPage).toBeCalled();
	});
	test('user is rejected by a moderator', async () => {
		mockedJoinMeetingRequest.mockReturnValue({ status: 'WAITING' });
		mockedEnterMeetingRequest.mockReturnValue(acceptedInMeeting);
		const { user } = setupBasicGroup();

		const enterButton = await screen.findByText(readyButtonLabel);
		await act(() => user.click(enterButton));

		const changedString = await screen.findByText('Everything is set! Make yourself comfortable.');
		expect(changedString).toBeInTheDocument();

		await waitFor(() =>
			sendCustomEvent({
				name: EventName.MEETING_USER_REJECTED,
				data: {
					type: WsEventType.MEETING_USER_REJECTED,
					userId: user2.id,
					sentDate: '1234567',
					meetingId: groupMeeting.id
				}
			})
		);

		expect(mockGoToInfoPage).toBeCalledWith(PAGE_INFO_TYPE.NEXT_TIME_PAGE);
	});
	test('user is waiting, not ready and the meeting and it finish before he can enter', async () => {
		setupBasicGroup();
		await waitFor(() => {
			sendCustomEvent({
				name: EventName.MEETING_STOPPED,
				data: {
					type: WsEventType.MEETING_STOPPED,
					sentDate: '1234567',
					meetingId: groupMeeting.id
				}
			});
		});

		expect(mockGoToInfoPage).toBeCalledWith(PAGE_INFO_TYPE.MEETING_ENDED);
	});
	test('user is ready to participate and the meeting finish before he can enter', async () => {
		mockedJoinMeetingRequest.mockReturnValue({ status: 'WAITING' });
		mockedEnterMeetingRequest.mockReturnValue(acceptedInMeeting);
		const { user } = setupBasicGroup();
		const enterButton = await screen.findByText(readyButtonLabel);
		await act(() => user.click(enterButton));
		await waitFor(() => {
			sendCustomEvent({
				name: EventName.MEETING_STOPPED,
				data: {
					type: WsEventType.MEETING_STOPPED,
					sentDate: '1234567',
					meetingId: groupMeeting.id
				}
			});
		});

		expect(mockGoToInfoPage).toBeCalledWith(PAGE_INFO_TYPE.MEETING_ENDED);
	});
	test('try audio', async () => {
		const { user } = setupBasicGroup();

		const audioOff = screen.getByTestId('icon: MicOff');
		await act(() => user.click(audioOff));
		const audioOn = await screen.findByTestId('icon: Mic');
		expect(audioOn).toBeInTheDocument();
		const tryAudio = await screen.findByText(/Start microphone testing/i);
		expect(tryAudio).toBeEnabled();
		await act(() => user.click(tryAudio));
		const stopAudio = await screen.findByText(/Stop microphone testing/i);
		expect(stopAudio).toBeInTheDocument();
	});
});
