/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { StoreConfigurationMessage } from '@zextras/carbonio-ws-collaboration-ui-sdk';

import { isMyId } from './eventHandlersUtilities';
import { EventName, sendCustomEvent } from '../../hooks/useEventListener';
import { getMyLastMarkerOfRoom } from '../../store/selectors/ChatsRegistrySelectors';
import useStore from '../../store/Store';
import type { Message } from '../../types/store/ChatsRegistryTypes';

/**
 * The v1 effects of a configuration row landed from a push event: custom
 * event for every author, unread bump only for the others'. The WSC backend
 * counts the system lines whose author is not the user, so the badge stays
 * aligned with it; a line delivered late, older than the own read marker, is
 * already read and bumps nothing. No browser notification (the v1 config
 * handler never fired one).
 */
export function notifyConfigRow(row: StoreConfigurationMessage): void {
	sendCustomEvent({ name: EventName.NEW_MESSAGE, data: row as Message });
	if (isMyId(row.from)) {
		return;
	}
	const ownMarker = getMyLastMarkerOfRoom(useStore.getState(), row.roomId);
	if (!ownMarker || row.date > ownMarker.markerDate) {
		useStore.getState().incrementUnreadCount(row.roomId, 1);
	}
}
