/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import SubscriptionsManager from './SubscriptionsManager';
import { MeetingParticipantBe } from '../../types/network/models/meetingBeTypes';
import { STREAM_TYPE } from '../../types/store/ActiveMeetingTypes';

const participants: MeetingParticipantBe[] = [
	{ userId: 'user1', videoStreamEnabled: true, screenStreamEnabled: false },
	{ userId: 'user2', videoStreamEnabled: false, screenStreamEnabled: true },
	{ userId: 'user3', videoStreamEnabled: true, screenStreamEnabled: true },
	{ userId: 'user4', videoStreamEnabled: false, screenStreamEnabled: false }
];

describe('Test SubscriptionsManager', () => {
	test('Populate potential subscriptions', () => {
		const subscriptionsManager = new SubscriptionsManager('meetingId');
		subscriptionsManager.updatePossibleSubscription(participants);

		expect(subscriptionsManager.potentialSubscriptions).toEqual({
			'user1-video': { user_id: 'user1', type: 'video' },
			'user2-screen': { user_id: 'user2', type: 'screen' },
			'user3-video': { user_id: 'user3', type: 'video' },
			'user3-screen': { user_id: 'user3', type: 'screen' }
		});
	});

	test('Add potential subscription', () => {
		const subscriptionsManager = new SubscriptionsManager('meetingId');
		subscriptionsManager.updatePossibleSubscription(participants);
		subscriptionsManager.addPossibleSubscription('user4', STREAM_TYPE.VIDEO);

		expect(subscriptionsManager.potentialSubscriptions).toEqual({
			'user1-video': { user_id: 'user1', type: 'video' },
			'user2-screen': { user_id: 'user2', type: 'screen' },
			'user3-video': { user_id: 'user3', type: 'video' },
			'user3-screen': { user_id: 'user3', type: 'screen' },
			'user4-video': { user_id: 'user4', type: 'video' }
		});
	});

	test('Remove potential subscription', () => {
		const subscriptionsManager = new SubscriptionsManager('meetingId');
		subscriptionsManager.updatePossibleSubscription(participants);
		subscriptionsManager.removePossibleSubscription('user2', STREAM_TYPE.SCREEN);

		expect(subscriptionsManager.potentialSubscriptions).toEqual({
			'user1-video': { user_id: 'user1', type: 'video' },
			'user3-video': { user_id: 'user3', type: 'video' },
			'user3-screen': { user_id: 'user3', type: 'screen' }
		});
	});
});
