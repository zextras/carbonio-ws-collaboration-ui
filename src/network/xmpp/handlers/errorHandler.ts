/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Strophe } from 'strophe.js';

import { xmppDebug } from '../../../utils/debug';

export function onErrorStanza(stanza: Element): true {
	const query = stanza.getElementsByTagName('query')[0];
	if (query) {
		const xmlns = query.getAttribute('xmlns');
		if (xmlns === Strophe.NS.LAST_ACTIVITY) {
			xmppDebug('<--- Error on request last activity of user');
		} else {
			xmppDebug(`<--- Error`, stanza);
		}
	} else {
		xmppDebug(`<--- Error`, stanza);
	}
	return true;
}
