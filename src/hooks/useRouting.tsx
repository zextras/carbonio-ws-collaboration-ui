/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { useCallback } from 'react';

import { useNavigate } from 'react-router-dom';

import { CHATS_ROUTE } from '../constants/appConstants';

// import { CHATS_ROUTE } from '../constants/appConstants';

export enum ROUTES {
	MAIN = '/',
	ROOM = '/:roomId'
}

export enum MEETINGS_ROUTES {
	MEETING = '/meeting/:meetingId',
	EXTERNAL_LOGIN = '/externalLogin',
	MEETING_ACCESS_PAGE = '/meetingAccessPage',
	INFO = '/infoPage/:infoType'
}

export type MeetingRoutesParams = {
	meetingId: string;
	infoType: PAGE_INFO_TYPE;
};

export enum PAGE_INFO_TYPE {
	HANG_UP_PAGE = 'hang_up_page',
	NEXT_TIME_PAGE = 'next_time_page',
	ROOM_EMPTY = 'room_empty',
	MEETING_ENDED = 'meeting_ended',
	ALREADY_ACTIVE_MEETING_SESSION = 'already_active_meeting_session',
	MEETING_NOT_FOUND = 'meeting_not_found',
	UNAUTHENTICATED = 'unauthenticated',
	INVALID_WAITING_ROOM = 'invalid_waiting_room',
	GENERAL_ERROR = 'general_error'
}

export type UseRoutingHook = {
	goToMainPage: () => void;
	goToRoomPage: (roomId: string) => void;
	goToMeetingPage: (meetingId: string) => void;
	goToInfoPage: (infoType: PAGE_INFO_TYPE) => void;
	goToExternalLoginPage: () => void;
	goToMeetingAccessPage: () => void;
};

const useRouting = (): UseRoutingHook => {
	const navigate = useNavigate();
	const route = useCallback(
		(url: string): void => {
			navigate(url, { replace: false });
		},
		[navigate]
	);

	// Chats routing
	const goToMainPage = useCallback(() => navigate(`/${CHATS_ROUTE}${ROUTES.MAIN}`), [navigate]);

	const goToRoomPage = useCallback(
		(roomId: string) => {
			navigate(`/${CHATS_ROUTE}/${roomId}`, { replace: false });
		},
		[navigate]
	);

	// Meeting routing
	const goToMeetingPage = useCallback(
		(meetingId: string): void =>
			navigate(`/focus-mode/${MEETINGS_ROUTES.MEETING.replace(':meetingId', meetingId)}`, {
				replace: false
			}),
		[navigate]
	);

	const goToInfoPage = useCallback(
		(infoType: PAGE_INFO_TYPE): void =>
			route(`/focus-mode/${MEETINGS_ROUTES.INFO.replace(':infoType', infoType)}`),
		[route]
	);

	const goToExternalLoginPage = useCallback(
		(): void => route(MEETINGS_ROUTES.EXTERNAL_LOGIN),
		[route]
	);

	const goToMeetingAccessPage = useCallback(
		(): void => route(MEETINGS_ROUTES.MEETING_ACCESS_PAGE),
		[route]
	);

	return {
		goToMainPage,
		goToRoomPage,
		goToMeetingPage,
		goToInfoPage,
		goToExternalLoginPage,
		goToMeetingAccessPage
	};
};

export default useRouting;
