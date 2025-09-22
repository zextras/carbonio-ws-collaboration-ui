/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { getId } from '../utility/decodeJid';
import { getRequiredAttribute } from '../utility/decodeStanza';
import HistoryAccumulator from '../utility/HistoryAccumulator';

export function fullTextSearchHandler(stanza: Element): true {
	const from = getRequiredAttribute(stanza, 'from');
	const roomId = getId(from);
	const searchedMessages = HistoryAccumulator.returnSearchedMessages(roomId);
	console.log(from, roomId, searchedMessages);
	return true;
}
