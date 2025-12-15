/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
export const mockedScrollToEnd = vi.fn();
export const mockedScrollToMessage = vi.fn();

vi.mock('../../utils/scrollUtils', () => ({
	scrollToEnd: mockedScrollToEnd,
	scrollToMessage: mockedScrollToMessage
}));
