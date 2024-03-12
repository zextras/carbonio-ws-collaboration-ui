/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { useCallback, useMemo } from 'react';

import { CHATS_ROUTE, MEETINGS_PATH } from '../constants/appConstants';
import { MeetingsApi } from '../network';
import {
	getMeetingIdFromRoom,
	getRoomNameSelector,
	getRoomTypeSelector
} from '../store/selectors/RoomsSelectors';
import useStore from '../store/Store';
import { MeetingType } from '../types/network/models/meetingBeTypes';
import { RoomType } from '../types/store/RoomTypes';

type RoomMeetingHookType = {
	openMeeting: () => void;
	copyMeetingLink: () => void;
};
const useRoomMeeting = (roomId: string): RoomMeetingHookType => {
	const roomType = useStore((store) => getRoomTypeSelector(store, roomId));
	const roomName = useStore((store) => getRoomNameSelector(store, roomId));
	const meetingId = useStore((store) => getMeetingIdFromRoom(store, roomId));

	const meetingLink = useMemo(() => `${MEETINGS_PATH}${meetingId}`, [meetingId]);

	const openMeeting = useCallback(() => {
		if (meetingId) window.open(meetingLink);
		else {
			const meetingType =
				roomType === RoomType.TEMPORARY ? MeetingType.SCHEDULED : MeetingType.PERMANENT;
			const meetingName = roomType === RoomType.ONE_TO_ONE ? '' : roomName;
			MeetingsApi.createMeeting(roomId, meetingType, meetingName).then((meeting) =>
				window.open(`${MEETINGS_PATH}${meeting.id}`)
			);
		}
	}, [meetingId, meetingLink, roomId, roomName, roomType]);

	const copyMeetingLink = useCallback(() => {
		const separator = window.location.href.includes(CHATS_ROUTE) ? CHATS_ROUTE : MEETINGS_PATH;
		const link = `${window.location.href.split(separator)[0]}${meetingLink}`;
		if (window.parent.navigator.clipboard) {
			window.parent.navigator.clipboard.writeText(link);
		} else {
			const input = window.document.createElement('input');
			input.setAttribute('value', link);
			window.parent.document.body.appendChild(input);
			input.select();
			window.parent.document.execCommand('copy');
			window.parent.document.body.removeChild(input);
		}
	}, [meetingLink]);

	return { openMeeting, copyMeetingLink };
};
export default useRoomMeeting;
