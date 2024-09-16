/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { screen, waitFor, act, renderHook } from '@testing-library/react';
import { UserEvent } from '@testing-library/user-event';

import MeetingAccessPage from './MeetingAccessPage';
import { useParams } from '../../../../__mocks__/react-router';
import { EventName, sendCustomEvent } from '../../../hooks/useEventListener';
import { PAGE_INFO_TYPE } from '../../../hooks/useRouting';
import useStore from '../../../store/Store';
import {
	createMockMeeting,
	createMockParticipants,
	createMockRoom,
	createMockUser
} from '../../../tests/createMock';
import { mockMediaDevicesResolve } from '../../../tests/mocks/global';
import { mockedEnterMeetingRequest, mockedJoinMeetingRequest } from '../../../tests/mocks/network';
import { mockGoToInfoPage, mockGoToMeetingPage } from '../../../tests/mocks/useRouting';
import { setup } from '../../../tests/test-utils';
import { MeetingBe, MeetingType } from '../../../types/network/models/meetingBeTypes';
import { MemberBe, RoomBe } from '../../../types/network/models/roomBeTypes';
import { UserBe } from '../../../types/network/models/userBeTypes';
import { WsEventType } from '../../../types/network/websocket/wsEvents';
import { MeetingParticipant } from '../../../types/store/MeetingTypes';
import { RoomType } from '../../../types/store/RoomTypes';
import { RootStore } from '../../../types/store/StoreTypes';
import { User, UserType } from '../../../types/store/UserTypes';

const audioDevice2 = 'Audio Device 2';
const videoDevice2 = 'Video Device 2';
const iconLogOut = 'icon: LogOut';

const normalFontWeight = 'font-weight: 400';
const boldFontWeight = 'font-weight: 700';

const iconMicOff = 'icon: MicOff';
const iconVideoOff = 'icon: VideoOff';
const iconVideo = 'icon: Video';

const readyButtonLabel = 'Ready to participate';
const acceptedInMeeting = 'accepted insideMeeting';

const user1: UserBe = createMockUser({ id: 'user1Id', name: 'user 1' });
const user2: UserBe = createMockUser({ id: 'user2Id', name: 'user 2' });
const user3: UserBe = createMockUser({ id: 'user3Id', name: 'user 3' });
const guestUser: User = createMockUser({ type: UserType.GUEST });

const member1: MemberBe = { userId: user1.id, owner: true };
const member2: MemberBe = { userId: user2.id, owner: false };
const member3: MemberBe = { userId: user3.id, owner: true };

const groupRoom: RoomBe = createMockRoom({
	id: 'room-test',
	type: RoomType.GROUP,
	members: [member1, member2],
	userSettings: { muted: false }
});

const user1Participant: MeetingParticipant = createMockParticipants({
	userId: 'user1',
	sessionId: 'sessionIdUser1'
});

const user2Participant: MeetingParticipant = createMockParticipants({
	userId: 'user2',
	sessionId: 'sessionIdUser2'
});

const groupMeeting: MeetingBe = createMockMeeting({
	roomId: groupRoom.id,
	participants: [user1Participant, user2Participant]
});

const canAccessMeeting = true;

const groupForWaitingRoom: RoomBe = createMockRoom({
	id: 'room-test',
	type: RoomType.TEMPORARY,
	members: [member3]
});

const meetingForWaitingRoom: MeetingBe = createMockMeeting({
	roomId: groupForWaitingRoom.id,
	meetingType: MeetingType.SCHEDULED
});

const setupGroupWithBeStatusUndefined = (): { user: UserEvent; store: RootStore } => {
	const { result } = renderHook(() => useStore());
	act(() => {
		localStorage.setItem(
			'ChatsMeetingSettings',
			JSON.stringify({ EnableCamera: false, EnableMicrophone: false })
		);
		result.current.setUserInfo(user1);
		result.current.setUserInfo(user2);
		result.current.setLoginInfo(user1.id, user1.name);
		result.current.addRoom(groupRoom);
		result.current.addMeeting(groupMeeting);
	});
	useParams.mockReturnValue({ meetingId: groupMeeting.id });
	const { user } = setup(
		<MeetingAccessPage meetingName={groupMeeting.name} hasUserDirectAccess={canAccessMeeting} />
	);
	return { user, store: result.current };
};

const setupBasicGroup = (): { user: UserEvent; store: RootStore } => {
	const { result } = renderHook(() => useStore());
	act(() => {
		localStorage.setItem(
			'ChatsMeetingSettings',
			JSON.stringify({ EnableCamera: false, EnableMicrophone: false })
		);
		result.current.setUserInfo(user1);
		result.current.setUserInfo(user2);
		result.current.setLoginInfo(user1.id, user1.name);
		result.current.addRoom(groupRoom);
		result.current.addMeeting(groupMeeting);
		result.current.setChatsBeStatus(true);
		result.current.setWebsocketStatus(true);
	});
	useParams.mockReturnValue({ meetingId: groupMeeting.id });
	const { user } = setup(
		<MeetingAccessPage meetingName={groupMeeting.name} hasUserDirectAccess={canAccessMeeting} />
	);
	return { user, store: result.current };
};

const setupForWaitingRoom = (): { user: UserEvent; store: RootStore } => {
	const { result } = renderHook(() => useStore());
	act(() => {
		localStorage.setItem(
			'ChatsMeetingSettings',
			JSON.stringify({ EnableCamera: true, EnableMicrophone: true })
		);
		result.current.setUserInfo(user3);
		result.current.setUserInfo(user2);
		result.current.setLoginInfo(user2.id, user2.name);
		result.current.addRoom(groupForWaitingRoom);
		result.current.addMeeting(meetingForWaitingRoom);
		result.current.setChatsBeStatus(true);
		result.current.setWebsocketStatus(true);
	});
	useParams.mockReturnValue({ meetingId: groupForWaitingRoom.id });
	const { user } = setup(
		<MeetingAccessPage meetingName={meetingForWaitingRoom.name} hasUserDirectAccess={false} />
	);
	return { user, store: result.current };
};

const setupExternalUserForWaitingRoom = (): { user: UserEvent; store: RootStore } => {
	const { result } = renderHook(() => useStore());
	act(() => {
		localStorage.setItem(
			'ChatsMeetingSettings',
			JSON.stringify({ EnableCamera: true, EnableMicrophone: true })
		);
		result.current.setUserInfo(user3);
		result.current.setUserInfo(user2);
		result.current.setLoginInfo(guestUser.id, guestUser.name, guestUser.name, guestUser.type);
		result.current.addRoom(groupForWaitingRoom);
		result.current.addMeeting(meetingForWaitingRoom);
		result.current.setChatsBeStatus(true);
		result.current.setWebsocketStatus(true);
	});
	useParams.mockReturnValue({ meetingId: groupForWaitingRoom.id });
	const { user } = setup(
		<MeetingAccessPage meetingName={meetingForWaitingRoom.name} hasUserDirectAccess={false} />
	);
	return { user, store: result.current };
};

beforeAll(() => {
	mockMediaDevicesResolve();
});

describe('AccessMeeting - enter to meeting as a moderator or as a member of a group', () => {
	test('Enter to meeting', async () => {
		mockedEnterMeetingRequest.mockReturnValueOnce('meetingId');

		const { user } = setupBasicGroup();

		// Click on enter button to join the meeting
		const enterButton = await screen.findByText('Enter');
		await user.click(enterButton);

		expect(mockedEnterMeetingRequest).toHaveBeenCalled();
	});

	test('turn on video', async () => {
		mockedJoinMeetingRequest.mockReturnValueOnce(groupMeeting);

		const { user } = setupBasicGroup();

		const videoOff = screen.getByTestId(iconVideoOff);
		await user.click(videoOff);
		const videoOn = await screen.findAllByTestId(iconVideo);
		expect(videoOn).toHaveLength(2);
	});

	test('turn on audio', async () => {
		mockedJoinMeetingRequest.mockReturnValueOnce(groupMeeting);

		const { user } = setupBasicGroup();

		const audioOff = screen.getByTestId(iconMicOff);
		await user.click(audioOff);
		const audioOn = await screen.findAllByTestId('icon: Mic');
		expect(audioOn).toHaveLength(2);
	});

	test('try audio', async () => {
		const { user } = setupBasicGroup();

		const audioOff = screen.getByTestId(iconMicOff);
		await user.click(audioOff);
		const audioOn = await screen.findAllByTestId('icon: Mic');
		expect(audioOn[1]).toBeInTheDocument();
		const tryAudio = await screen.findByText(/Start mic test/i);
		expect(tryAudio).toBeEnabled();
		await user.click(tryAudio);
		const stopAudio = await screen.findByText(/Stop mic test/i);
		expect(stopAudio).toBeInTheDocument();
	});

	test('if networks connection are down, enter button should be disabled', async () => {
		setupBasicGroup();

		const enterButton = await screen.findByTestId('enterMeetingButton');
		expect(enterButton).toBeInTheDocument();

		// shutting down one of the network dependencies
		act(() => {
			useStore.getState().setChatsBeStatus(false);
		});

		const enterButtonUpdated = await screen.findByRole('button', { name: 'Enter' });
		expect(enterButtonUpdated).toBeDisabled();
	});

	test('if network connections are undefined, enter button should be disabled', async () => {
		setupGroupWithBeStatusUndefined();

		const enterButton = await screen.findByTestId('enterMeetingButton');
		expect(enterButton).toBeInTheDocument();

		await waitFor(() => {
			expect(enterButton).toBeDisabled();
		});
	});

	test('Enter to meeting fails', async () => {
		const error = jest.spyOn(console, 'error').mockImplementation();
		mockedEnterMeetingRequest.mockRejectedValue('rejected');

		const { user } = setupBasicGroup();

		// Click on enter button to join the meeting
		const enterButton = await screen.findByText('Enter');
		await user.click(enterButton);

		expect(error).toHaveBeenCalledWith('rejected', 'Error on joinMeeting');
		error.mockReset();
	});

	test('Select video device after turning on video', async () => {
		mockedJoinMeetingRequest.mockReturnValueOnce(groupMeeting);

		const { user } = setupBasicGroup();

		const videoOff = screen.getByTestId(iconVideoOff);
		await user.click(videoOff);
		const videoOn = await screen.findByTestId(iconVideo);
		expect(videoOn).toBeInTheDocument();

		const videoButtonSelect = await screen.findByText(/Video Default/i);
		await user.click(videoButtonSelect);

		const device = await screen.findByText(videoDevice2);
		expect(device).toBeInTheDocument();
		// not selected
		expect(device).toHaveStyle(normalFontWeight);

		await user.click(device);

		const videoButtonSelectUpdated = await screen.findByText(videoDevice2);

		await user.click(videoButtonSelectUpdated);
		const deviceSelected = await screen.findAllByText(videoDevice2);
		expect(deviceSelected[1]).toBeInTheDocument();
		// selected
		expect(deviceSelected[1]).toHaveStyle(boldFontWeight);
	});

	test('Select audio device after turning on audio', async () => {
		mockedJoinMeetingRequest.mockReturnValueOnce(groupMeeting);

		const { user } = setupBasicGroup();

		const audioOff = screen.getByTestId(iconMicOff);
		await user.click(audioOff);
		const audioOn = await screen.findAllByTestId('icon: Mic');
		expect(audioOn[0]).toBeInTheDocument();

		const audioButtonSelect = await screen.findByText(/Audio Default/i);
		await user.click(audioButtonSelect);

		const device = await screen.findByText(audioDevice2);
		expect(device).toBeInTheDocument();
		// not selected
		expect(device).toHaveStyle(normalFontWeight);

		await user.click(device);

		const audioButtonSelectUpdated = await screen.findByText(audioDevice2);

		await user.click(audioButtonSelectUpdated);
		const deviceSelected = await screen.findAllByText(audioDevice2);
		expect(deviceSelected[1]).toBeInTheDocument();
		// selected
		expect(deviceSelected[1]).toHaveStyle(boldFontWeight);
	});

	test('Enter button is enabled after selection of video source', async () => {
		mockedJoinMeetingRequest.mockReturnValueOnce(groupMeeting);

		const { user } = setupBasicGroup();

		const videoButtonSelect = await screen.findByText('Video Default');
		await user.click(videoButtonSelect);

		const device = await screen.findByText(videoDevice2);
		expect(device).toBeInTheDocument();
		await user.click(device);

		const videoOff = screen.getByTestId(iconVideoOff);
		await user.click(videoOff);
		const videoOn = await screen.findByTestId(iconVideo);
		expect(videoOn).toBeInTheDocument();

		await waitFor(() => {
			const enterButton = screen.getByTestId('enterMeetingButton');
			expect(enterButton).toBeEnabled();
		});
	});

	test('Enter button is enabled after selection of audio source', async () => {
		mockedJoinMeetingRequest.mockReturnValueOnce(groupMeeting);

		const { user } = setupBasicGroup();

		const audioButtonSelect = await screen.findByText(/Audio Default/i);
		await user.click(audioButtonSelect);

		const device = await screen.findByText(audioDevice2);
		expect(device).toBeInTheDocument();

		await user.click(device);

		const enterButton = screen.getByTestId('enterMeetingButton');
		expect(enterButton).toBeEnabled();
	});
});

describe('AccessMeeting - enter to meeting by waiting Room', () => {
	test('user leaves', async () => {
		const { user } = setupForWaitingRoom();

		const hangButton = await screen.findByTestId(iconLogOut);
		await user.click(hangButton);

		expect(mockGoToInfoPage).toHaveBeenCalledWith(PAGE_INFO_TYPE.HANG_UP_PAGE);
	});

	test('user is ready to participate', async () => {
		mockedJoinMeetingRequest.mockReturnValue({ status: 'WAITING' });
		const { user } = setupForWaitingRoom();

		const enterButton = await screen.findByText(readyButtonLabel);
		await user.click(enterButton);

		expect(mockedJoinMeetingRequest).toHaveBeenCalled();
	});

	test('user is ready to participate and leaves', async () => {
		mockedJoinMeetingRequest.mockReturnValue({ status: 'WAITING' });

		const { user } = setupForWaitingRoom();

		const enterButton = await screen.findByText(readyButtonLabel);
		await user.click(enterButton);

		const hangButton = await screen.findByTestId(iconLogOut);
		await user.click(hangButton);

		expect(mockGoToInfoPage).toHaveBeenCalledWith(PAGE_INFO_TYPE.HANG_UP_PAGE);
	});

	test('user is accepted in the scheduled meeting', async () => {
		mockedJoinMeetingRequest.mockReturnValue({ status: 'ACCEPTED' });
		mockedEnterMeetingRequest.mockReturnValue(acceptedInMeeting);
		const { user } = setupForWaitingRoom();

		const enterButton = await screen.findByText(readyButtonLabel);
		await user.click(enterButton);
		jest.advanceTimersByTime(1000);

		await waitFor(() =>
			sendCustomEvent({
				name: EventName.MEETING_USER_ACCEPTED,
				data: {
					type: WsEventType.MEETING_USER_ACCEPTED,
					userId: user3.id,
					sentDate: '1234567',
					meetingId: meetingForWaitingRoom.id
				}
			})
		);

		expect(mockGoToMeetingPage).toHaveBeenCalled();
	});

	test('user is not ready to participate and leaves', async () => {
		document.cookie = `ZM_AUTH_TOKEN=123456789; path=/`;
		document.cookie = `ZX_AUTH_TOKEN=123456789; path=/`;
		mockedJoinMeetingRequest.mockReturnValue({ status: 'WAITING' });

		const { user } = setupForWaitingRoom();

		const enterButton = await screen.findByText(readyButtonLabel);
		await user.click(enterButton);

		const hangButton = await screen.findByTestId(iconLogOut);
		await user.click(hangButton);

		expect(mockGoToInfoPage).toHaveBeenCalledWith(PAGE_INFO_TYPE.HANG_UP_PAGE);
		expect(document.cookie).toBe('ZM_AUTH_TOKEN=123456789; ZX_AUTH_TOKEN=123456789');
	});

	test('External user is not ready to participate and leaves', async () => {
		document.cookie = `ZM_AUTH_TOKEN=123456789; path=/`;
		document.cookie = `ZX_AUTH_TOKEN=123456789; path=/`;
		const { user } = setupExternalUserForWaitingRoom();

		const hangButton = await screen.findByTestId(iconLogOut);
		await user.click(hangButton);

		expect(mockGoToInfoPage).toHaveBeenCalledWith(PAGE_INFO_TYPE.HANG_UP_PAGE);
		expect(document.cookie).toBe('');
	});

	test('user is rejected by a moderator', async () => {
		mockedJoinMeetingRequest.mockReturnValue({ status: 'WAITING' });
		mockedEnterMeetingRequest.mockReturnValue(acceptedInMeeting);
		const { user } = setupForWaitingRoom();

		const enterButton = await screen.findByText(readyButtonLabel);
		await user.click(enterButton);

		expect(mockedJoinMeetingRequest).toHaveBeenCalled();

		await waitFor(() =>
			sendCustomEvent({
				name: EventName.MEETING_USER_REJECTED,
				data: {
					type: WsEventType.MEETING_USER_REJECTED,
					userId: user3.id,
					sentDate: '1234567',
					meetingId: meetingForWaitingRoom.id
				}
			})
		);

		expect(mockGoToInfoPage).toHaveBeenCalledWith(PAGE_INFO_TYPE.NEXT_TIME_PAGE);
	});

	test('user is waiting, not ready and the meeting and it finish before he can enter', async () => {
		setupForWaitingRoom();
		const enterButton = await screen.findByText(readyButtonLabel);
		expect(enterButton).toBeInTheDocument();
		await waitFor(() => {
			sendCustomEvent({
				name: EventName.MEETING_STOPPED,
				data: {
					type: WsEventType.MEETING_STOPPED,
					sentDate: '1234567',
					meetingId: meetingForWaitingRoom.id
				}
			});
		});

		expect(mockGoToInfoPage).toHaveBeenCalledWith(PAGE_INFO_TYPE.INVALID_WAITING_ROOM);
	});

	test('user is ready to participate and the meeting finish before he can enter', async () => {
		mockedJoinMeetingRequest.mockReturnValue({ status: 'WAITING' });
		mockedEnterMeetingRequest.mockReturnValue(acceptedInMeeting);
		const { user } = setupForWaitingRoom();
		const enterButton = await screen.findByText(readyButtonLabel);
		await user.click(enterButton);
		await waitFor(() => {
			sendCustomEvent({
				name: EventName.MEETING_STOPPED,
				data: {
					type: WsEventType.MEETING_STOPPED,
					sentDate: '1234567',
					meetingId: meetingForWaitingRoom.id
				}
			});
		});

		expect(mockGoToInfoPage).toHaveBeenCalledWith(PAGE_INFO_TYPE.INVALID_WAITING_ROOM);
	});

	test('user is in waiting room and enters from another tab', async () => {
		mockedJoinMeetingRequest.mockReturnValue({ status: 'WAITING' });
		mockedEnterMeetingRequest.mockReturnValue(acceptedInMeeting);
		const { user } = setupForWaitingRoom();
		const enterButton = await screen.findByText(readyButtonLabel);
		await user.click(enterButton);

		await waitFor(() => {
			sendCustomEvent({
				name: EventName.MEETING_WAITING_PARTICIPANT_CLASHED,
				data: {
					type: WsEventType.MEETING_WAITING_PARTICIPANT_CLASHED,
					sentDate: '1234567',
					meetingId: meetingForWaitingRoom.id
				}
			});
		});

		expect(mockGoToInfoPage).toHaveBeenCalledWith(PAGE_INFO_TYPE.ALREADY_ACTIVE_MEETING_SESSION);
	});
});
