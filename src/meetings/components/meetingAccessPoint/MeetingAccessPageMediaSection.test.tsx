/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { screen } from '@testing-library/react';
import * as ReactRouter from 'react-router-dom';

import MeetingAccessPageMediaSection from './MeetingAccessPageMediaSection';
import useStore from '../../../store/Store';
import {
	createMockMeeting,
	createMockParticipants,
	createMockRoom,
	createMockUser
} from '../../../tests/createMock';
import { setup } from '../../../tests/test-utils';
import { MeetingBe } from '../../../types/network/models/meetingBeTypes';
import { MemberBe, RoomBe } from '../../../types/network/models/roomBeTypes';
import { UserBe } from '../../../types/network/models/userBeTypes';
import { MeetingParticipant } from '../../../types/store/MeetingTypes';
import { RoomType } from '../../../types/store/RoomTypes';

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

const user1Participant: MeetingParticipant = createMockParticipants({ userId: 'user1' });

const user2Participant: MeetingParticipant = createMockParticipants({ userId: 'user2' });

const groupMeeting: MeetingBe = createMockMeeting({
	roomId: groupRoom.id,
	participants: [user1Participant, user2Participant]
});

beforeEach(() => {
	const store = useStore.getState();
	store.setUserInfo([user1, user2]);
	store.setLoginInfo(user1.id, user1.name);
	store.addRooms([groupRoom]);
	store.addMeetings([groupMeeting]);
	store.setChatsBeStatus(true);
	store.setWebsocketStatus(true);
	store.meetingConnection(groupMeeting.id);
	localStorage.setItem(
		'ChatsMeetingSettings',
		JSON.stringify({ EnableCamera: false, EnableMicrophone: false })
	);
	const spyUseParams = vi.spyOn(ReactRouter, 'useParams');
	spyUseParams.mockReturnValue({ meetingId: groupMeeting.id });
});

describe('MeetingAccessPageMediaSection tests', () => {
	test('User does not give the media permissions', async () => {
		vi.spyOn(navigator.mediaDevices, 'getUserMedia').mockRejectedValue('error getUserMedia');
		setup(
			<MeetingAccessPageMediaSection
				hasUserDirectAccess
				userIsReady
				meetingName={groupMeeting.name}
				wrapperWidth={100}
				handleEnterMeeting={vi.fn()}
				handleWaitingRoom={vi.fn()}
				setMediaStatus={vi.fn()}
			/>
		);
		const snackbars = await screen.findAllByText('Grant browser permissions to enable resources');
		expect(snackbars[0]).toBeInTheDocument();
	});

	test('Internal user joins meeting', async () => {
		const joinMeeting = vi.fn();
		const { user } = setup(
			<MeetingAccessPageMediaSection
				hasUserDirectAccess
				userIsReady
				meetingName={groupMeeting.name}
				wrapperWidth={100}
				handleEnterMeeting={joinMeeting}
				handleWaitingRoom={vi.fn()}
				setMediaStatus={vi.fn()}
			/>
		);
		const enterButton = screen.getByRole('button', { name: 'Enter' });
		expect(enterButton).toBeInTheDocument();
		await user.click(enterButton);
		expect(joinMeeting).toHaveBeenCalled();
	});

	test('User joins waiting room', async () => {
		const joinWaiting = vi.fn();
		const { user } = setup(
			<MeetingAccessPageMediaSection
				hasUserDirectAccess={false}
				userIsReady={false}
				meetingName={groupMeeting.name}
				wrapperWidth={100}
				handleEnterMeeting={vi.fn()}
				handleWaitingRoom={joinWaiting}
				setMediaStatus={vi.fn()}
			/>
		);
		const readyButton = screen.getByRole('button', { name: 'Ready to participate' });
		expect(readyButton).toBeInTheDocument();
		await user.click(readyButton);
		expect(joinWaiting).toHaveBeenCalled();
	});
});
