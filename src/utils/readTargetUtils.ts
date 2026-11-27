/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { validate as isServerId } from 'uuid';

import { isPendingMessage } from './historyAnchorUtils';
import {
	ConfigurationMessage,
	ExtendedMessage,
	MessageType,
	TextMessage
} from '../types/store/ChatsRegistryTypes';

export const isPersistedRow = (
	message: ExtendedMessage
): message is TextMessage | ConfigurationMessage =>
	(message.type === MessageType.TEXT_MSG && !isPendingMessage(message)) ||
	(message.type === MessageType.CONFIGURATION_MSG && isServerId(message.id));

export const pickReadTarget = (
	rows: ReadonlyArray<ExtendedMessage>,
	bottomVisibleId?: string
): TextMessage | ConfigurationMessage | undefined => {
	const visibleIndex = bottomVisibleId ? rows.findIndex((row) => row.id === bottomVisibleId) : -1;
	for (let i = visibleIndex >= 0 ? visibleIndex : rows.length - 1; i >= 0; i -= 1) {
		const row = rows[i];
		if (isPersistedRow(row)) return row;
	}
	return undefined;
};

export const shouldRequestRead = (
	targetDate: number,
	markerDate: number | undefined,
	requestedDate: number | undefined
): boolean =>
	targetDate > (markerDate ?? Number.NEGATIVE_INFINITY) &&
	targetDate > (requestedDate ?? Number.NEGATIVE_INFINITY);
