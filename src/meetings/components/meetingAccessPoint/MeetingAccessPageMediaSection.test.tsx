/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { screen, act } from '@testing-library/react';

import MeetingAccessPageMediaSection from './MeetingAccessPageMediaSection';
import { useParams } from '../../../../__mocks__/react-router';
import useStore from '../../../store/Store';
import {
	createMockMeeting,
	createMockParticipants,
	createMockRoom,
	createMockUser
} from '../../../tests/createMock';
import {
	mockedEnumerateDevices,
	mockedGetUserMedia,
	mockMediaDevicesReject
} from '../../../tests/mocks/global';
import { setup } from '../../../tests/test-utils';
import { MeetingBe } from '../../../types/network/models/meetingBeTypes';
import { MemberBe, RoomBe } from '../../../types/network/models/roomBeTypes';
import { UserBe } from '../../../types/network/models/userBeTypes';
import { MeetingParticipant } from '../../../types/store/MeetingTypes';
import { RoomType } from '../../../types/store/RoomTypes';

const iconVideoOff = 'icon: VideoOff';
const iconMicOff = 'icon: MicOff';

const user1: UserBe = createMockUser({ id: 'user1Id', name: 'user 1' });
const user2: UserBe = createMockUser({ id: 'user2Id', name: 'user 2' });

const member1: MemberBe = { userId: user1.id, owner: true };
const member2: MemberBe = { userId: user2.id, owner: false };

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

beforeAll(() => {
	mockMediaDevicesReject();
});

beforeEach(() => {
	const store = useStore.getState();
	store.setUserInfo(user1);
	store.setUserInfo(user2);
	store.setLoginInfo(user1.id, user1.name);
	store.addRoom(groupRoom);
	store.addMeeting(groupMeeting);
	store.setChatsBeStatus(true);
	store.setWebsocketStatus(true);
	store.meetingConnection(groupMeeting.id, false, undefined, false, undefined);
	localStorage.setItem(
		'ChatsMeetingSettings',
		JSON.stringify({ EnableCamera: false, EnableMicrophone: false })
	);
	useParams.mockReturnValue({ meetingId: groupMeeting.id });
});

describe('user not giving media permissions', () => {
	test('user gives not the media permissions and tries to open webcam', async () => {
		mockedEnumerateDevices.mockRejectedValue('error enumerateDevices');
		mockedGetUserMedia.mockRejectedValue('error getUserMedia');

		const err = jest.spyOn(console, 'error').mockImplementation();

		const { user } = setup(
			<MeetingAccessPageMediaSection
				streamTrack={null}
				setStreamTrack={jest.fn()}
				hasUserDirectAccess
				userIsReady
				meetingName={groupMeeting.name}
				wrapperWidth={100}
				handleEnterMeeting={jest.fn()}
				handleWaitingRoom={jest.fn()}
			/>
		);

		const videoOff = screen.getByTestId(iconVideoOff);
		await act(() => user.click(videoOff));

		const snackbar = await screen.findByText('Grant browser permissions to enable resources');

		expect(snackbar).toBeInTheDocument();
		expect(err).toHaveBeenCalled();
	});

	test('user gives not the media permissions and tries to open microphone', async () => {
		mockedEnumerateDevices.mockRejectedValue('error enumerateDevices');
		mockedGetUserMedia.mockRejectedValue('error getUserMedia');

		const err = jest.spyOn(console, 'error').mockImplementation();

		const { user } = setup(
			<MeetingAccessPageMediaSection
				streamTrack={null}
				setStreamTrack={jest.fn()}
				hasUserDirectAccess
				userIsReady
				meetingName={groupMeeting.name}
				wrapperWidth={100}
				handleEnterMeeting={jest.fn()}
				handleWaitingRoom={jest.fn()}
			/>
		);

		const micOff = screen.getByTestId(iconMicOff);
		await act(() => user.click(micOff));

		const snackbar = await screen.findByText('Grant browser permissions to enable resources');

		expect(snackbar).toBeInTheDocument();
		expect(err).toHaveBeenCalled();
	});

	test('Internal user joins meeting', async () => {
		const joinMeeting = jest.fn();
		const { user } = setup(
			<MeetingAccessPageMediaSection
				streamTrack={null}
				setStreamTrack={jest.fn()}
				hasUserDirectAccess
				userIsReady
				meetingName={groupMeeting.name}
				wrapperWidth={100}
				handleEnterMeeting={joinMeeting}
				handleWaitingRoom={jest.fn()}
			/>
		);
		const enterButton = screen.getByRole('button', { name: 'Enter' });
		expect(enterButton).toBeInTheDocument();
		await user.click(enterButton);
		expect(joinMeeting).toHaveBeenCalled();
	});

	test('User joins waiting room', async () => {
		const joinWaiting = jest.fn();
		const { user } = setup(
			<MeetingAccessPageMediaSection
				streamTrack={null}
				setStreamTrack={jest.fn()}
				hasUserDirectAccess={false}
				userIsReady={false}
				meetingName={groupMeeting.name}
				wrapperWidth={100}
				handleEnterMeeting={jest.fn()}
				handleWaitingRoom={joinWaiting}
			/>
		);
		const readyButton = screen.getByRole('button', { name: 'Ready to participate' });
		expect(readyButton).toBeInTheDocument();
		await user.click(readyButton);
		expect(joinWaiting).toHaveBeenCalled();
	});
});
