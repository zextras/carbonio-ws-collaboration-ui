/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Strophe } from 'strophe.js';

import useStore from '../../../store/Store';
import { isMyId } from '../../websocket/eventHandlersUtilities';

export function onPresenceStanza(stanza: Element): true {
	const store = useStore.getState();
	const from = Strophe.getNodeFromJid(stanza.getAttribute('from'));
	const type = stanza.getAttribute('type');

	if (isMyId(from) && type === 'unavailable') {
		// Another client of the logged user went offline
		store.connections.xmppClient.setOnline();
	} else if (type == null) {
		// Online presence stanza
		store.setUserPresence(from, true);
	} else if (type === 'unavailable') {
		// Offline presence stanza
		store.setUserPresence(from, false);
		const jid = Strophe.getBareJidFromJid(stanza.getAttribute('from'));
		store.connections.xmppClient.getLastActivity(jid);
	}
	return true;
}

export function onPingStanza(stanza: Element): true {
	useStore.getState().connections.xmppClient.sendPong(stanza);
	return true;
}
