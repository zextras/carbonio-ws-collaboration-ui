/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
export const mockedScrollToEnd = jest.fn();
export const mockedScrollToMessage = jest.fn();
jest.mock('../../utils/scrollUtils', () => ({
	scrollToEnd: mockedScrollToEnd,
	scrollToMessage: mockedScrollToMessage
}));
