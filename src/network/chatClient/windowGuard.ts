/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import useStore from '../../store/Store';

/** A window load that does not answer in time fails, and the queue of the room moves on. */
export const WINDOW_LOAD_TIMEOUT_MS = 15000;

export const LOADER_RETRY_FIRST_MS = 2000;
export const LOADER_RETRY_MAX_MS = 60000;

const controllers = new Map<string, AbortController>();
const loaderRetries = new Map<string, { delay: number; timer: ReturnType<typeof setTimeout> }>();
let watching = false;
const scrollTargets = new Map<string, string>();

/** The history loader asks again on its own: after an error, not at once, or an offline client polls. */
export function scheduleLoaderRetry(roomId: string, enable: () => void): void {
	const previous = loaderRetries.get(roomId);
	clearTimeout(previous?.timer);
	const delay = previous
		? Math.min(previous.delay * 2, LOADER_RETRY_MAX_MS)
		: LOADER_RETRY_FIRST_MS;
	// The entry stays after the timer fired, until a page succeeds: the next error waits longer
	const timer = setTimeout(enable, delay);
	loaderRetries.set(roomId, { delay, timer });
}

/** A page came: the next error starts again from the first delay. */
export function resetLoaderRetry(roomId: string): void {
	clearTimeout(loaderRetries.get(roomId)?.timer);
	loaderRetries.delete(roomId);
}

function wipeRoom(roomId: string): void {
	controllers.get(roomId)?.abort();
	controllers.delete(roomId);
	resetLoaderRetry(roomId);
}

// Subscribed on first use: this module is evaluated while the store module is still being built
function watchWipes(): void {
	if (watching) {
		return;
	}
	watching = true;
	useStore.subscribe((state, previous) => {
		const epochs = state.windowEpochs;
		const before = previous.windowEpochs;
		if (epochs === before) {
			return;
		}
		if (epochs['*'] !== before['*']) {
			Array.from(new Set([...controllers.keys(), ...loaderRetries.keys()])).forEach(wipeRoom);
			return;
		}
		Object.keys({ ...before, ...epochs })
			.filter((roomId) => epochs[roomId] !== before[roomId])
			.forEach(wipeRoom);
	});
}

/**
 * The signal of the loads of a room: a reconnection reset aborts the loads of every room and a
 * history clear those of that room (see the subscription below). Each abort starts a new
 * controller, so it never reaches the loads that come after.
 */
export function windowLoadSignal(roomId: string): AbortSignal {
	watchWipes();
	let controller = controllers.get(roomId);
	if (!controller) {
		controller = new AbortController();
		controllers.set(roomId, controller);
	}
	return controller.signal;
}

export const isAbortError = (err: unknown): boolean =>
	err instanceof Error && err.name === 'AbortError';

/**
 * The message a replacing page (a jump) must leave the list scrolled to: set when the rows land,
 * so the list does not scroll to the bottom for a moment.
 */
export function setReplaceScrollTarget(roomId: string, messageId: string | undefined): void {
	if (messageId) {
		scrollTargets.set(roomId, messageId);
	} else {
		scrollTargets.delete(roomId);
	}
}

export const getReplaceScrollTarget = (roomId: string): string | undefined =>
	scrollTargets.get(roomId);
