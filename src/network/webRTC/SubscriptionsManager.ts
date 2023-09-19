/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { forEach } from 'lodash';

import useStore from '../../store/Store';
import { MeetingParticipantBe } from '../../types/network/models/meetingBeTypes';
import { STREAM_TYPE, Subscription, SubscriptionMap } from '../../types/store/ActiveMeetingTypes';
import { MeetingsApi } from '../index';

class SubscriptionsManager {
	meetingId: string;

	potentialSubscriptions: SubscriptionMap = {};

	realSubscription: SubscriptionMap = {};

	constructor(meetingId: string) {
		this.meetingId = meetingId;
	}

	public updatePossibleSubscription(participants: MeetingParticipantBe[]): void {
		forEach(participants, (participant) => {
			if (participant.userId !== useStore.getState().session.id) {
				if (participant.videoStreamEnabled) {
					const subscriptionId = `${participant.userId}-${STREAM_TYPE.VIDEO}`;
					this.potentialSubscriptions[subscriptionId] = {
						user_id: participant.userId,
						type: STREAM_TYPE.VIDEO
					};
				}
				if (participant.screenStreamEnabled) {
					const subscriptionId = `${participant.userId}-${STREAM_TYPE.SCREEN}`;
					this.potentialSubscriptions[subscriptionId] = {
						user_id: participant.userId,
						type: STREAM_TYPE.SCREEN
					};
				}
			}
		});
	}

	public addPossibleSubscription(userId: string, type: STREAM_TYPE): void {
		const subscriptionId = `${userId}-${type}`;
		this.potentialSubscriptions[subscriptionId] = {
			user_id: userId,
			type
		};
	}

	public removePossibleSubscription(userId: string, type: STREAM_TYPE): void {
		const subscriptionId = `${userId}-${type}`;
		delete this.potentialSubscriptions[subscriptionId];
	}

	updateSubscription(): void {
		// TODO
		const subscriptionToAsk: Subscription[] = [];
		const subscriptionToUnset: Subscription[] = [];
		MeetingsApi.subscribeToMedia(this.meetingId, subscriptionToAsk, subscriptionToUnset);
	}

	clean(): void {
		this.potentialSubscriptions = {};
		this.realSubscription = {};
	}
}

export default SubscriptionsManager;
