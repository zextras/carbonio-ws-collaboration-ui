/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createContext, useCallback, useState } from 'react';

export enum MEETINGS_ROUTES {
	MAIN = '/',
	MEETING = '/meeting/:meetingId',
	MEETING_ACCESS_PAGE = '/meetingAccessPage',
	EXTERNAL_ACCESS_PAGE = '/externalAccessPage',
	INFO = '/infoPage/:infoType'
}

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

export type RouterContextType = {
	route: MEETINGS_ROUTES;
	infoType?: PAGE_INFO_TYPE;
	meetingId?: string;
	navigate: (arg: Omit<RouterContextType, 'navigate'>) => void;
};

export const RouterContext = createContext<RouterContextType>({
	route: MEETINGS_ROUTES.MAIN,
	navigate: () => {}
});

export const useRouterContextSetup = (): RouterContextType => {
	const [route, setRoute] = useState<MEETINGS_ROUTES>(MEETINGS_ROUTES.MAIN);
	const [infoType, setInfoType] = useState<PAGE_INFO_TYPE | undefined>(undefined);
	const [meetingId, setMeetingId] = useState<string | undefined>(undefined);

	const navigate = useCallback<RouterContextType['navigate']>(({ route, infoType, meetingId }) => {
		setRoute(route);
		if (infoType) {
			setInfoType(infoType);
			setMeetingId(undefined);
		} else if (meetingId) {
			setMeetingId(meetingId);
			setInfoType(undefined);
		} else {
			setInfoType(undefined);
			setMeetingId(undefined);
		}
	}, []);

	return {
		route,
		infoType,
		meetingId,
		navigate
	};
};
