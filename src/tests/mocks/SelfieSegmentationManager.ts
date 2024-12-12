/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Results } from '@mediapipe/selfie_segmentation';

import { VirtualBackgroundType } from '../../types/store/ActiveMeetingTypes';

export const mockInitialize = jest.fn();
export const mockSend = jest.fn();
export const mockSetResultsCallback = jest.fn();

jest.mock('../../meetings/components/virtualBackground/SelfieSegmentationManager', () => ({
	__esModule: true,
	default: jest.fn(() => ({
		initialize: (): Promise<void> =>
			new Promise((resolve, reject) => {
				const result = mockInitialize();
				result ? resolve(result) : reject(new Error('noResultProvided'));
			}),
		send: (): Promise<void> =>
			new Promise((resolve, reject) => {
				const result = mockSend();
				result ? resolve(result) : reject(new Error('noResultProvided'));
			}),
		setResultsCallback: (
			callback: (results: Results) => void,
			type: VirtualBackgroundType
		): void => {
			mockSetResultsCallback(callback, type);
		},
		close: jest.fn()
	}))
}));
