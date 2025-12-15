/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type * as useRoutingModule from '../../hooks/useRouting';

export const mockGoToRoomPage: jest.Mock = vi.fn();
export const mockGoToMainPage: jest.Mock = vi.fn();
export const mockGoToMeetingPage: jest.Mock = vi.fn();
export const mockGoToInfoPage: jest.Mock = vi.fn();
export const mockGoToMeetingAccessPage: jest.Mock = vi.fn();
export const mockGoToExternalLoginPage: jest.Mock = vi.fn();

jest.mock<typeof useRoutingModule>('../../hooks/useRouting', () => ({
	__esModule: true,
	...jest.requireActual('../../hooks/useRouting'),
	default: (): ReturnType<(typeof useRoutingModule)['default']> => ({
		goToMainPage: mockGoToMainPage,
		goToRoomPage: mockGoToRoomPage,
		goToMeetingPage: mockGoToMeetingPage,
		goToInfoPage: mockGoToInfoPage,
		goToMeetingAccessPage: mockGoToMeetingAccessPage,
		goToExternalLoginPage: mockGoToExternalLoginPage
	})
}));
