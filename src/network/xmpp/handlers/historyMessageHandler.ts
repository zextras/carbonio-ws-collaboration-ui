/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
/**
 * MESSAGE ARCHIVE MANAGEMENT (XEP-0313)
 * Documentation: https://xmpp.org/extensions/xep-0313.html
 */
import { getAttribute, getRequiredTagElement } from '../utility/decodeStanza';
import HistoryAccumulator from '../utility/HistoryAccumulator';

export function onHistoryMessageStanza(message: Element): true {
	const result = getRequiredTagElement(message, 'result');

	const queryId = getAttribute(result, 'queryid');
	if (!queryId) {
		console.warn('MAM message without queryId, ignoring');
	} else {
		HistoryAccumulator.pushToCache(queryId, message);
	}
	return true;
}
