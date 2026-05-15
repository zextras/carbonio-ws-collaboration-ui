/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { forEach } from 'lodash';

import { IMessagingService } from '../../../types/network/messaging/IMessagingService';
import { getRequiredAttribute } from '../utility/decodeStanza';

/**
 * ROSTER (XEP-0012)
 * Documentation: https://xmpp.org/extensions/xep-0162.html
 */

export function createRosterCallback(service: IMessagingService): (stanza: Element) => void {
	return function rosterCallback(stanza: Element): void {
		const contacts = stanza.getElementsByTagName('item');
		forEach(contacts, (contact) => {
			const jid = getRequiredAttribute(contact, 'jid');
			service.getLastActivity(jid);
		});
	};
}
