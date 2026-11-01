/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { find } from 'lodash';

import { PLACEHOLDER_STANZA_PREFIX } from '../constants/messageConstants';
import { Message, MarkerStatus, MessageType } from '../types/store/ChatsRegistryTypes';

export const isPendingMessage = (message: Message): boolean =>
	message.type === MessageType.TEXT_MSG &&
	(message.stanzaId.startsWith(PLACEHOLDER_STANZA_PREFIX) || message.read === MarkerStatus.PENDING);

export const getOldestConfirmedMessage = (messages: ReadonlyArray<Message>): Message | undefined =>
	find(messages, (message) => !isPendingMessage(message));
