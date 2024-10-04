/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { ReactElement, useCallback, useEffect, useState } from 'react';

import { Snackbar } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

import useEventListener, { EventName } from '../../hooks/useEventListener';
import {
	getMeetingByMeetingId,
	getWaitingListSizeForMyVirtualMeeting
} from '../../store/selectors/MeetingSelectors';
import useStore from '../../store/Store';
import {
	getLocalStorageItem,
	LOCAL_STORAGE_NAMES,
	NotificationsSettingsType
} from '../../utils/localStorageUtils';

const WaitingListSnackbar = (): ReactElement | null => {
	const [t] = useTranslation();

	const waitingListSize = useStore(getWaitingListSizeForMyVirtualMeeting);

	const ChatsNotificationsSettings: NotificationsSettingsType = getLocalStorageItem(
		LOCAL_STORAGE_NAMES.NOTIFICATIONS
	);

	const [showWaitingUserSnackbar, setShowWaitingUserSnackbar] = useState(false);
	const [meetingId, setMeetingId] = useState<string>('');

	const meeting = useStore((store) => getMeetingByMeetingId(store, meetingId));

	const snackbarLabel = t(
		'meeting.snackbar.waitingInfo',
		`There seems to be someone in ${meeting?.name}'s waiting room`,
		{ roomName: meeting?.name }
	);

	const waitingSnackbarHandler = useCallback((event) => {
		setMeetingId(event.detail.meetingId);
	}, []);

	useEffect(() => {
		if (ChatsNotificationsSettings.WaitingRoomAccessNotifications && meeting !== undefined) {
			setShowWaitingUserSnackbar(true);
			setMeetingId('');
		}
	}, [ChatsNotificationsSettings.WaitingRoomAccessNotifications, meeting]);

	useEventListener(EventName.NEW_WAITING_USER, waitingSnackbarHandler);

	useEffect(() => {
		if (waitingListSize === 0) setShowWaitingUserSnackbar(false);
	}, [waitingListSize]);

	return (
		<Snackbar
			data-testid="notification_snackbar"
			open={showWaitingUserSnackbar}
			key="newWaitingUser"
			severity="info"
			label={snackbarLabel}
			disableAutoHide
			onClose={(): void => setShowWaitingUserSnackbar(false)}
		/>
	);
};

export default WaitingListSnackbar;
