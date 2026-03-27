/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { UseRoutingHook } from '../useRouting';

export const mockGoToRoomPage = vi.fn();
export const mockGoToMainPage = vi.fn();
export const mockGoToMeetingPage = vi.fn();
export const mockGoToInfoPage = vi.fn();
export const mockGoToMeetingAccessPage = vi.fn();
export const mockGoToExternalLoginPage = vi.fn();

const useRouting = (): UseRoutingHook => ({
	goToMainPage: mockGoToMainPage,
	goToRoomPage: mockGoToRoomPage,
	goToMeetingPage: mockGoToMeetingPage,
	goToInfoPage: mockGoToInfoPage,
	goToExternalLoginPage: mockGoToExternalLoginPage,
	goToMeetingAccessPage: mockGoToMeetingAccessPage
});

export default useRouting;
