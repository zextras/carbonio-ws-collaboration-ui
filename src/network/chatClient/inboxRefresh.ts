/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { wscSdk } from '../sdk/wscSdk';

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
		previous.then(() => {
			clearTimeout(timer);
			resolve();
		});
	});

export function refreshInboxSerialized(errorMessage: string): Promise<void> {
	const run = (): Promise<void> =>
		wscSdk.fetchInbox().catch((err) => {
			console.error(errorMessage, err);
		});
	const current = lastRefresh ? waitAtMost(lastRefresh, MAX_CHAIN_WAIT_MS).then(run) : run();
	lastRefresh = current;
	current.then(() => {
		if (lastRefresh === current) lastRefresh = undefined;
	});
	return current;
}

export function scheduleBootInbox(): void {
	clearTimeout(bootTimer);
	bootState = 'waiting';
	bootTimer = setTimeout(() => {
		bootState = 'loaded';
		refreshInboxSerialized(BOOT_ERROR);
	}, BOOT_INBOX_TIMEOUT_MS);
}

export function onFirstWebsocketConnected(): boolean {
	if (bootState === 'idle') return false;
	clearTimeout(bootTimer);
	bootState = 'idle';
	refreshInboxSerialized(BOOT_ERROR);
	return true;
}

export function cancelBootInbox(): void {
	clearTimeout(bootTimer);
	bootState = 'idle';
}
