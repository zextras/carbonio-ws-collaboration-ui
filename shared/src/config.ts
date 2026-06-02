/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { UseBoundStore, StoreApi } from 'zustand';

import { EventName, EventPayloads } from './types/AppEvents';
import { RequestType } from './types/network/fetch';
import { AdditionalHeaders } from './types/network/models/attachmentTypes';
import type { RootStore } from './types/store/StoreTypes';
import { MeetingSoundFeedback } from './utils/MeetingsUtils';

export interface IUserMediaManager {
	CONSTRAINT_ASPECT_RATIO: MediaTrackConstraints;
	enumerateDevices: () => void;
	getAudioStream: (deviceId?: string) => Promise<MediaStream>;
	getVideoStream: (deviceId?: string) => Promise<MediaStream>;
	getFrontCameraStream: () => Promise<MediaStream>;
	getAudioAndVideo: (
		audio?:
			| boolean
			| { noiseSuppression?: boolean; echoCancellation?: boolean; deviceId?: { exact: string } },
		video?: boolean | { deviceId?: { exact: string } }
	) => Promise<MediaStream>;
	getScreenStream: () => Promise<MediaStream>;
}

export interface ISharedCodeDependencies {
	useStore: UseBoundStore<StoreApi<RootStore>>;
	UserMediaManager: IUserMediaManager;
	sendCustomEvent: <E extends EventName>(event: { name: E; data: EventPayloads[E] }) => void;
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
	BrowserUtils: any;
	sendAudioFeedback: (type: MeetingSoundFeedback) => void;
	displayWaitingListNotification: (meetingId: string) => void;
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
