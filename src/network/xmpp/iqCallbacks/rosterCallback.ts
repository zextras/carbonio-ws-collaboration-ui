/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { forEach } from 'lodash';

import { getRequiredAttribute } from '../utility/decodeStanza';
import { xmppClient } from '../XMPPClient';

/**
 * ROSTER (XEP-0012)
 * Documentation: https://xmpp.org/extensions/xep-0162.html
 */

export function rosterCallback(stanza: Element): void {
	const contacts = stanza.getElementsByTagName('item');
	forEach(contacts, (contact) => {
		const jid = getRequiredAttribute(contact, 'jid');
		xmppClient.getLastActivity(jid);
	});
}
