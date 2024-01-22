/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
export const mockGoToRoomPage: jest.Mock = jest.fn();
export const mockGoToMainPage: jest.Mock = jest.fn();
export const mockGoToMeetingPage: jest.Mock = jest.fn();
export const mockGoToInfoPage: jest.Mock = jest.fn();

jest.mock('../../hooks/useRouting', () =>
	jest.fn(() => ({
		goToMainPage: mockGoToMainPage,
		goToRoomPage: mockGoToRoomPage,
		goToMeetingPage: mockGoToMeetingPage,
		goToInfoPage: mockGoToInfoPage
	}))
);
