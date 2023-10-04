/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { screen } from '@testing-library/react';
import { UserEvent } from '@testing-library/user-event/setup/setup';
import React from 'react';

import Tile from './Tile';
import useStore from '../../store/Store';
import {
	createMockMeeting,
	createMockParticipants,
	createMockRoom,
	createMockUser
} from '../../tests/createMock';
import { setup } from '../../tests/test-utils';
import { MeetingBe } from '../../types/network/models/meetingBeTypes';
import { MemberBe, RoomBe, RoomType } from '../../types/network/models/roomBeTypes';
import { UserBe } from '../../types/network/models/userBeTypes';
import { STREAM_TYPE } from '../../types/store/ActiveMeetingTypes';
import { MeetingParticipant } from '../../types/store/MeetingTypes';
import { RootStore } from '../../types/store/StoreTypes';

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

const streamRef = React.createRef<HTMLVideoElement | null>();

const storeBasicActiveMeetingSetup = (): void => {
	const store: RootStore = useStore.getState();
	store.setLoginInfo(user1.id, user1.name);
	store.setUserInfo(user1);
	store.setUserInfo(user2);
	store.setUserInfo(user3);
	store.addRoom(room);
	store.addMeeting(meeting);
	store.meetingConnection(meeting.id, false, undefined, false, undefined);
};

const storeSetupMyTileAudioOnVideoOff = (): { user: UserEvent; store: RootStore } => {
	const store: RootStore = useStore.getState();
	store.setUserInfo(user1);
	store.setUserInfo(user2);
	store.setUserInfo(user3);
	store.setLoginInfo(user1.id, user1.name);
	store.addRoom(room);
	store.addMeeting(meeting);
	const { user } = setup(
		<Tile
			userId={user1.id}
			meetingId={meeting.id}
			modalProps={{
				streamRef,
				audioStreamEnabled: true,
				streamMuted: true,
				videoStreamEnabled: false
			}}
		/>
	);
	return { user, store };
};

const storeSetupTileAudioOffAndVideoOn = (): { user: UserEvent; store: RootStore } => {
	const store: RootStore = useStore.getState();
	store.setUserInfo(user1);
	store.setUserInfo(user2);
	store.setUserInfo(user3);
	store.setLoginInfo(user1.id, user1.name);
	store.addRoom(room);
	store.addMeeting(meeting);
	const { user } = setup(
		<Tile
			userId={user2.id}
			meetingId={meeting.id}
			modalProps={{
				streamRef,
				audioStreamEnabled: false,
				streamMuted: true,
				videoStreamEnabled: true
			}}
		/>
	);
	return { user, store };
};

const storeSetupTileAudioOnAndVideoOff = (): { user: UserEvent; store: RootStore } => {
	const store: RootStore = useStore.getState();
	store.setUserInfo(user1);
	store.setUserInfo(user2);
	store.setUserInfo(user3);
	store.setLoginInfo(user1.id, user1.name);
	store.addRoom(room);
	store.addMeeting(meeting);
	const { user } = setup(
		<Tile
			userId={user3.id}
			meetingId={meeting.id}
			modalProps={{
				streamRef,
				audioStreamEnabled: true,
				streamMuted: true,
				videoStreamEnabled: false
			}}
		/>
	);
	return { user, store };
};

describe('Tile test - enter meeting modal', () => {
	test('my tile - everything is rendered correctly', () => {
		storeSetupMyTileAudioOnVideoOff();
		const videoIcon = screen.getByTestId('icon: VideoOffOutline');
		expect(videoIcon).toBeVisible();
		expect(screen.queryByTestId('icon: MicOffOutline')).not.toBeInTheDocument();
		const name = screen.getByText(user1.name);
		expect(name).toBeInTheDocument();
		const avatar = screen.getByTestId('avatar_box');
		expect(avatar).toBeInTheDocument();
	});
	test('my tile - hover on tile', async () => {
		const { user } = storeSetupMyTileAudioOnVideoOff();
		const tile = screen.getByTestId('tile');
		await user.hover(tile);
		expect(screen.queryByTestId('hover_container')).not.toBeInTheDocument();
	});
	test('user tile - audio on and video off', async () => {
		storeSetupTileAudioOnAndVideoOff();
		const videoIcon = screen.getByTestId('icon: VideoOffOutline');
		expect(videoIcon).toBeVisible();
	});
	test('user tile - audio off and video on', async () => {
		storeSetupTileAudioOffAndVideoOn();
		expect(screen.queryByTestId('icon: VideoOffOutline')).not.toBeInTheDocument();
		const audioIcon = screen.getByTestId('icon: MicOffOutline');
		expect(audioIcon).toBeInTheDocument();
	});
});

describe('Tile test - on meeting', () => {
	test('My tile - audio and video off ', async () => {
		storeBasicActiveMeetingSetup();
		setup(<Tile userId={user1.id} meetingId={meeting.id} />);
		expect(screen.getByTestId('icon: MicOffOutline')).toBeInTheDocument();
		expect(screen.getByTestId('icon: VideoOffOutline')).toBeInTheDocument();
	});

	test('My tile - audio and video on ', async () => {
		storeBasicActiveMeetingSetup();
		const store: RootStore = useStore.getState();
		store.changeStreamStatus(meeting.id, user1.id, STREAM_TYPE.AUDIO, true);
		store.changeStreamStatus(meeting.id, user1.id, STREAM_TYPE.VIDEO, true);
		setup(<Tile userId={user1.id} meetingId={meeting.id} />);
		expect(screen.queryByTestId('icon: MicOffOutline')).not.toBeInTheDocument();
		expect(screen.queryByTestId('icon: VideoOffOutline')).not.toBeInTheDocument();
	});

	test('My tile - screen share on', async () => {
		storeBasicActiveMeetingSetup();
		setup(<Tile userId={user1.id} meetingId={meeting.id} isScreenShare />);
		expect(screen.queryByTestId('icon: MicOffOutline')).not.toBeInTheDocument();
		expect(screen.queryByTestId('icon: VideoOffOutline')).not.toBeInTheDocument();
		expect(screen.getByTestId('icon: ScreenSharingOnOutline')).toBeInTheDocument();
	});

	test('User tile - audio and video off ', async () => {
		storeBasicActiveMeetingSetup();
		setup(<Tile userId={user2.id} meetingId={meeting.id} />);
		expect(screen.getByTestId('icon: MicOffOutline')).toBeInTheDocument();
		expect(screen.getByTestId('icon: VideoOffOutline')).toBeInTheDocument();
	});

	test('User tile - audio and video on ', async () => {
		storeBasicActiveMeetingSetup();
		const store: RootStore = useStore.getState();
		store.changeStreamStatus(meeting.id, user2.id, STREAM_TYPE.AUDIO, true);
		store.changeStreamStatus(meeting.id, user2.id, STREAM_TYPE.VIDEO, true);
		setup(<Tile userId={user2.id} meetingId={meeting.id} />);
		expect(screen.queryByTestId('icon: MicOffOutline')).not.toBeInTheDocument();
		expect(screen.queryByTestId('icon: VideoOffOutline')).not.toBeInTheDocument();
	});

	test('user tile - screen share on', async () => {
		storeBasicActiveMeetingSetup();
		setup(<Tile userId={user1.id} meetingId={meeting.id} isScreenShare />);
		expect(screen.queryByTestId('icon: MicOffOutline')).not.toBeInTheDocument();
		expect(screen.queryByTestId('icon: VideoOffOutline')).not.toBeInTheDocument();
		expect(screen.getByTestId('icon: ScreenSharingOnOutline')).toBeInTheDocument();
	});
});
