/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import useStore from '../../store/Store';

type WindowOperation = { epoch: string; abandoned: boolean };

const activeOperations = new Map<string, WindowOperation>();
const TIMELINE_URL = /\/rooms\/([^/?]+)\/timeline(?:\?|$)/;

/** A timeline page that answered after its operation was abandoned or its room was wiped. */
export class StaleWindowPageError extends Error {
	constructor() {
		super('stale window page');
		this.name = 'StaleWindowPageError';
	}
}

export const isStaleWindowPageError = (err: unknown): boolean =>
	err instanceof StaleWindowPageError;

/** Changes when a reconnection reset or a history clear wipes the room: a page asked before is stale. */
function getWindowEpoch(roomId: string): string {
	const epochs = useStore.getState().windowEpochs;
	return `${epochs['*'] ?? 0}/${epochs[roomId] ?? 0}`;
}

export function beginWindowOperation(roomId: string): () => void {
	const operation: WindowOperation = { epoch: getWindowEpoch(roomId), abandoned: false };
	activeOperations.set(roomId, operation);
	return (): void => {
		if (activeOperations.get(roomId) === operation) {
			activeOperations.delete(roomId);
		}
	};
}

/** The operation running for the room stops mattering: its late pages are discarded. */
export function abandonWindowOperation(roomId: string): void {
	const operation = activeOperations.get(roomId);
	if (operation) {
		operation.abandoned = true;
		activeOperations.delete(roomId);
	}
}

/**
 * Wraps the fetch of the SDK client: the timeline page of a window operation is discarded before
 * the SDK writes anything when, by the time it answers, the operation was abandoned or the room
 * was wiped (reconnection reset, history clear). Only the operation running at issue time counts.
 */
export function guardWindowPage(url: string, issue: () => Promise<Response>): Promise<Response> {
	const encodedRoomId = TIMELINE_URL.exec(url)?.[1];
	const roomId = encodedRoomId ? decodeURIComponent(encodedRoomId) : undefined;
	const operation = roomId ? activeOperations.get(roomId) : undefined;
	if (!roomId || !operation) {
		return issue();
	}
	return issue().then((response) => {
		if (operation.abandoned || operation.epoch !== getWindowEpoch(roomId)) {
			throw new StaleWindowPageError();
		}
		return response;
	});
}
