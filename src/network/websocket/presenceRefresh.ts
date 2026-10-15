/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import useStore from '../../store/Store';
import { wscSdk } from '../sdk/wscSdk';

export function refreshPresence(userIds: Array<string>): void {
	const { session } = useStore.getState();
	const ids = userIds.filter((id) => id !== session.id);
	if (ids.length === 0) return;
	wscSdk.fetchPresence(ids).catch((err) => {
		console.error('refreshPresence: presence refresh failed', err);
	});
}

export function refreshPresenceOfStoredRooms(): void {
	const { rooms } = useStore.getState();
	refreshPresence(Object.values(rooms).flatMap((room) => room.members.map((m) => m.userId)));
}
