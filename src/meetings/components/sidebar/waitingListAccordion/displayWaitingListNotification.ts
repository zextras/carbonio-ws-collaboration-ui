/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { getNotificationManager } from '@zextras/carbonio-shell-ui';
import i18next from 'i18next';
import { find } from 'lodash';

import useStore from '../../../../store/Store';

const displayWaitingListNotification = (meetingId: string): void => {
	const store = useStore.getState();
	const room = find(store.rooms, (room) => room.meetingId === meetingId);
	const iAmOwner = !!find(
		room?.members,
		(member) => member.userId === store.session.id && member.owner
	);

	if (iAmOwner) {
		getNotificationManager().notify({
			showPopup: true,
			playSound: true,
			title: i18next.t(
				'meeting.browserNotification.waitingTitle',
				'There seems to be someone in the Waiting Room'
			),
			message: i18next.t(
				'meeting.browserNotification.waitingMessage',
				'New user is waiting to enter the meeting'
			)
		});
	}
};

export default displayWaitingListNotification;
