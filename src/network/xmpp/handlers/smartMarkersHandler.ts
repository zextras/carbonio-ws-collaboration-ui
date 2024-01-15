/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { map } from 'lodash';
import { Strophe } from 'strophe.js';

import useStore from '../../../store/Store';
import { Marker, MarkerType } from '../../../types/store/MarkersTypes';
import { now } from '../../../utils/dateUtils';
import { getId, getResource } from '../utility/decodeJid';
import { decodeMarker } from '../utility/decodeMarker';
import { getRequiredAttribute, getTagElement } from '../utility/decodeStanza';

export function onSmartMarkers(stanza: Element): true {
	const smartMarkersQuery = getTagElement(stanza, 'query');
	if (smartMarkersQuery && smartMarkersQuery.getAttribute('xmlns') === Strophe.NS.SMART_MARKERS) {
		const roomId = getId(getRequiredAttribute(smartMarkersQuery, 'peer'));
		const markers = map(smartMarkersQuery.getElementsByTagName('marker'), (marker) =>
			decodeMarker(marker)
		);
		const store = useStore.getState();
		store.updateMarkers(roomId, markers);
		store.updateUnreadMessages(roomId);
		store.updateUnreadCount(roomId);
	}
	return true;
}

export function onDisplayedMessageStanza(message: Element): true {
	const displayed = getTagElement(message, 'displayed');
	if (displayed) {
		const from = getRequiredAttribute(message, 'from');
		const roomId = getId(from);
		const displayedMessage: Marker = {
			from: getId(getResource(from)),
			messageId: getRequiredAttribute(displayed, 'id'),
			markerDate: now(),
			type: MarkerType.DISPLAYED
		};
		const store = useStore.getState();
		store.updateMarkers(roomId, [displayedMessage]);
		store.updateUnreadMessages(roomId);

		// Update unread counter
		if (getId(getResource(from)) === store.session.id) {
			store.updateUnreadCount(roomId);
		}
	}
	return true;
}
