/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ActiveMeeting } from '../../types/store/ActiveMeetingTypes';
import { RootStore } from '../../types/store/StoreTypes';

export const getActiveMeeting = (
	store: RootStore,
	meetingId: string
): ActiveMeeting | undefined => {
	if (store.activeMeeting?.meetingId === meetingId) return store.activeMeeting;
	return undefined;
};
