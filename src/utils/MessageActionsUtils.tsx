/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { messageActionType } from '../types/store/ActiveConversationTypes';
import { Message, MessageType } from '../types/store/MessageTypes';

export const canPerformAction = (
	message: Message,
	isMyMessage: boolean,
	actionTimeLimitInMinutes: number,
	actionType?: messageActionType
): boolean => {
	const inTime =
		!actionTimeLimitInMinutes || Date.now() <= message.date + actionTimeLimitInMinutes * 60000;
	if (actionType === messageActionType.EDIT && message.type === MessageType.TEXT_MSG)
		return isMyMessage && inTime && !message.forwarded;
	return isMyMessage && inTime;
};
