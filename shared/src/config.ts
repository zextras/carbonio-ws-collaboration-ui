/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import {
	IBidirectionalConnectionAudioInOut,
	IScreenOutConnection,
	IVideoOutConnection,
	IVideoScreenInConnection
} from './types/network/webRTC/webRTC';

export interface ISharedCodeDependencies {
	BidirectionalConnectionAudioInOut: new (
		meetingId: string,
		audioEnabled: boolean,
		audioDeviceId?: string
	) => IBidirectionalConnectionAudioInOut;
	VideoScreenInConnection: new (meetingId: string) => IVideoScreenInConnection;
	VideoOutConnection: new (
		meetingId: string,
		videoEnabled: boolean,
		videoDeviceId?: string
	) => IVideoOutConnection;
	ScreenOutConnection: new (meetingId: string) => IScreenOutConnection;
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
