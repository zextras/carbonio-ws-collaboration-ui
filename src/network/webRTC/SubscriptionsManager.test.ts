/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { act } from '@testing-library/react-hooks';

import SubscriptionsManager from './SubscriptionsManager';
import useStore from '../../store/Store';
import {
	createMockMeeting,
	createMockMember,
	createMockParticipants,
	createMockRoom
} from '../../tests/createMock';
import { mockedSubscribeToMediaRequest } from '../../tests/mocks/network';
import { MeetingBe, MeetingParticipantBe } from '../../types/network/models/meetingBeTypes';
import { RoomBe, RoomType } from '../../types/network/models/roomBeTypes';
import { WsEventType } from '../../types/network/websocket/wsEvents';
import { MeetingMediaStreamChangedEvent } from '../../types/network/websocket/wsMeetingEvents';
import { STREAM_TYPE } from '../../types/store/ActiveMeetingTypes';
import { User } from '../../types/store/UserTypes';
import { wsEventsHandler } from '../websocket/wsEventsHandler';

const user1Info: User = {
	id: 'user1',
	email: 'user1@domain.com',
	name: 'User 1'
};

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

const subscribeUrl = '/services/chats/meetings/meetingId/media/subscribe';

beforeEach(() => {
	act(() => {
		const store = useStore.getState();
		store.setLoginInfo(user1Info.id, user1Info.email, user1Info.name);
		store.addRoom(groupRoom);
		store.addMeeting(groupMeeting);
		store.meetingConnection(groupMeeting.id, false, undefined, false, undefined);
	});
});

describe('Test SubscriptionsManager', () => {
	test('Request all streams subscriptions', async () => {
		mockedSubscribeToMediaRequest.mockResolvedValue(true);
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
		expect(fetch).toHaveBeenCalledTimes(1);
		expect(fetch).toHaveBeenCalledWith(
			subscribeUrl,
			expect.objectContaining({
				body: JSON.stringify({
					subscribe: [
						{ userId: 'user2', type: STREAM_TYPE.VIDEO },
						{ userId: 'user2', type: STREAM_TYPE.SCREEN },
						{ userId: 'user3', type: STREAM_TYPE.VIDEO },
						{ userId: 'user4', type: STREAM_TYPE.VIDEO }
					],
					unsubscribe: []
				})
			})
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
		expect(fetch).toHaveBeenCalledTimes(1);
		expect(fetch).toHaveBeenCalledWith(
			subscribeUrl,
			expect.objectContaining({
				body: JSON.stringify({
					subscribe: [
						{ userId: 'user2', type: STREAM_TYPE.VIDEO },
						{ userId: 'user2', type: STREAM_TYPE.SCREEN }
					],
					unsubscribe: []
				})
			})
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

		expect(fetch).toHaveBeenCalledWith(
			subscribeUrl,
			expect.objectContaining({
				body: JSON.stringify({
					subscribe: [
						{ userId: 'user3', type: STREAM_TYPE.VIDEO },
						{ userId: 'user4', type: STREAM_TYPE.VIDEO }
					],
					unsubscribe: [{ userId: 'user2', type: STREAM_TYPE.SCREEN }]
				})
			})
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

		expect(fetch).toHaveBeenCalledWith(
			subscribeUrl,
			expect.objectContaining({
				body: JSON.stringify({
					subscribe: [],
					unsubscribe: [{ userId: 'user2', type: STREAM_TYPE.VIDEO }]
				})
			})
		);
	});

	test('Only one video subscribed sets video off', async () => {
		const subscriptionsManager = new SubscriptionsManager(groupMeeting.id);

		subscriptionsManager.subscriptions = [{ userId: 'user2', type: STREAM_TYPE.VIDEO }];

		subscriptionsManager.removeSubscription({ userId: 'user2', type: STREAM_TYPE.VIDEO });

		expect(fetch).toHaveBeenCalledWith(
			subscribeUrl,
			expect.objectContaining({
				body: JSON.stringify({
					subscribe: [],
					unsubscribe: [{ userId: 'user2', type: STREAM_TYPE.VIDEO }]
				})
			})
		);
	});

	test('Not subscribed stream sets video on', async () => {
		const subscriptionsManager = new SubscriptionsManager(groupMeeting.id);

		subscriptionsManager.subscriptions = [
			{ userId: 'user2', type: STREAM_TYPE.VIDEO },
			{ userId: 'user2', type: STREAM_TYPE.SCREEN }
		];

		wsEventsHandler({
			type: WsEventType.MEETING_MEDIA_STREAM_CHANGED,
			userId: 'user5',
			meetingId: groupMeeting.id,
			mediaType: STREAM_TYPE.VIDEO,
			active: true
		} as MeetingMediaStreamChangedEvent);

		subscriptionsManager.addSubscription({ userId: 'user5', type: STREAM_TYPE.VIDEO });

		expect(fetch).toHaveBeenCalledWith(
			subscribeUrl,
			expect.objectContaining({
				body: JSON.stringify({
					subscribe: [{ userId: 'user5', type: STREAM_TYPE.VIDEO }],
					unsubscribe: []
				})
			})
		);
	});
});
