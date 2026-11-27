/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import useStore from '../../store/Store';

/** A window load that does not answer in time fails, and the queue of the room moves on. */
export const WINDOW_LOAD_TIMEOUT_MS = 15000;

const controllers = new Map<string, AbortController>();
let watching = false;
const scrollTargets = new Map<string, string>();

function abortRoomLoads(roomId: string): void {
	controllers.get(roomId)?.abort();
	controllers.delete(roomId);
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
			Array.from(controllers.keys()).forEach(abortRoomLoads);
			return;
		}
		Object.keys({ ...before, ...epochs })
			.filter((roomId) => epochs[roomId] !== before[roomId])
			.forEach(abortRoomLoads);
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
