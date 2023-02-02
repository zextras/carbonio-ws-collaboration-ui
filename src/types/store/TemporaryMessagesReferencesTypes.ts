/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { DeletedMessage, TextMessage } from './MessageTypes';

export type TemporaryRoomsMessagesReferencesMap = {
	[id: string]: TemporaryReferenceMessageList;
};

export type TemporaryReferenceMessageList = TemporaryReferenceMessage[];

export type TemporaryReferenceMessage = TextMessage | DeletedMessage;
