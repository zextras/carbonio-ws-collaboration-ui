/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Strophe } from 'strophe.js';

import useStore from '../../../store/Store';

export function onPresenceStanza(stanza: Element): true {
	const store = useStore.getState();
	const from = Strophe.getNodeFromJid(stanza.getAttribute('from'));
	const type = stanza.getAttribute('type');

	if (type == null) {
		store.setUserPresence(from, true);
	} else if (type === 'unavailable') {
		store.setUserPresence(from, false);
		const jid = Strophe.getBareJidFromJid(stanza.getAttribute('from'));
		store.connections.xmppClient.getLastActivity(jid);
	}

	return true;
}
