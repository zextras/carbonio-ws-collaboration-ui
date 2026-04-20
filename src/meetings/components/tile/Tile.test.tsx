/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { screen, act } from '@testing-library/react';
import { UserEvent } from '@testing-library/user-event';

import Tile from './Tile';
import useStore from '../../../store/Store';
import {
	createMockMeeting,
	createMockMember,
	createMockParticipants,
	createMockRoom,
	createMockUser
} from '../../../tests/createMock';
import { setup } from '../../../tests/test-utils';
import { MeetingBe } from '../../../types/network/models/meetingBeTypes';
import { MemberBe, RoomBe } from '../../../types/network/models/roomBeTypes';
import { UserBe } from '../../../types/network/models/userBeTypes';
import { STREAM_TYPE } from '../../../types/store/ActiveMeetingTypes';
import { MeetingParticipant } from '../../../types/store/MeetingTypes';
import { RootStore } from '../../../types/store/StoreTypes';

const iconVideoOffOutline = 'icon: VideoOffOutline';
const iconMicOffOutline = 'icon: MicOffOutline';

const user1: UserBe = createMockUser({ id: 'user1Id', name: 'user 1' });
const user2: UserBe = createMockUser({ id: 'user2Id', name: 'user 2' });
const user3: UserBe = createMockUser({ id: 'user3Id', name: 'user 3' });

const member1: MemberBe = createMockMember({ userId: user1.id, owner: true });
const member2: MemberBe = createMockMember({ userId: user2.id });
const member3: MemberBe = createMockMember({ userId: user3.id, owner: true });

const room: RoomBe = createMockRoom({ members: [member1, member2, member3] });

const user1Participant: MeetingParticipant = createMockParticipants({ userId: user1.id });
const user3Participant: MeetingParticipant = createMockParticipants({ userId: user3.id });
const user2Participant: MeetingParticipant = createMockParticipants({ userId: user2.id });
const meeting: MeetingBe = createMockMeeting({
	roomId: room.id,
	participants: [user1Participant, user2Participant, user3Participant]
});

const streamRef = React.createRef<HTMLVideoElement | null>();

const storeSetupMyTileAudioOnVideoOff = (): { user: UserEvent; store: RootStore } => {
	const store: RootStore = useStore.getState();
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

const setupActiveMeeting = (): void => {
	const store: RootStore = useStore.getState();
	store.meetingConnection(meeting.id, { enabled: true, deviceId: 'audioId' });
	store.setTalkingUser(user3.id, true);

	setup(
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
};

const storeSetupTileAudioOnAndVideoOff = (): { user: UserEvent; store: RootStore } => {
	const store: RootStore = useStore.getState();
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

beforeEach(() => {
	const store: RootStore = useStore.getState();
	store.setUserInfo([user1, user2, user3]);
	store.setLoginInfo({ id: user1.id, name: user1.name });
	store.addRooms([room]);
	store.addMeetings([meeting]);
});

describe('Tile test - enter meeting modal', () => {
	test('my tile - everything is rendered correctly', () => {
		storeSetupMyTileAudioOnVideoOff();
		const videoIcon = screen.getByTestId(iconVideoOffOutline);
		expect(videoIcon).toBeVisible();
		expect(screen.queryByTestId(iconMicOffOutline)).not.toBeInTheDocument();
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
		const videoIcon = screen.getByTestId(iconVideoOffOutline);
		expect(videoIcon).toBeVisible();
	});
	test('user tile - audio off and video on', async () => {
		storeSetupTileAudioOffAndVideoOn();
		expect(screen.queryByTestId(iconVideoOffOutline)).not.toBeInTheDocument();
		const audioIcon = screen.getByTestId(iconMicOffOutline);
		expect(audioIcon).toBeInTheDocument();
	});
	test('user tile - user is Talking', () => {
		setupActiveMeeting();
		const tile = screen.getByTestId('tile');
		expect(tile).toHaveStyle('outline: 0.125rem solid #8bc34a;');
	});
});

describe('Tile test - on meeting', () => {
	test('My tile - audio and video off ', async () => {
		const store = useStore.getState();
		store.meetingConnection(meeting.id, { enabled: true });
		setup(<Tile userId={user1.id} meetingId={meeting.id} />);
		expect(screen.getByTestId(iconMicOffOutline)).toBeInTheDocument();
		expect(screen.getByTestId(iconVideoOffOutline)).toBeInTheDocument();
	});

	test('My tile - audio and video on ', async () => {
		const store: RootStore = useStore.getState();
		store.meetingConnection(meeting.id, { enabled: true });
		store.changeStreamStatus(meeting.id, user1.id, STREAM_TYPE.AUDIO, true);
		store.changeStreamStatus(meeting.id, user1.id, STREAM_TYPE.VIDEO, true);
		setup(<Tile userId={user1.id} meetingId={meeting.id} />);
		expect(screen.queryByTestId(iconMicOffOutline)).not.toBeInTheDocument();
		expect(screen.queryByTestId(iconVideoOffOutline)).not.toBeInTheDocument();
	});

	test('My tile - screen share on', async () => {
		const store = useStore.getState();
		store.meetingConnection(meeting.id, { enabled: true });
		setup(<Tile userId={user1.id} meetingId={meeting.id} isScreenShare />);
		expect(screen.queryByTestId(iconMicOffOutline)).not.toBeInTheDocument();
		expect(screen.queryByTestId(iconVideoOffOutline)).not.toBeInTheDocument();
		expect(screen.getByTestId('icon: ScreenSharingOnOutline')).toBeInTheDocument();
	});

	test('User tile - audio and video off ', async () => {
		const store = useStore.getState();
		store.meetingConnection(meeting.id, { enabled: true });
		setup(<Tile userId={user2.id} meetingId={meeting.id} />);
		expect(screen.getByTestId(iconMicOffOutline)).toBeInTheDocument();
		expect(screen.getByTestId(iconVideoOffOutline)).toBeInTheDocument();
	});

	test('User tile - audio and video on ', async () => {
		const store = useStore.getState();
		store.meetingConnection(meeting.id, { enabled: true });
		store.changeStreamStatus(meeting.id, user2.id, STREAM_TYPE.AUDIO, true);
		store.changeStreamStatus(meeting.id, user2.id, STREAM_TYPE.VIDEO, true);
		setup(<Tile userId={user2.id} meetingId={meeting.id} />);
		// the logged user is a moderator, so he can see the mute button
		const micIcons = await screen.findAllByTestId(iconMicOffOutline);
		expect(micIcons).toHaveLength(1);
		expect(screen.queryByTestId(iconVideoOffOutline)).not.toBeInTheDocument();
	});

	test('User tile - screen share on', async () => {
		const store = useStore.getState();
		store.meetingConnection(meeting.id, { enabled: true });
		setup(<Tile userId={user1.id} meetingId={meeting.id} isScreenShare />);
		expect(screen.queryByTestId(iconMicOffOutline)).not.toBeInTheDocument();
		expect(screen.queryByTestId(iconVideoOffOutline)).not.toBeInTheDocument();
		expect(screen.getByTestId('icon: ScreenSharingOnOutline')).toBeInTheDocument();
	});

	test('Hand raised', async () => {
		const store = useStore.getState();
		store.meetingConnection(meeting.id, { enabled: true });
		setup(<Tile userId={user1.id} meetingId={meeting.id} />);

		act(() => {
			useStore.getState().setUserWithHandRaised(user1.id, true);
		});

		const tile = screen.getByTestId('tile');
		expect(tile).toHaveStyle('outline: 0.125rem solid #ffc107;');

		const hand = await screen.findByTestId('icon: Hand');
		expect(hand).toBeInTheDocument();
	});
});

describe('Tile actions', () => {
	test('mute for all appears and works if I am a moderator', async () => {
		const store = useStore.getState();
		store.meetingConnection(meeting.id, { enabled: true });
		store.changeStreamStatus(meeting.id, user2.id, STREAM_TYPE.AUDIO, true);
		store.changeStreamStatus(meeting.id, user2.id, STREAM_TYPE.VIDEO, true);

		const { user } = setup(<Tile userId={user2.id} meetingId={meeting.id} />);

		const hoverContainer = screen.getByTestId('hover_container');

		await user.hover(hoverContainer);

		const muteForAll = await screen.findByTestId(iconMicOffOutline);
		expect(muteForAll).toBeDefined();
		await user.click(muteForAll);

		const muteModal = await screen.findByTestId('mute_for_all_modal');
		expect(muteModal).toBeInTheDocument();

		const confirmButton = await screen.findByRole('button', { name: 'Mute for all' });

		await user.click(confirmButton);

		// the only icon is the one that appears when a user is muted
		expect(await screen.findAllByTestId(iconMicOffOutline)).toHaveLength(1);
	});

	test('mute for all does not appear if it is my tile', async () => {
		const store = useStore.getState();
		store.meetingConnection(meeting.id, { enabled: true });
		store.changeStreamStatus(meeting.id, user1.id, STREAM_TYPE.AUDIO, true);
		store.changeStreamStatus(meeting.id, user1.id, STREAM_TYPE.VIDEO, true);
		const { user } = setup(<Tile userId={user1.id} meetingId={meeting.id} />);

		const hoverContainer = screen.getByTestId('hover_container');
		await user.hover(hoverContainer);

		expect(screen.queryByTestId(iconMicOffOutline)).not.toBeInTheDocument();
	});

	test('mute for all does not appear if I am not a moderator', async () => {
		const store = useStore.getState();
		store.meetingConnection(meeting.id, { enabled: true });
		store.changeStreamStatus(meeting.id, user1.id, STREAM_TYPE.AUDIO, true);
		store.changeStreamStatus(meeting.id, user1.id, STREAM_TYPE.VIDEO, true);
		const { user } = setup(<Tile userId={user1.id} meetingId={meeting.id} />);

		const hoverContainer = screen.getByTestId('hover_container');
		await user.hover(hoverContainer);

		expect(screen.queryByTestId(iconMicOffOutline)).not.toBeInTheDocument();
	});
});
