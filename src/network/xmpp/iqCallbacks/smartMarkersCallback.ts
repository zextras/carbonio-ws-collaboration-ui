/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { map } from 'lodash';
import { Strophe } from 'strophe.js';

import useStore from '../../../store/Store';
import { getId } from '../utility/decodeJid';
import { decodeMarker } from '../utility/decodeMarker';
import { getRequiredAttribute, getTagElement } from '../utility/decodeStanza';

export function smartMarkersCallback(stanza: Element): void {
	const smartMarkersQuery = getTagElement(stanza, 'query');
	if (smartMarkersQuery && smartMarkersQuery.getAttribute('xmlns') === Strophe.NS.SMART_MARKERS) {
		const roomId = getId(getRequiredAttribute(smartMarkersQuery, 'peer'));
		const markers = map(smartMarkersQuery.getElementsByTagName('marker'), (marker) =>
			decodeMarker(marker)
		);
		const store = useStore.getState();
		store.updateReadStatus(roomId, markers);
	}
}
