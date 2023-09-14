/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { size } from 'lodash';
import { useEffect } from 'react';

import { MeetingsApi } from '../network';
import { getSubscriptions } from '../store/selectors/MeetingSelectors';
import useStore from '../store/Store';
import { Subscription } from '../types/store/ActiveMeetingTypes';

// TODO: choose a better architecture for subscriptions handling
const useSubscriptions = (meetingId: string): void => {
	const subscriptions: Subscription[] = useStore(
		(store) => getSubscriptions(store, meetingId),
		(newState, oldState) => size(newState) === size(oldState)
	);

	useEffect(() => {
		console.log('useSubscription', subscriptions);
		if (size(subscriptions) !== 0) {
			MeetingsApi.subscribeToMedia(meetingId, subscriptions, []);
		}
	}, [meetingId, subscriptions]);
};

export default useSubscriptions;
