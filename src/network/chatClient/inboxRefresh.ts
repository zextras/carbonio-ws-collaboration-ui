/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { getMyLastMarkerOfRoom } from '../../store/selectors/ChatsRegistrySelectors';
import useStore from '../../store/Store';
import { wscSdk } from '../sdk/wscSdk';

// A row of another user, newer than the own marker, raises the badge
const countsAsUnread = (row: { roomId: string; from: string; date: number }): boolean => {
	const state = useStore.getState();
	if (row.from === state.session.id) return false;
	const ownMarker = getMyLastMarkerOfRoom(state, row.roomId);
	return !ownMarker || row.date > ownMarker.markerDate;
};

export const BOOT_INBOX_TIMEOUT_MS = 5000;
export const MAX_CHAIN_WAIT_MS = 30000;

const BOOT_ERROR = 'chatClient.connect: inbox hydration failed';

type BootState = 'idle' | 'waiting' | 'loaded';

let lastRefresh: Promise<boolean> | undefined;
let bootState: BootState = 'idle';
let bootTimer: ReturnType<typeof setTimeout> | undefined;

const waitAtMost = (previous: Promise<boolean>, ms: number): Promise<void> =>
	new Promise<void>((resolve) => {
		const timer = setTimeout(resolve, ms);
		const done = (): void => {
			clearTimeout(timer);
			resolve();
		};
		previous.then(done, done);
	});

/** Resolves whether the inbox was hydrated; a failure is logged, never thrown. */
export function refreshInboxSerialized(errorMessage: string): Promise<boolean> {
	const run = (): Promise<boolean> =>
		wscSdk.fetchInbox({ countsAsUnread }).then(
			() => true,
			(err) => {
				console.error(errorMessage, err);
				return false;
			}
		);
	const current = lastRefresh ? waitAtMost(lastRefresh, MAX_CHAIN_WAIT_MS).then(run) : run();
	lastRefresh = current;
	const release = (): void => {
		if (lastRefresh === current) lastRefresh = undefined;
	};
	current.then(release, release);
	return current;
}

// For the callers that do not wait for it: the failure is already logged by the refresh itself
export function refreshInboxInBackground(errorMessage: string): void {
	refreshInboxSerialized(errorMessage).catch(() => undefined);
}

let staleUnreadRefreshInFlight = false;
let staleUnreadRefreshAgain = false;

/**
 * A detached window could not follow an own marker move: the server knows the unread count. One
 * refresh at a time for all rooms. A room is released only by a refresh issued after it went
 * stale; one that went stale during a flight runs again after it. A failed refresh leaves the
 * flags on: the next own read or reattach retries.
 */
export function refreshStaleUnread(): void {
	const issued = Object.entries(useStore.getState().chatsRegistry).flatMap(([roomId, registry]) =>
		registry.unreadStale ? [[roomId, registry.unreadStale] as const] : []
	);
	if (issued.length === 0) {
		return;
	}
	if (staleUnreadRefreshInFlight) {
		staleUnreadRefreshAgain = true;
		return;
	}
	staleUnreadRefreshInFlight = true;
	staleUnreadRefreshAgain = false;
	refreshInboxSerialized('refreshStaleUnread: inbox refresh failed').then((hydrated) => {
		staleUnreadRefreshInFlight = false;
		if (!hydrated) {
			return;
		}
		issued.forEach(([roomId, version]) => useStore.getState().clearUnreadStale(roomId, version));
		if (staleUnreadRefreshAgain) {
			refreshStaleUnread();
		}
	});
}

export function scheduleBootInbox(): void {
	clearTimeout(bootTimer);
	bootState = 'waiting';
	bootTimer = setTimeout(() => {
		bootState = 'loaded';
		refreshInboxInBackground(BOOT_ERROR);
	}, BOOT_INBOX_TIMEOUT_MS);
}

export function onFirstWebsocketConnected(): boolean {
	if (bootState === 'idle') return false;
	clearTimeout(bootTimer);
	bootState = 'idle';
	refreshInboxInBackground(BOOT_ERROR);
	return true;
}

export function cancelBootInbox(): void {
	clearTimeout(bootTimer);
	bootState = 'idle';
}
