/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export const mockGoToRoomPage: jest.Mock = jest.fn();
export const mockGoToMainPage: jest.Mock = jest.fn();
export const mockGoToChatsPage: jest.Mock = jest.fn();
export const mockGoToMeetingPage: jest.Mock = jest.fn();
export const mockGoToInfoPage: jest.Mock = jest.fn();
export const mockGoToMeetingAccessPage: jest.Mock = jest.fn();
export const mockGoToExternalLoginPage: jest.Mock = jest.fn();

jest.mock('../../hooks/useRouting', () => ({
	__esModule: true,
	default: jest.fn(() => ({
		goToMainPage: mockGoToMainPage,
		goToRoomPage: mockGoToRoomPage,
		goToChatsPage: mockGoToChatsPage,
		goToMeetingPage: mockGoToMeetingPage,
		goToInfoPage: mockGoToInfoPage,
		goToMeetingAccessPage: mockGoToMeetingAccessPage,
		goToExternalLoginPage: mockGoToExternalLoginPage
	})),
	PAGE_INFO_TYPE: {
		HANG_UP_PAGE: 'hang_up_page',
		NEXT_TIME_PAGE: 'next_time_page',
		ROOM_EMPTY: 'room_empty',
		MEETING_ENDED: 'meeting_ended',
		ALREADY_ACTIVE_MEETING_SESSION: 'already_active_meeting_session',
		MEETING_NOT_FOUND: 'meeting_not_found',
		UNAUTHENTICATED: 'unauthenticated'
	}
}));
