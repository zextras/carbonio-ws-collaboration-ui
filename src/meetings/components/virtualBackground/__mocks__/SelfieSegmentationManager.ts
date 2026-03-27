/* eslint-disable @typescript-eslint/ban-ts-comment */
/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export const mockSetResultsCallback = vi.fn();
export const mockInitialize = vi.fn().mockResolvedValue(undefined);
export const mockSend = vi.fn().mockResolvedValue(undefined);
export const mockClose = vi.fn().mockResolvedValue(undefined);

export default class SelfieSegmentationManager {
	public setResultsCallback = mockSetResultsCallback;

	public initialize = mockInitialize;

	public send = mockSend;

	public close = mockClose;
}
