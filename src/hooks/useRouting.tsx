/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { pushHistory, replaceHistory } from '@zextras/carbonio-shell-ui';
import { useCallback } from 'react';
import { useHistory } from 'react-router-dom';

export enum ROUTES {
	MAIN = '/',
	ROOM = '/:roomId',
	MEETING = '/meeting/:meetingId',
	WAITING_ROOM = '/waitingRoom/:roomId',
	INFO = '/infoPage/:infoType'
}

export enum PAGE_INFO_TYPE {
	ERROR_PAGE = 'error_page',
	ROOM_EMPTY = 'room_empty',
	MEETING_ENDED = 'meeting_ended'
}

export type UseRoutingHook = {
	goToMainPage: () => void;
	goToRoomPage: (roomId: string) => void;
	goToMeetingPage: (meetingId: string) => void;
	goToWaitingPage: (roomId: string, roomName: string) => void;
	goToInfoPage: (infoType: PAGE_INFO_TYPE) => void;
};

const useRouting = (): UseRoutingHook => {
	const goToMainPage = useCallback(() => replaceHistory(ROUTES.MAIN), []);
	const goToRoomPage = useCallback(
		(roomId: string) => pushHistory(ROUTES.ROOM.replace(':roomId', roomId)),
		[]
	);
	const history = useHistory();
	const route = (url: string): void => history.push(url);
	const goToMeetingPage = (meetingId: string): void => route(`/meeting/${meetingId}`);
	const goToWaitingPage = (roomId: string, roomName: string): void =>
		route(`/waitingRoom/${roomId}?${roomName}`);
	const goToInfoPage = (infoType: PAGE_INFO_TYPE): void => route(`/infoPage/${infoType}`);

	return {
		goToMainPage,
		goToRoomPage,
		goToMeetingPage,
		goToWaitingPage,
		goToInfoPage
	};
};

export default useRouting;
