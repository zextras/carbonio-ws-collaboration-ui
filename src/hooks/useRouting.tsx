/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { useCallback, useContext } from 'react';

import { useNavigate } from 'react-router-dom';

import { CHATS_ROUTE } from '../constants/appConstants';
import { MEETINGS_ROUTES, PAGE_INFO_TYPE, RouterContext } from '../meetings/contexts/routerContext';

export enum ROUTES {
	MAIN = '/',
	ROOM = '/:roomId'
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
	const { navigate: contextNavigate } = useContext(RouterContext);
	const navigate = useNavigate();

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
		(meetingId: string): void => contextNavigate({ route: MEETINGS_ROUTES.MEETING, meetingId }),
		[contextNavigate]
	);

	const goToInfoPage = useCallback(
		(infoType: PAGE_INFO_TYPE): void => contextNavigate({ route: MEETINGS_ROUTES.INFO, infoType }),
		[contextNavigate]
	);

	const goToExternalLoginPage = useCallback(
		(): void => contextNavigate({ route: MEETINGS_ROUTES.EXTERNAL_ACCESS_PAGE }),
		[contextNavigate]
	);

	const goToMeetingAccessPage = useCallback(
		(): void => contextNavigate({ route: MEETINGS_ROUTES.MEETING_ACCESS_PAGE }),
		[contextNavigate]
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
