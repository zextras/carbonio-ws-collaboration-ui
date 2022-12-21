/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Strophe } from 'strophe.js';

import useStore from '../../../store/Store';
import { getRequiredAttribute, getRequiredTagElement } from '../utility/decodeStanza';

/**
 * LAST ACTIVITY (XEP-0012)
 * Documentation: https://xmpp.org/extensions/xep-0012.html
 */

export function onGetLastActivityResponse(stanza: Element): true {
	const from: string = Strophe.getNodeFromJid(stanza.getAttribute('from'));
	const queryElement: Element = getRequiredTagElement(stanza, 'query');
	const seconds: number = parseInt(getRequiredAttribute(queryElement, 'seconds'), 10);
	const date = Date.now() - seconds * 1000;

	const store = useStore.getState();
	store.setUserLastActivity(from, date);
	return true;
}
