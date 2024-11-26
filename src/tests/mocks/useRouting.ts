/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import type * as useRoutingModule from '../../hooks/useRouting';

export const mockGoToRoomPage: jest.Mock = jest.fn();
export const mockGoToMainPage: jest.Mock = jest.fn();
export const mockGoToChatsPage: jest.Mock = jest.fn();
export const mockGoToMeetingPage: jest.Mock = jest.fn();
export const mockGoToInfoPage: jest.Mock = jest.fn();
export const mockGoToMeetingAccessPage: jest.Mock = jest.fn();
export const mockGoToExternalLoginPage: jest.Mock = jest.fn();

jest.mock<typeof useRoutingModule>('../../hooks/useRouting', () => ({
	__esModule: true,
	...jest.requireActual('../../hooks/useRouting'),
	default: (): ReturnType<(typeof useRoutingModule)['default']> => ({
		goToMainPage: mockGoToMainPage,
		goToRoomPage: mockGoToRoomPage,
		goToChatsPage: mockGoToChatsPage,
		goToMeetingPage: mockGoToMeetingPage,
		goToInfoPage: mockGoToInfoPage,
		goToMeetingAccessPage: mockGoToMeetingAccessPage,
		goToExternalLoginPage: mockGoToExternalLoginPage
	})
}));
