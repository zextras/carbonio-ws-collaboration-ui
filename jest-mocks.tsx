/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// MOCK DARK READER
export const mockDarkReaderIsEnabled: jest.Mock = jest.fn();

jest.mock('darkreader', () => ({
	matchMedia: jest.fn(),
	isEnabled: mockDarkReaderIsEnabled
}));

// MOCK FETCH
export const fetchResponse: jest.Mock = jest.fn(() => ({}));
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
global.fetch = jest.fn(() =>
	Promise.resolve({
		json: () => fetchResponse(),
		ok: true,
		headers: { get: (): string => 'application/json' }
	})
);

global.URL.createObjectURL = jest.fn();

// MOCK REACT ROUTER
export const mockUseParams = jest.fn();
jest.mock('react-router', () => ({
	...jest.requireActual('react-router'),
	useParams: mockUseParams
}));

export const mockedScrollToEnd = jest.fn();
export const mockedScrollToMessage = jest.fn();
jest.mock('./src/utils/scrollUtils', () => ({
	scrollToEnd: mockedScrollToEnd,
	scrollToMessage: mockedScrollToMessage
}));
