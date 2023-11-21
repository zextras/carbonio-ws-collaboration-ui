/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { waitFor } from '@testing-library/react';
import { act, renderHook } from '@testing-library/react-hooks';
import { size } from 'lodash';

import SubscriptionsManager from './SubscriptionsManager';
import { mockedSubscribeToMediaRequest } from '../../../jest-mocks';
import useStore from '../../store/Store';
import {
	createMockMeeting,
	createMockMember,
	createMockParticipants,
	createMockRoom
} from '../../tests/createMock';
import { MeetingBe, MeetingParticipantBe } from '../../types/network/models/meetingBeTypes';
import { RoomBe, RoomType } from '../../types/network/models/roomBeTypes';
import { STREAM_TYPE, SubscriptionMap } from '../../types/store/ActiveMeetingTypes';
import { User } from '../../types/store/UserTypes';

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
	sessionId: 'sessionIdUser1',
	videoStreamEnabled: true
});

const user2Participant: MeetingParticipantBe = createMockParticipants({
	userId: 'user2',
	sessionId: 'sessionIdUser2',
	videoStreamEnabled: true
});

const user3Participant: MeetingParticipantBe = createMockParticipants({
	userId: 'user3',
	sessionId: 'sessionIdUser3',
	videoStreamEnabled: true
});

const user4Participant: MeetingParticipantBe = createMockParticipants({
	userId: 'user4',
	sessionId: 'sessionIdUser4',
	videoStreamEnabled: true
});

const user5Participant: MeetingParticipantBe = createMockParticipants({
	userId: 'user5',
	sessionId: 'sessionIdUser5',
	videoStreamEnabled: true
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

const participantsMapped: SubscriptionMap = {
	'user1-video': {
		userId: 'user1',
		type: STREAM_TYPE.VIDEO
	},
	'user2-video': {
		userId: 'user2',
		type: STREAM_TYPE.VIDEO
	},
	'user3-video': {
		userId: 'user3',
		type: STREAM_TYPE.VIDEO
	},
	'user4-video': {
		userId: 'user4',
		type: STREAM_TYPE.VIDEO
	}
};

describe('Test SubscriptionsManager', () => {
	test('Populate potential subscriptions', async () => {
		const { result } = renderHook(() => useStore());
		act(() => {
			result.current.setLoginInfo(user1Info.id, user1Info.email, user1Info.name);
			result.current.addRoom(groupRoom);
			result.current.addMeeting(groupMeeting);
			result.current.meetingConnection(groupMeeting.id, false, undefined, false, undefined);
		});
		mockedSubscribeToMediaRequest.mockReturnValue(true);
		const subscriptionsManager = new SubscriptionsManager('meetingId');
		subscriptionsManager.updateSubscription(participantsMapped);
		await waitFor(() => {
			expect(subscriptionsManager.subscriptions).toEqual(participantsMapped);
		});
	});

	test('Add single subscription', async () => {
		const { result } = renderHook(() => useStore());
		act(() => {
			result.current.setLoginInfo(user1Info.id, user1Info.email, user1Info.name);
			result.current.addRoom(groupRoom);
			result.current.addMeeting(groupMeeting);
			result.current.meetingConnection(groupMeeting.id, false, undefined, false, undefined);
		});
		mockedSubscribeToMediaRequest.mockReturnValue('ujji');
		const subscriptionsManager = new SubscriptionsManager('meetingId');
		subscriptionsManager.subscriptions = participantsMapped;
		console.log(subscriptionsManager.subscriptions);
		subscriptionsManager.addSubscription('user5', STREAM_TYPE.VIDEO);
		const addedSubscription = {
			userId: 'user5',
			type: STREAM_TYPE.VIDEO
		};
		await waitFor(() => {
			expect(size(subscriptionsManager.subscriptions)).toEqual(5);
		});
		expect(subscriptionsManager.subscriptions['user5-video']).toEqual(addedSubscription);
	});

	test('Remove single subscription', () => {
		const { result } = renderHook(() => useStore());
		act(() => {
			result.current.addRoom(groupRoom);
			result.current.addMeeting(groupMeeting);
			result.current.meetingConnection(groupMeeting.id, false, undefined, false, undefined);
		});
		const subscriptionsManager = new SubscriptionsManager('meetingId');
		subscriptionsManager.subscriptions = participantsMapped;
		subscriptionsManager.removeSubscription('user1', STREAM_TYPE.VIDEO);
		const updatedSubscription = { ...subscriptionsManager.subscriptions };
		delete updatedSubscription['user1-video'];
		expect(subscriptionsManager.subscriptions).toEqual(updatedSubscription);
	});
});
