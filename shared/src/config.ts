/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { EventName, EventPayloads } from './types/AppEvents';
import { RequestType } from './types/network/fetch';

export interface ISharedCodeDependencies {
	BidirectionalConnectionAudioInOut: any;
	VideoScreenInConnection: any;
	VideoOutConnection: any;
	ScreenOutConnection: any;
	useStore: any;
	sendCustomEvent: <E extends EventName>(event: { name: E; data: EventPayloads[E] }) => void;
	fetchAPI: <T>(
		endpoint: string,
		method: RequestType,
		data?: Record<string, unknown> | Array<Record<string, unknown>>,
		retryCount?: number
	) => Promise<T>;
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

export const sharedConfig = new Proxy({} as ISharedCodeDependencies, {
	get: (_target, key: string): ISharedCodeDependencies[keyof ISharedCodeDependencies] =>
		getSharedCodeConfig()[key as keyof ISharedCodeDependencies]
});
