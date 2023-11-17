/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { differenceWith, find, flatMap, forEach, isEqual } from 'lodash';

import useStore from '../../store/Store';
import { STREAM_TYPE, Subscription, SubscriptionMap } from '../../types/store/ActiveMeetingTypes';
import { MeetingsApi } from '../index';

const enum SUBS_ACTION {
	ADD = 'add',
	REMOVE = 'remove'
}

class SubscriptionsManager {
	meetingId: string;

	subscriptions: SubscriptionMap = {};

	pendingRequest = false;

	constructor(meetingId: string) {
		this.meetingId = meetingId;
	}

	public filterSubscription(
		baseSubs: Subscription[],
		subsToRequire: Subscription[],
		toAdd: Subscription[],
		toRemove: Subscription[],
		typeReq: SUBS_ACTION
	): void {
		const participants = find(
			useStore.getState().meetings,
			(meeting) => meeting.id === this.meetingId
		)?.participants;
		const possibleToAdd = differenceWith(subsToRequire, baseSubs, isEqual);
		const possibleToRem = differenceWith(baseSubs, subsToRequire, isEqual);
		forEach(typeReq === SUBS_ACTION.ADD ? possibleToAdd : possibleToRem, (sub) => {
			if (
				participants &&
				participants[sub.userId] &&
				((sub.type === STREAM_TYPE.VIDEO && participants[sub.userId].videoStreamOn) ||
					(sub.type === STREAM_TYPE.SCREEN && participants[sub.userId].screenStreamOn))
			) {
				if (typeReq === SUBS_ACTION.ADD) {
					toAdd.push(sub);
				} else {
					toRemove.push(sub);
				}
			}
		});
	}

	public addSubscription(userId: string, type: STREAM_TYPE): void {
		if (
			userId !== useStore.getState().session.id &&
			!find(this.subscriptions, (sub) => sub.userId === userId)
		) {
			const sub = {
				userId,
				type
			};
			this.pendingRequest = true;
			MeetingsApi.subscribeToMedia(this.meetingId, [sub], []).then(() => {
				this.subscriptions[`${userId}-${type}`] = sub;
				this.pendingRequest = false;
			});
		}
	}

	public removeSubscription(userId: string, type: STREAM_TYPE): void {
		const subscriptionId = `${userId}-${type}`;
		if (userId !== useStore.getState().session.id) {
			delete this.subscriptions[subscriptionId];
		}
	}

	// Ask subscriptions that are not already asked and unset subscriptions that are not needed anymore
	public updateSubscription(subscriptionsToRequest?: SubscriptionMap): void {
		const flatSubsToRequire = flatMap(subscriptionsToRequest);
		const subs = flatMap(this.subscriptions);
		if (!isEqual(flatSubsToRequire, subs) && !this.pendingRequest) {
			const toAdd: Subscription[] = [];
			const toRemove: Subscription[] = [];
			this.filterSubscription(subs, flatSubsToRequire, toAdd, toRemove, SUBS_ACTION.ADD);
			this.filterSubscription(subs, flatSubsToRequire, toAdd, toRemove, SUBS_ACTION.REMOVE);

			if (toAdd.length > 0 || toRemove.length > 0) {
				this.pendingRequest = true;
				MeetingsApi.subscribeToMedia(this.meetingId, toAdd, toRemove).then(() => {
					forEach(toRemove, (sub) => delete this.subscriptions[`${sub.userId}-${sub.type}`]);
					forEach(toAdd, (sub) => {
						this.subscriptions[`${sub.userId}-${sub.type}`] = sub;
					});
					this.pendingRequest = false;
				});
			}
		}
	}

	clean(): void {
		this.subscriptions = {};
	}
}

export default SubscriptionsManager;
