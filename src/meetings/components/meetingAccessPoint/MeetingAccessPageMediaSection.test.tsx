/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { screen } from '@testing-library/react';
import { renderHook } from '@testing-library/react-hooks';
import { UserEvent } from '@testing-library/user-event';
import { act } from 'react-dom/test-utils';

import MeetingAccessPageTODELETE from './MeetingAccessPageTODELETE';
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
import { RootStore } from '../../../types/store/StoreTypes';

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

const canAccessMeeting = true;

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
		result.current.meetingConnection(groupMeeting.id, false, undefined, false, undefined);
	});
	useParams.mockReturnValue({ meetingId: groupMeeting.id });
	const { user } = setup(
		<MeetingAccessPageTODELETE
			meetingName={groupMeeting.name}
			hasUserDirectAccess={canAccessMeeting}
		/>
	);
	return { user, store: result.current };
};

beforeAll(() => {
	mockMediaDevicesReject();
});

describe('user not giving media permissions', () => {
	test('user gives not the media permissions and tries to open webcam', async () => {
		mockedEnumerateDevices.mockRejectedValue('error enumerateDevices');
		mockedGetUserMedia.mockRejectedValue('error getUserMedia');

		const err = jest.spyOn(console, 'error').mockImplementation();

		const { user } = setupBasicGroup();

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

		const { user } = setupBasicGroup();

		const micOff = screen.getByTestId(iconMicOff);
		await act(() => user.click(micOff));

		const snackbar = await screen.findByText('Grant browser permissions to enable resources');

		expect(snackbar).toBeInTheDocument();
		expect(err).toHaveBeenCalled();
	});
});
