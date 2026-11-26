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

let lastRefresh: Promise<void> | undefined;
let bootState: BootState = 'idle';
let bootTimer: ReturnType<typeof setTimeout> | undefined;

const waitAtMost = (previous: Promise<void>, ms: number): Promise<void> =>
	new Promise<void>((resolve) => {
		const timer = setTimeout(resolve, ms);
		const done = (): void => {
			clearTimeout(timer);
			resolve();
		};
		previous.then(done, done);
	});

export function refreshInboxSerialized(errorMessage: string): Promise<void> {
	const run = (): Promise<void> =>
		wscSdk.fetchInbox({ countsAsUnread }).catch((err) => {
			console.error(errorMessage, err);
		});
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
