/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { forEach } from 'lodash';
import { Strophe } from 'strophe.js';
import { TextMessage } from 'types/store/MessageTypes';

import useStore from '../../../store/Store';
import { RootStore } from '../../../types/store/StoreTypes';
import { dateToTimestamp } from '../../../utils/dateUtil';
import { xmppDebug } from '../../../utils/debug';
import { getId } from '../utility/decodeJid';
import { decodeMessage } from '../utility/decodeMessage';
import { getAttribute, getRequiredAttribute, getRequiredTagElement } from '../utility/decodeStanza';
import HistoryAccumulator from '../utility/HistoryAccumulator';
import XMPPClient from '../XMPPClient';

/**
 * MESSAGE ARCHIVE MANAGEMENT (XEP-0313)
 * Documentation: https://xmpp.org/extensions/xep-0313.html
 */

export enum MamRequestType {
	HISTORY = 'history',
	REPLIED = 'replied'
}

export function onHistoryMessageStanza(message: Element): true {
	const result = getRequiredTagElement(message, 'result');
	const id = getRequiredAttribute(result, 'id');
	const date = getRequiredAttribute(getRequiredTagElement(result, 'delay'), 'stamp');
	const insideMessage = getRequiredTagElement(result, 'message');
	const historyMessage = decodeMessage(insideMessage, { date: dateToTimestamp(date), id });

	if (historyMessage) {
		// Check message request type
		const queryid = getAttribute(result, 'queryid');
		switch (queryid) {
			case MamRequestType.HISTORY: {
				HistoryAccumulator.addMessageToHistory(historyMessage.roomId, historyMessage);
				break;
			}
			case MamRequestType.REPLIED: {
				HistoryAccumulator.addRepliedMessage(historyMessage);
				break;
			}
			default:
				console.log('Unknow MAM request type ');
		}
	}
	return true;
}

export function onRequestHistory(this: XMPPClient, stanza: Element): void {
	xmppDebug(`<--- End request history`);
	const from = getRequiredAttribute(stanza, 'from');
	const roomId = getId(from);
	const store = useStore.getState();

	// Store history messages on store
	const historyMessages = HistoryAccumulator.returnHistory(roomId);
	if (historyMessages.length > 0) store.updateHistory(roomId, historyMessages);

	// Set load history
	const fin = getRequiredTagElement(stanza, 'fin');
	const isHistoryFullyLoaded = fin.getAttribute('complete');
	store.setHistoryLoadDisabled(roomId, false);
	if (isHistoryFullyLoaded || historyMessages.length === 0) store.setHistoryIsFullyLoaded(roomId);

	// Request replied message information
	forEach(historyMessages, (message) => {
		const repliedId = (message as TextMessage).replyTo;
		if (repliedId) {
			this.requestRepliedMessage(message.roomId, message.id, repliedId);
		}
	});

	// Update last marker
	this.lastMarkers(roomId);
}

export function onRequestSingleMessage(originalMessageId: string, stanza: Element): void {
	const repliedMessageId = Strophe.getText(getRequiredTagElement(stanza, 'first'));
	const repliedMessage = HistoryAccumulator.returnRepliedMessage(repliedMessageId);
	const store: RootStore = useStore.getState();
	store.setRepliedMessage(repliedMessage.roomId, originalMessageId, repliedMessage);
}
