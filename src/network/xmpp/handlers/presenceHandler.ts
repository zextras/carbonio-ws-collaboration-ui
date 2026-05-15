/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Strophe } from 'strophe.js';

import useStore from '../../../store/Store';
import { IMessagingService } from '../../../types/network/messaging/IMessagingService';
import { isMyId } from '../../websocket/eventHandlersUtilities';

export function createPresenceHandler(
	service: IMessagingService
): (stanza: Element) => true {
	return function onPresenceStanza(stanza: Element): true {
		const store = useStore.getState();
		const from = Strophe.getNodeFromJid(stanza.getAttribute('from'));
		const type = stanza.getAttribute('type');

		if (isMyId(from) && type === 'unavailable') {
			service.setOnline();
		} else if (type == null) {
			store.setUserPresence(from, true);
		} else if (type === 'unavailable') {
			store.setUserPresence(from, false);
			const jid = Strophe.getBareJidFromJid(stanza.getAttribute('from'));
			service.getLastActivity(jid);
		}
		return true;
	};
}

export function createPingHandler(service: IMessagingService): (stanza: Element) => true {
	return function onPingStanza(stanza: Element): true {
		service.sendPong(stanza);
		return true;
	};
}
