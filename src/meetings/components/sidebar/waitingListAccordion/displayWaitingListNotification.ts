/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { t, getNotificationManager } from '@zextras/carbonio-shell-ui';
import { find } from 'lodash';

import { SOUND_NOTIFICATION_PARTICIPANT_THRESHOLD } from '../../../../constants/appConstants';
import useStore from '../../../../store/Store';
import {
	getLocalStorageItem,
	LOCAL_STORAGE_NAMES,
	NotificationsSettingsType
} from '../../../../utils/localStorageUtils';
import { MeetingSoundFeedback, sendAudioFeedback } from '../../../../utils/MeetingsUtils';

const displayWaitingListNotification = (meetingId: string): void => {
	const store = useStore.getState();
	const room = find(store.rooms, (room) => room.meetingId === meetingId);
	const iAmOwner = !!find(
		room?.members,
		(member) => member.userId === store.session.id && member.owner
	);

	const ChatsNotificationsSettings: NotificationsSettingsType = getLocalStorageItem(
		LOCAL_STORAGE_NAMES.NOTIFICATIONS
	);

	const meeting = find(store.meetings, (meeting) => meeting.id === meetingId);

	if (iAmOwner) {
		getNotificationManager().notify({
			showPopup: ChatsNotificationsSettings.WaitingRoomAccessNotifications,
			playSound: false,
			title:
				t(
					'meeting.snackbar.waitingInfo',
					`There seems to be someone in the ${room?.name}'s Waiting Room`,
					{ roomName: room?.name }
				) ?? undefined,
			message:
				t(
					'meeting.browserNotification.waitingMessage',
					'New user is waiting to enter the meeting'
				) ?? undefined
		});
	}
	if (
		ChatsNotificationsSettings.WaitingRoomAccessNotifications &&
		ChatsNotificationsSettings.WaitingRoomAccessNotificationsSounds &&
		meeting?.waitingList &&
		meeting.waitingList.length <= SOUND_NOTIFICATION_PARTICIPANT_THRESHOLD
	) {
		sendAudioFeedback(MeetingSoundFeedback.NEW_WAITING_USER);
	}
};

export default displayWaitingListNotification;
