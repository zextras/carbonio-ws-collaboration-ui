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
	store.setUserPresence(from, !type);

	// If user goes offline, request his last activity
	if (type != null) {
		const jid = Strophe.getBareJidFromJid(stanza.getAttribute('from'));
		store.connections.xmppClient.getLastActivity(jid);
	}
	// TODO SEND PAUSE ISWRITING WHEN USER GOES OFFLINE
	return true;
}
