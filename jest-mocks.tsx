/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { AutoCompleteGalResponse } from './src/network/soap/AutoCompleteRequest';

const noResultProvided = 'no result provided';

// MOCK DARK READER
export const mockDarkReaderIsEnabled: jest.Mock = jest.fn();

jest.mock('darkreader', () => ({
	matchMedia: jest.fn(),
	isEnabled: mockDarkReaderIsEnabled
}));

// MOCK RTC PEER CONNECTION
export const RTCPeerConnection: jest.Mock = jest.fn();

// MOCKED USEROUTING
export const mockGoToRoomPage: jest.Mock = jest.fn();
export const mockGoToMainPage: jest.Mock = jest.fn();
export const mockGoToMeetingPage: jest.Mock = jest.fn();

jest.mock('./src/hooks/useRouting', () => {
	const goToMainPage = mockGoToMainPage;
	const goToRoomPage = mockGoToRoomPage;
	const goToMeetingPage = mockGoToMeetingPage;

	return jest.fn(() => ({
		goToMainPage,
		goToRoomPage,
		goToMeetingPage
	}));
});

// MOCKED USEMEDIAQUERYCHECK
export const mockUseMediaQueryCheck = jest.fn();
jest.mock('./src/hooks/useMediaQueryCheck', () => mockUseMediaQueryCheck);

// MOCKED AUTOCOMPLETEREQUEST
export const mockedAutoCompleteGalRequest: jest.Mock = jest.fn();
mockedAutoCompleteGalRequest.mockReturnValue([]);
jest.mock('./src/network/soap/AutoCompleteRequest', () => ({
	autoCompleteGalRequest: (): Promise<AutoCompleteGalResponse> =>
		new Promise((resolve, reject) => {
			const result = mockedAutoCompleteGalRequest();
			result ? resolve(result) : reject(new Error(noResultProvided));
		})
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
