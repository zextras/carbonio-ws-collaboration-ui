/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { forEach } from 'lodash';

import useStore from '../../../store/Store';
import { getRequiredAttribute } from '../utility/decodeStanza';

/**
 * ROSTER (XEP-0012)
 * Documentation: https://xmpp.org/extensions/xep-0162.html
 */

export function onGetRosterResponse(stanza: Element): boolean {
	const contacts = stanza.getElementsByTagName('item');
	forEach(contacts, (contact) => {
		const jid = getRequiredAttribute(contact, 'jid');
		useStore.getState().connections.xmppClient.getLastActivity(jid);
	});
	return true;
}
