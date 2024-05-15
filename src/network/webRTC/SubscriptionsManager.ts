/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { concat, differenceWith, filter, find, isEqual, remove, size } from 'lodash';

import PendingSubscriptionManager from './PendingSubscriptionRequest';
import useStore from '../../store/Store';
import { STREAM_TYPE, Subscription } from '../../types/store/ActiveMeetingTypes';
import { MeetingsApi } from '../index';

class SubscriptionsManager {
	meetingId: string;

	myUserId: string | undefined;

	subscriptions: Subscription[] = [];

	pendingSubscription: PendingSubscriptionManager;

	constructor(meetingId: string) {
		this.meetingId = meetingId;
		this.myUserId = useStore.getState().session.id;
		this.pendingSubscription = new PendingSubscriptionManager(this.updateSubscription);
	}

	private filterSubscription(desiderata: Subscription[]): Subscription[] {
		const participants = find(
			useStore.getState().meetings,
			(meeting) => meeting.id === this.meetingId
		)?.participants;
		return filter(desiderata, (sub) => {
			const meetingParticipant = participants?.[sub.userId];
			const isMyStream = meetingParticipant?.userId === this.myUserId;
			const isVideoSubOn = sub.type === STREAM_TYPE.VIDEO && !!meetingParticipant?.videoStreamOn;
			const isScreenSubOn = sub.type === STREAM_TYPE.SCREEN && !!meetingParticipant?.screenStreamOn;
			return !isMyStream && (isVideoSubOn || isScreenSubOn);
		});
	}

	private subscribeToMedia(
		subscriptionToAdd: Subscription[],
		subscriptionToRemove: Subscription[]
	): void {
		this.pendingSubscription.subscriptionRequesting();
		MeetingsApi.subscribeToMedia(this.meetingId, subscriptionToAdd, subscriptionToRemove)
			.then(() => {
				this.subscriptions = concat(this.subscriptions, subscriptionToAdd);
				this.subscriptions = differenceWith(this.subscriptions, subscriptionToRemove, isEqual);

				this.pendingSubscription.subscriptionRequestDone();
			})
			.catch(() => this.pendingSubscription.subscriptionRequestDone());
	}

	// Delete the subscription when user leaves the meeting
	public deleteSubscription(subIdToDelete: string): void {
		remove(this.subscriptions, (sub) => sub.userId === subIdToDelete);
	}

	public removeSubscription(subToRemove: Subscription): void {
		if (
			find(
				this.subscriptions,
				(sub) => sub.userId === subToRemove.userId && sub.type === subToRemove.type
			)
		) {
			const subsToRem = filter(
				this.subscriptions,
				(sub) => sub.userId !== subToRemove.userId || sub.type !== subToRemove.type
			);
			this.updateSubscription(subsToRem);
		}
	}

	public addSubscription(subToAdd: Subscription): void {
		if (
			!find(
				this.subscriptions,
				(sub) => sub.userId === subToAdd.userId && sub.type === subToAdd.type
			)
		) {
			this.updateSubscription([...this.subscriptions, subToAdd]);
		}
	}

	// Ask subscriptions that are not already asked and unset subscriptions that are not needed anymore
	public updateSubscription(subsToRequest: Subscription[]): void {
		// Check if a request is already in progress
		if (this.pendingSubscription.checkRequestStatus(subsToRequest)) {
			return;
		}

		if (!isEqual(subsToRequest, this.subscriptions)) {
			const subToAdd = this.filterSubscription(
				differenceWith(subsToRequest, this.subscriptions, isEqual)
			);
			const subToRemove = this.filterSubscription(
				differenceWith(this.subscriptions, subsToRequest, isEqual)
			);
			if (size(subToAdd) > 0 || size(subToRemove) > 0) {
				this.subscribeToMedia(subToAdd, subToRemove);
			}
		}
	}

	public clean(): void {
		this.subscriptions = [];
	}
}

export default SubscriptionsManager;
