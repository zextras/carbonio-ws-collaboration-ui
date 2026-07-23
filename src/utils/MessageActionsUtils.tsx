/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { MessageActionType } from '../types/store/ActiveConversationTypes';
import { Message, MessageType } from '../types/store/ChatsRegistryTypes';

export const canPerformAction = (
	message: Message,
	isMyMessage: boolean,
	actionTimeLimitInMinutes: number,
	actionType?: MessageActionType
): boolean => {
	if (actionTimeLimitInMinutes === 0) return false;
	const inTime = Date.now() <= message.date + actionTimeLimitInMinutes * 60000;
	if (actionType === MessageActionType.EDIT && message.type === MessageType.TEXT_MSG)
		return isMyMessage && inTime && !message.forwarded;
	return isMyMessage && inTime;
};
