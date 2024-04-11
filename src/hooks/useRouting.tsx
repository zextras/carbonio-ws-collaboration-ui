/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { useCallback } from 'react';

import { pushHistory, replaceHistory } from '@zextras/carbonio-shell-ui';
import { useHistory } from 'react-router-dom';

export enum ROUTES {
	MAIN = '/',
	ROOM = '/:roomId'
}

export enum MEETINGS_ROUTES {
	MEETING = '/meeting/:meetingId',
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
	UNAUTHENTICATED = 'unauthenticated'
}

export type UseRoutingHook = {
	goToMainPage: () => void;
	goToRoomPage: (roomId: string) => void;
	goToMeetingPage: (meetingId: string) => void;
	goToInfoPage: (infoType: PAGE_INFO_TYPE) => void;
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

	// Meeting routing
	const goToMeetingPage = useCallback(
		(meetingId: string): void => route(MEETINGS_ROUTES.MEETING.replace(':meetingId', meetingId)),
		[route]
	);
	const goToInfoPage = useCallback(
		(infoType: PAGE_INFO_TYPE): void => route(MEETINGS_ROUTES.INFO.replace(':infoType', infoType)),
		[route]
	);

	return {
		goToMainPage,
		goToRoomPage,
		goToMeetingPage,
		goToInfoPage
	};
};

export default useRouting;
