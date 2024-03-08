/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { debounce } from 'lodash';

import useStore from '../../../store/Store';
import { RootStore } from '../../../types/store/StoreTypes';
import { getId, getResource } from '../utility/decodeJid';
import { getRequiredAttribute } from '../utility/decodeStanza';

/**
 * CHAT STATE EVENTS (XEP-0085)
 * Documentation: https://xmpp.org/extensions/xep-0085.html
 */

// Reset isWriting after 10 seconds to avoid network problems
const debouncedStopWriting = debounce(
	(store: RootStore, roomId: string, from: string) => store.setIsWriting(roomId, from, false),
	7000
);
export function onComposingMessageStanza(message: Element): true {
	const fromAttribute = getRequiredAttribute(message, 'from');
	const roomId = getId(fromAttribute);
	const resource = getResource(fromAttribute);
	const from = getId(resource);
	const composing = message.getElementsByTagName('composing')[0];
	const stopComposing = message.getElementsByTagName('paused')[0];
	const store: RootStore = useStore.getState();

	// Ignore my own messages of writing status
	if (store.session.id !== from) {
		// If user starts (or continues) to write set isWriting to true
		if (composing && !stopComposing) {
			store.setIsWriting(roomId, from, true);
			debouncedStopWriting(store, roomId, from);
		}
		// User stopped writing
		if (!composing && stopComposing) {
			debouncedStopWriting.cancel();
			store.setIsWriting(roomId, from, false);
		}
	}

	return true;
}
