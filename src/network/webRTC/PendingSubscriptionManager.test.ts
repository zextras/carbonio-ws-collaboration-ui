/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import PendingSubscriptionManager from './PendingSubscriptionManager';
import { STREAM_TYPE, Subscription } from '../../types/store/ActiveMeetingTypes';

const updateSubscriptionMock = jest.fn();

const subscriptionMock: Subscription = {
	userId: '1',
	type: STREAM_TYPE.VIDEO
};

describe('PendingSubscriptionManager tests', () => {
	test('subscriptionRequesting sets request status in pending', () => {
		const pendingSubscriptionManager = new PendingSubscriptionManager(updateSubscriptionMock);
		pendingSubscriptionManager.subscriptionRequesting();
		expect(pendingSubscriptionManager.isRequesting).toBe(true);
	});

	test('subscriptionRequestDone sets request status in done', () => {
		const pendingSubscriptionManager = new PendingSubscriptionManager(updateSubscriptionMock);
		pendingSubscriptionManager.subscriptionRequesting();
		pendingSubscriptionManager.subscriptionRequestDone();
		expect(pendingSubscriptionManager.isRequesting).toBe(false);
	});

	test("subscriptionRequestDone avoids to call updateSubscription if there isn't a pendingRequest", () => {
		const pendingSubscriptionManager = new PendingSubscriptionManager(updateSubscriptionMock);
		pendingSubscriptionManager.subscriptionRequestDone();
		expect(updateSubscriptionMock).not.toHaveBeenCalled();
	});

	test('subscriptionRequestDone calls updateSubscription if there is a pendingRequest', () => {
		const pendingSubscriptionManager = new PendingSubscriptionManager(updateSubscriptionMock);
		pendingSubscriptionManager.subscriptionRequesting();
		pendingSubscriptionManager.checkRequestStatus([subscriptionMock]);
		pendingSubscriptionManager.subscriptionRequestDone();
		expect(updateSubscriptionMock).toHaveBeenCalled();
	});

	test('checkRequestStatus returns true if there is a pending request', () => {
		const pendingSubscriptionManager = new PendingSubscriptionManager(updateSubscriptionMock);
		pendingSubscriptionManager.subscriptionRequesting();
		expect(pendingSubscriptionManager.checkRequestStatus([subscriptionMock])).toBe(true);
	});

	test('checkRequestStatus returns false if there is not a pending request', () => {
		const pendingSubscriptionManager = new PendingSubscriptionManager(updateSubscriptionMock);
		pendingSubscriptionManager.subscriptionRequesting();
		pendingSubscriptionManager.subscriptionRequestDone();
		expect(pendingSubscriptionManager.checkRequestStatus([subscriptionMock])).toBe(false);
	});
});
