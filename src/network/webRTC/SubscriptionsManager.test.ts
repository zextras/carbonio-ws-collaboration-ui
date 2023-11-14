/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import SubscriptionsManager from './SubscriptionsManager';
import { MeetingParticipantBe } from '../../types/network/models/meetingBeTypes';
import { STREAM_TYPE } from '../../types/store/ActiveMeetingTypes';

const joinTimeStamp = '2021-09-01T10:00:00.000Z';

const participants: MeetingParticipantBe[] = [
	{
		userId: 'user1',
		videoStreamEnabled: true,
		screenStreamEnabled: false,
		joinedAt: joinTimeStamp
	},
	{
		userId: 'user2',
		videoStreamEnabled: false,
		screenStreamEnabled: true,
		joinedAt: joinTimeStamp
	},
	{
		userId: 'user3',
		videoStreamEnabled: true,
		screenStreamEnabled: true,
		joinedAt: joinTimeStamp
	},
	{
		userId: 'user4',
		videoStreamEnabled: false,
		screenStreamEnabled: false,
		joinedAt: joinTimeStamp
	}
];

describe('Test SubscriptionsManager', () => {
	test('Populate potential subscriptions', () => {
		const subscriptionsManager = new SubscriptionsManager('meetingId');
		subscriptionsManager.updateAllStreamMap(participants);

		expect(subscriptionsManager.allStreams).toEqual({
			'user1-video': { userId: 'user1', type: 'video' },
			'user2-screen': { userId: 'user2', type: 'screen' },
			'user3-video': { userId: 'user3', type: 'video' },
			'user3-screen': { userId: 'user3', type: 'screen' }
		});
	});

	test('Add potential subscription', () => {
		const subscriptionsManager = new SubscriptionsManager('meetingId');
		subscriptionsManager.updateAllStreamMap(participants);
		subscriptionsManager.addStreamToAsk('user4', STREAM_TYPE.VIDEO);

		expect(subscriptionsManager.allStreams).toEqual({
			'user1-video': { userId: 'user1', type: 'video' },
			'user2-screen': { userId: 'user2', type: 'screen' },
			'user3-video': { userId: 'user3', type: 'video' },
			'user3-screen': { userId: 'user3', type: 'screen' },
			'user4-video': { userId: 'user4', type: 'video' }
		});
	});

	test('Remove potential subscription', () => {
		const subscriptionsManager = new SubscriptionsManager('meetingId');
		subscriptionsManager.updateAllStreamMap(participants);
		subscriptionsManager.removeStreamToAsk('user2', STREAM_TYPE.SCREEN);

		expect(subscriptionsManager.allStreams).toEqual({
			'user1-video': { userId: 'user1', type: 'video' },
			'user3-video': { userId: 'user3', type: 'video' },
			'user3-screen': { userId: 'user3', type: 'screen' }
		});
	});
});
