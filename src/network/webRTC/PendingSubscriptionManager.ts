/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Subscription } from '../../types/store/ActiveMeetingTypes';

class PendingSubscriptionManager {
	isRequesting = false;

	pendingRequest: Subscription[] | undefined;

	updateSubscription: (subscription: Subscription[]) => void;

	constructor(updateSubscription: (subscription: Subscription[]) => void) {
		this.updateSubscription = updateSubscription;
	}

	public subscriptionRequesting(): void {
		this.isRequesting = true;
	}

	public subscriptionRequestDone(): void {
		this.isRequesting = false;
		if (this.pendingRequest) {
			this.updateSubscription(this.pendingRequest);
			this.pendingRequest = undefined;
		}
	}

	public checkRequestStatus(subscription: Subscription[]): boolean {
		if (this.isRequesting) {
			this.pendingRequest = subscription;
			return true;
		}
		return false;
	}
}

export default PendingSubscriptionManager;
