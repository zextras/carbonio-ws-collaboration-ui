/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type * as useRoutingModule from '../../hooks/useRouting';

export const mockGoToRoomPage = vi.fn();
export const mockGoToMainPage = vi.fn();
export const mockGoToMeetingPage = vi.fn();
export const mockGoToInfoPage = vi.fn();
export const mockGoToMeetingAccessPage = vi.fn();
export const mockGoToExternalLoginPage = vi.fn();

vi.mock('../../hooks/useRouting', async () => {
	const actual = await vi.importActual<typeof useRoutingModule>('../../hooks/useRouting');
	return {
		...actual,
		default: (): ReturnType<(typeof useRoutingModule)['default']> => ({
			goToMainPage: mockGoToMainPage,
			goToRoomPage: mockGoToRoomPage,
			goToMeetingPage: mockGoToMeetingPage,
			goToInfoPage: mockGoToInfoPage,
			goToMeetingAccessPage: mockGoToMeetingAccessPage,
			goToExternalLoginPage: mockGoToExternalLoginPage
		})
	};
});
