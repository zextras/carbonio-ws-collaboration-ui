/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import useStore from '../../store/Store';

const activeWindowOperations = new Map<string, string>();
const searchGenerations = new Map<string, number>();
const appendTargets = new Map<string, number>();

/** Changes when a reconnection reset or a history clear wipes the room: a page asked before is stale. */
export function getWindowEpoch(roomId: string): string {
	const epochs = useStore.getState().windowEpochs;
	return `${epochs['*'] ?? 0}/${epochs[roomId] ?? 0}`;
}

export function beginWindowOperation(roomId: string): () => void {
	const epoch = getWindowEpoch(roomId);
	activeWindowOperations.set(roomId, epoch);
	return (): void => {
		if (activeWindowOperations.get(roomId) === epoch) {
			activeWindowOperations.delete(roomId);
		}
	};
}

/** True while a window load of the room runs across a reset or a clear of the room: nothing it fetched may land. */
export function isStaleWindowWrite(roomId: string): boolean {
	const started = activeWindowOperations.get(roomId);
	return started !== undefined && started !== getWindowEpoch(roomId);
}

/** A new query of the room: a next page of an older query must not land any more. */
export function startSearch(roomId: string): void {
	searchGenerations.set(roomId, (searchGenerations.get(roomId) ?? 0) + 1);
}

export function beginSearchPage(roomId: string): () => boolean {
	const generation = searchGenerations.get(roomId) ?? 0;
	appendTargets.set(roomId, generation);
	return (): boolean => (searchGenerations.get(roomId) ?? 0) === generation;
}

export function isStaleSearchAppend(roomId: string): boolean {
	return (appendTargets.get(roomId) ?? 0) !== (searchGenerations.get(roomId) ?? 0);
}
