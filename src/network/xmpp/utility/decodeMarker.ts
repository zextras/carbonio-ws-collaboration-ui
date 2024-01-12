/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
/* eslint-disable */

import { dateToTimestamp } from '../../../utils/dateUtils';
import { getId } from './decodeJid';
import { Marker, MarkerType } from '../../../types/store/MarkersTypes';
import { getRequiredAttribute } from './decodeStanza';

export function decodeMarker(markerStanza: Element): Marker {
	return {
		from: getId(getRequiredAttribute(markerStanza, 'from')),
		messageId: getRequiredAttribute(markerStanza, 'id'),
		markerDate: dateToTimestamp(getRequiredAttribute(markerStanza, 'timestamp')),
		type: getRequiredAttribute(markerStanza, 'type') as MarkerType
	};
}
