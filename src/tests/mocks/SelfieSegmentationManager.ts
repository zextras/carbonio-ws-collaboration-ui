/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export const mockInitialize = jest.fn();
export const mockSend = jest.fn();

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
			})
	}))
}));
