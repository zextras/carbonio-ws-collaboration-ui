/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { find } from 'lodash';

import { getUser } from '../network/apis/UsersApi';
import { getRoomNameSelector } from '../store/selectors/RoomsSelectors';
import useStore from '../store/Store';
import { RoomType } from '../types/store/RoomTypes';

// Room export naming races two independent, uncoordinated network pipelines:
// store.users only hydrates lazily as a side effect of rendering (debounced
// REST fetch, ~600ms+), while the export's own network call (XMPP full-history
// or the WSC-pure server-streamed download) can resolve faster for a "cold"
// 1:1 room with little/no history. When that happens getRoomNameSelector still
// reads '' from the not-yet-hydrated store. Rather than accept the empty name
// outright, make one direct, awaited fetch for the other member before
// falling back to the roomId, bounded so a slow/failed request never stalls
// the download.
const RESOLVE_TIMEOUT_MS = 1500;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
	return new Promise<T>((resolve, reject) => {
		const timer = setTimeout(() => reject(new Error('resolveChatExportName: timed out')), ms);
		promise.then(
			(value) => {
				clearTimeout(timer);
				resolve(value);
			},
			(err) => {
				clearTimeout(timer);
				reject(err);
			}
		);
	});
}

export async function resolveChatExportName(roomId: string): Promise<string> {
	const state = useStore.getState();
	const name = getRoomNameSelector(state, roomId);
	if (name) return name;

	const room = state.rooms[roomId];
	if (room?.type === RoomType.ONE_TO_ONE) {
		const otherMember = find(room.members ?? [], (member) => member.userId !== state.session.id);
		if (otherMember) {
			try {
				const user = await withTimeout(getUser(otherMember.userId), RESOLVE_TIMEOUT_MS);
				const resolvedName = user.name || user.email;
				if (resolvedName) return resolvedName;
			} catch (err) {
				console.warn('resolveChatExportName: failed to resolve the other member name', err);
			}
		}
	}

	// Last-resort fallback: keeps the filename unique per chat instead of every
	// unresolved export collapsing onto the same generic browser default.
	return roomId;
}
