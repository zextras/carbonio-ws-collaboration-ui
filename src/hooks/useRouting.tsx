/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { useCallback } from 'react';

import { pushHistory, replaceHistory } from '@zextras/carbonio-shell-ui';
import { useHistory } from 'react-router-dom';

import { CHATS_ROUTE } from '../constants/appConstants';

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
	goToChatsPage: (param: string) => void;
	goToMeetingPage: (meetingId: string) => void;
	goToInfoPage: (infoType: PAGE_INFO_TYPE) => void;
	goToExternalLoginPage: () => void;
	goToMeetingAccessPage: () => void;
};

const useRouting = (): UseRoutingHook => {
	const history = useHistory();
	const route = useCallback((url: string): void => history.push(url), [history]);

	// Chats routing
	const goToMainPage = useCallback(() => replaceHistory(ROUTES.MAIN), []);

	const goToRoomPage = useCallback(
		(roomId: string) => pushHistory(ROUTES.ROOM.replace(':roomId', roomId)),
		[]
	);

	const goToChatsPage = useCallback(
		(param: string) => replaceHistory({ path: `/${param}`, route: CHATS_ROUTE }),
		[]
	);

	// Meeting routing
	const goToMeetingPage = useCallback(
		(meetingId: string): void => route(MEETINGS_ROUTES.MEETING.replace(':meetingId', meetingId)),
		[route]
	);

	const goToInfoPage = useCallback(
		(infoType: PAGE_INFO_TYPE): void => route(MEETINGS_ROUTES.INFO.replace(':infoType', infoType)),
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
		goToChatsPage,
		goToMeetingPage,
		goToInfoPage,
		goToExternalLoginPage,
		goToMeetingAccessPage
	};
};

export default useRouting;
