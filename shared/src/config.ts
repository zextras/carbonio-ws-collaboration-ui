/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { useStore } from 'zustand/react';

import { EventName, EventPayloads } from './types/AppEvents';

export interface ISharedCodeDependencies {
	BidirectionalConnectionAudioInOut: any;
	VideoScreenInConnection: any;
	VideoOutConnection: any;
	ScreenOutConnection: any;
	useStore: ReturnType<typeof useStore>;
	sendCustomEvent: <E extends EventName>(event: { name: E; data: EventPayloads[E] }) => void;
}

let sharedCodeDependencies: ISharedCodeDependencies | undefined;

export const configureSharedCode = (deps: ISharedCodeDependencies): void => {
	sharedCodeDependencies = deps;
};

export const getSharedCodeConfig = (): ISharedCodeDependencies => {
	if (!sharedCodeDependencies) {
		throw new Error(
			'Shared dependencies not configured. Call configureSharedCode() before using the store.'
		);
	}
	return sharedCodeDependencies;
};
