/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import useStore from '../../../store/Store';
import { RootStore } from '../../../types/store/StoreTypes';
import { xmppDebug } from '../../../utils/debug';
import { getId, getResource } from '../utility/decodeJid';
import { getRequiredAttribute } from '../utility/decodeStanza';

/**
 * CHAT STATE EVENTS (XEP-0085)
 * Documentation: https://xmpp.org/extensions/xep-0085.html
 */

export function onComposingMessageStanza(message: Element): true {
	xmppDebug('<--- composing message');

	const fromAttribute = getRequiredAttribute(message, 'from');
	const roomId = getId(fromAttribute);
	const resource = getResource(fromAttribute);
	const from = getId(resource);
	const composing = message.getElementsByTagName('composing')[0];
	const stopComposing = message.getElementsByTagName('paused')[0];
	const store: RootStore = useStore.getState();

	if (store.session.id !== from) {
		// handle user iswriting
		if (composing && !stopComposing) store.setIsWriting(roomId, from, true);
		// handle user stopped writing
		if (!composing && stopComposing) store.setIsWriting(roomId, from, false);
	}

	return true;
}
