/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { clone, differenceWith, flatMap, forEach, isEqual } from 'lodash';

import useStore from '../../store/Store';
import { MeetingParticipantBe } from '../../types/network/models/meetingBeTypes';
import { STREAM_TYPE, Subscription, SubscriptionMap } from '../../types/store/ActiveMeetingTypes';
import { MeetingsApi } from '../index';

class SubscriptionsManager {
	meetingId: string;

	allStreams: SubscriptionMap = {};

	subscriptions: SubscriptionMap = {};

	constructor(meetingId: string) {
		this.meetingId = meetingId;
	}

	public updateAllStreamMap(participants: MeetingParticipantBe[]): void {
		forEach(participants, (participant) => {
			if (participant.userId !== useStore.getState().session.id) {
				if (participant.videoStreamEnabled) {
					const subscriptionId = `${participant.userId}-${STREAM_TYPE.VIDEO}`;
					this.allStreams[subscriptionId] = {
						user_id: participant.userId,
						type: STREAM_TYPE.VIDEO
					};
				}
				if (participant.screenStreamEnabled) {
					const subscriptionId = `${participant.userId}-${STREAM_TYPE.SCREEN}`;
					this.allStreams[subscriptionId] = {
						user_id: participant.userId,
						type: STREAM_TYPE.SCREEN
					};
				}
			}
		});
		this.updateSubscription();
	}

	public addStreamToAsk(userId: string, type: STREAM_TYPE): void {
		if (userId !== useStore.getState().session.id) {
			const subscriptionId = `${userId}-${type}`;
			this.allStreams[subscriptionId] = {
				user_id: userId,
				type
			};
			this.updateSubscription();
		}
	}

	public removeStreamToAsk(userId: string, type: STREAM_TYPE): void {
		const subscriptionId = `${userId}-${type}`;
		delete this.allStreams[subscriptionId];
		this.updateSubscription();
	}

	// Ask subscriptions that are not already asked and unset subscriptions that are not needed anymore
	updateSubscription(subscriptionsToRequest?: Subscription[]): void {
		// Ask for all the possible subscriptions
		const subsToRequest = subscriptionsToRequest || flatMap(this.allStreams);
		const realSubs = flatMap(this.subscriptions);

		const subscriptionToAsk: Subscription[] = differenceWith(subsToRequest, realSubs, isEqual);
		// For the moment, avoid to set unsubscribed streams
		// const subscriptionToUnset: Subscription[] = differenceWith(realSubs, subsToRequest, isEqual);
		if (subscriptionToAsk.length !== 0) {
			MeetingsApi.subscribeToMedia(this.meetingId, subscriptionToAsk, []);
		}
		this.subscriptions = clone(this.allStreams);
	}

	clean(): void {
		this.allStreams = {};
		this.subscriptions = {};
	}
}

export default SubscriptionsManager;
