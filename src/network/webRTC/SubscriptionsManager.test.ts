/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import SubscriptionsManager from './SubscriptionsManager';
import useStore from '../../store/Store';
import {
	createMockMeeting,
	createMockMember,
	createMockParticipants,
	createMockRoom,
	createMockUser
} from '../../tests/createMock';
import { MeetingBe, MeetingParticipantBe } from '../../types/network/models/meetingBeTypes';
import { RoomBe, RoomType } from '../../types/network/models/roomBeTypes';
import { STREAM_TYPE } from '../../types/store/ActiveMeetingTypes';
import { User } from '../../types/store/UserTypes';
import * as api from 'wsc-shared';

const user1Info: User = createMockUser({
	id: 'user1',
	email: 'user1@domain.com',
	name: 'User 1'
});

const groupRoom: RoomBe = createMockRoom({
	id: 'room-test',
	type: RoomType.GROUP,
	members: [
		createMockMember({ userId: 'user1', owner: true }),
		createMockMember({ userId: 'user2', owner: true }),
		createMockMember({ userId: 'user3', owner: true }),
		createMockMember({ userId: 'user4', owner: true }),
		createMockMember({ userId: 'user5', owner: true })
	],
	userSettings: { muted: false }
});

const user1Participant: MeetingParticipantBe = createMockParticipants({
	userId: 'user1',
	videoStreamEnabled: true,
	screenStreamEnabled: true
});

const user2Participant: MeetingParticipantBe = createMockParticipants({
	userId: 'user2',
	videoStreamEnabled: true,
	screenStreamEnabled: true
});

const user3Participant: MeetingParticipantBe = createMockParticipants({
	userId: 'user3',
	videoStreamEnabled: true
});

const user4Participant: MeetingParticipantBe = createMockParticipants({
	userId: 'user4',
	videoStreamEnabled: true
});

const user5Participant: MeetingParticipantBe = createMockParticipants({
	userId: 'user5',
	videoStreamEnabled: false
});

const groupMeeting: MeetingBe = createMockMeeting({
	roomId: groupRoom.id,
	participants: [
		user1Participant,
		user2Participant,
		user3Participant,
		user4Participant,
		user5Participant
	]
});

let spyOnSubscribeToMedia: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
	spyOnSubscribeToMedia = vi.spyOn(api, 'subscribeToMedia').mockResolvedValue({} as Response);
	const store = useStore.getState();
	store.setLoginInfo({ id: user1Info.id, name: user1Info.email, displayName: user1Info.name });
	store.addRooms([groupRoom]);
	store.addMeetings([groupMeeting]);
	store.meetingConnection(groupMeeting.id);
});

describe('Test SubscriptionsManager', () => {
	test('Request all streams subscriptions', async () => {
		const subscriptionsManager = new SubscriptionsManager(groupMeeting.id);
		subscriptionsManager.updateSubscription([
			{ userId: 'user1', type: STREAM_TYPE.VIDEO },
			{ userId: 'user1', type: STREAM_TYPE.SCREEN },
			{ userId: 'user2', type: STREAM_TYPE.VIDEO },
			{ userId: 'user2', type: STREAM_TYPE.SCREEN },
			{ userId: 'user3', type: STREAM_TYPE.VIDEO },
			{ userId: 'user4', type: STREAM_TYPE.VIDEO },
			{ userId: 'user5', type: STREAM_TYPE.VIDEO }
		]);
		expect(spyOnSubscribeToMedia).toHaveBeenCalledTimes(1);
		expect(spyOnSubscribeToMedia).toHaveBeenCalledWith(
			groupMeeting.id,
			[
				{ userId: 'user2', type: STREAM_TYPE.VIDEO },
				{ userId: 'user2', type: STREAM_TYPE.SCREEN },
				{ userId: 'user3', type: STREAM_TYPE.VIDEO },
				{ userId: 'user4', type: STREAM_TYPE.VIDEO }
			],
			[]
		);
	});

	test('Subscribe only to some streams', async () => {
		const subscriptionsManager = new SubscriptionsManager(groupMeeting.id);
		subscriptionsManager.updateSubscription([
			{ userId: 'user1', type: STREAM_TYPE.VIDEO },
			{ userId: 'user2', type: STREAM_TYPE.VIDEO },
			{ userId: 'user2', type: STREAM_TYPE.SCREEN },
			{ userId: 'user5', type: STREAM_TYPE.VIDEO }
		]);
		expect(spyOnSubscribeToMedia).toHaveBeenCalledTimes(1);
		expect(spyOnSubscribeToMedia).toHaveBeenCalledWith(
			groupMeeting.id,
			[
				{ userId: 'user2', type: STREAM_TYPE.VIDEO },
				{ userId: 'user2', type: STREAM_TYPE.SCREEN }
			],
			[]
		);
	});

	test('Add and remove subscriptions', async () => {
		const subscriptionsManager = new SubscriptionsManager(groupMeeting.id);
		subscriptionsManager.subscriptions = [
			{ userId: 'user2', type: STREAM_TYPE.VIDEO },
			{ userId: 'user2', type: STREAM_TYPE.SCREEN }
		];

		subscriptionsManager.updateSubscription([
			{ userId: 'user1', type: STREAM_TYPE.SCREEN },
			{ userId: 'user2', type: STREAM_TYPE.VIDEO },
			{ userId: 'user3', type: STREAM_TYPE.VIDEO },
			{ userId: 'user4', type: STREAM_TYPE.VIDEO }
		]);

		expect(spyOnSubscribeToMedia).toHaveBeenCalledWith(
			groupMeeting.id,
			[
				{ userId: 'user3', type: STREAM_TYPE.VIDEO },
				{ userId: 'user4', type: STREAM_TYPE.VIDEO }
			],
			[{ userId: 'user2', type: STREAM_TYPE.SCREEN }]
		);
	});

	test('Subscribed stream sets video off', async () => {
		const subscriptionsManager = new SubscriptionsManager(groupMeeting.id);

		subscriptionsManager.subscriptions = [
			{ userId: 'user1', type: STREAM_TYPE.VIDEO },
			{ userId: 'user2', type: STREAM_TYPE.VIDEO },
			{ userId: 'user2', type: STREAM_TYPE.SCREEN }
		];

		subscriptionsManager.removeSubscription({ userId: 'user2', type: STREAM_TYPE.VIDEO });

		expect(spyOnSubscribeToMedia).toHaveBeenCalledWith(
			groupMeeting.id,
			[],
			[{ userId: 'user2', type: STREAM_TYPE.VIDEO }]
		);
	});

	test('Only one video subscribed sets video off', async () => {
		const subscriptionsManager = new SubscriptionsManager(groupMeeting.id);

		subscriptionsManager.subscriptions = [{ userId: 'user2', type: STREAM_TYPE.VIDEO }];

		subscriptionsManager.removeSubscription({ userId: 'user2', type: STREAM_TYPE.VIDEO });

		expect(spyOnSubscribeToMedia).toHaveBeenCalledWith(
			groupMeeting.id,
			[],
			[{ userId: 'user2', type: STREAM_TYPE.VIDEO }]
		);
	});

	test('Not subscribed stream sets video on', async () => {
		const subscriptionsManager = new SubscriptionsManager(groupMeeting.id);

		subscriptionsManager.subscriptions = [
			{ userId: 'user2', type: STREAM_TYPE.VIDEO },
			{ userId: 'user2', type: STREAM_TYPE.SCREEN }
		];

		useStore.getState().changeStreamStatus(groupMeeting.id, 'user5', STREAM_TYPE.VIDEO, true);

		subscriptionsManager.addSubscription({ userId: 'user5', type: STREAM_TYPE.VIDEO });

		expect(spyOnSubscribeToMedia).toHaveBeenCalledWith(
			groupMeeting.id,
			[{ userId: 'user5', type: STREAM_TYPE.VIDEO }],
			[]
		);
	});
});
