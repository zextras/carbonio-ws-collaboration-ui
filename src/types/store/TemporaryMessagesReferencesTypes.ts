/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { DeletedMessage, TextMessage } from './MessageTypes';

export type TemporaryMessagesMap = {
	[id: string]: TemporaryMessageList;
};

export type TemporaryMessageList = {
	[id: string]: TemporaryMessage;
};

export type TemporaryMessage = TextMessage | DeletedMessage;
