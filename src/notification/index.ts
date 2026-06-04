/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import displayMessageBrowserNotification from './displayMessageBrowserNotification';
import displayReactionBrowserNotification from './displayReactionBrowserNotification';
import displayWaitingListNotification from './displayWaitingListNotification';
import { MessageFastening, TextMessage } from 'wsc-shared';

export const displayNotification = (notificationType: string, data: unknown): void => {
	switch (notificationType) {
		case 'newMessage':
			displayMessageBrowserNotification(data as TextMessage);
			break;
		case 'newReaction':
			displayReactionBrowserNotification(data as MessageFastening);
			break;
		case 'waitingList':
			displayWaitingListNotification(data as string);
			break;
		default:
			break;
	}
};
