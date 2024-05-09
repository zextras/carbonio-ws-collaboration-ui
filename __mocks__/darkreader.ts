/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
export const mockDarkReaderIsEnabled = jest.fn();
export const isEnabled: jest.Mock = mockDarkReaderIsEnabled;

export const mockDarkReaderEnable = jest.fn();
export const enable: jest.Mock = mockDarkReaderEnable;

export const mockDarkReaderDisable = jest.fn();
export const disable: jest.Mock = mockDarkReaderDisable;
