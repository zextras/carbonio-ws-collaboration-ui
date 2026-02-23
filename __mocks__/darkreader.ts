/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
export const mockDarkReaderIsEnabled = vi.fn();
export const isEnabled = mockDarkReaderIsEnabled;

export const mockDarkReaderEnable = vi.fn();
export const enable = mockDarkReaderEnable;

export const mockDarkReaderDisable = vi.fn();
export const disable = mockDarkReaderDisable;
