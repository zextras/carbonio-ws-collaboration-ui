/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { sharedConfig } from '../../../config';
import { xmppDebug } from '../../../utils/debug';
import { getId } from '../utility/decodeJid';
import { getRequiredAttribute, getRequiredTagElement } from '../utility/decodeStanza';
import HistoryAccumulator from '../utility/HistoryAccumulator';

export function fullHistoryCallback(stanza: Element, queryId: string): void {
	const messages = HistoryAccumulator.getFullHistoryMessages(queryId);
	sharedConfig.useStore
		.getState()
		.session.chatExporting?.exporter?.addMessagesToFullHistory(messages);
	xmppDebug('Request full history', stanza);
	const roomId = getId(getRequiredAttribute(stanza, 'from'));
	const { chatExporting } = sharedConfig.useStore.getState().session;

	if (chatExporting?.roomId === roomId) {
		const isHistoryComplete = getRequiredTagElement(stanza, 'fin').getAttribute('complete');
		if (isHistoryComplete) {
			chatExporting.exporter.exportHistory();
		} else {
			chatExporting.exporter.continueExporting();
		}
	}
}
