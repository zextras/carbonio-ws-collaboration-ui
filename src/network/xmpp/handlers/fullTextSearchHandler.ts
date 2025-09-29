/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import useStore from '../../../store/Store';
import { getId } from '../utility/decodeJid';
import { getRequiredAttribute } from '../utility/decodeStanza';
import HistoryAccumulator from '../utility/HistoryAccumulator';

export function fullTextSearchHandler(stanza: Element, queryId: string): true {
	const from = getRequiredAttribute(stanza, 'from');
	const roomId = getId(from);
	const searchedMessages = HistoryAccumulator.getSearchedMessages(queryId);
	useStore.getState().setSearchResults(roomId, searchedMessages);
	return true;
}
