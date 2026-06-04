/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { UseBoundStore, StoreApi } from 'zustand';

import { EventName, EventPayloads } from './types/AppEvents';
import { AudioType } from './types/AudioType';
import { RequestType } from './types/network/fetch';
import { AdditionalHeaders } from './types/network/models/attachmentTypes';
import { STREAM_TYPE } from './types/store/ActiveMeetingTypes';
import type { RootStore } from './types/store/StoreTypes';

export interface ISharedCodeDependencies {
	useStore: UseBoundStore<StoreApi<RootStore>>;
	sendCustomEvent: <E extends EventName>(event: { name: E; data: EventPayloads[E] }) => void;
	playAudio: (audioType: AudioType | string) => void;
	displayNotification: (notificationType: string, data: unknown) => void;
	getStream: (type: STREAM_TYPE, deviceId?: string) => Promise<MediaStream>;
	createSilentAudioStream: () => MediaStream;
	playRemoteAudioStream: (track: MediaStreamTrack) => void;
	clearAuthCookies: () => void;
	registerOnAppClose: (callback: () => void) => void;
	fetchAPI: <T>(
		endpoint: string,
		method: RequestType,
		data?: Record<string, unknown> | Array<Record<string, unknown>>,
		retryCount?: number
	) => Promise<T>;
	sendFileFetchAPI: (
		endpoint: string,
		method: RequestType,
		file: File,
		signal?: AbortSignal,
		optionalFields?: AdditionalHeaders
	) => Promise<any>;
	uploadFileFetchAPI: (
		endpoint: string,
		requestType: RequestType,
		file: File,
		signal?: AbortSignal,
		optionalFields?: AdditionalHeaders
	) => Promise<any>;
}

let sharedCodeDependencies: ISharedCodeDependencies | undefined;

export const configureSharedCode = (deps: ISharedCodeDependencies): void => {
	sharedCodeDependencies = deps;
};

const getSharedCodeConfig = (): ISharedCodeDependencies => {
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
