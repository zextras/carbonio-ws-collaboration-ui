/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { useCallback, useMemo } from 'react';

import { useTranslation } from 'react-i18next';

import { MeetingsApi } from '../network';
import {
	getParticipantAudioStatus,
	getRoomIdByMeetingId
} from '../store/selectors/MeetingSelectors';
import { getMyOwnershipOfTheRoom } from '../store/selectors/RoomsSelectors';
import { getUserId } from '../store/selectors/SessionSelectors';
import useStore from '../store/Store';

type useMuteForAllReturn = {
	muteForAllHasToAppear: boolean;
	muteForAll: () => void;
};

const useMuteForAll = (
	meetingId: string | undefined,
	userIdToMute: string | undefined
): useMuteForAllReturn => {
	const [t] = useTranslation();

	const sessionId: string | undefined = useStore((store) => getUserId(store));
	const participantAudioStatus = useStore((store) =>
		getParticipantAudioStatus(store, meetingId || '', userIdToMute)
	);
	const roomId = useStore((store) => getRoomIdByMeetingId(store, meetingId || ''));
	const amIModerator = useStore((store) => getMyOwnershipOfTheRoom(store, sessionId, roomId || ''));

	const muteForAllHasToAppear = useMemo(
		() => participantAudioStatus && amIModerator && userIdToMute !== sessionId,
		[amIModerator, participantAudioStatus, sessionId, userIdToMute]
	);

	const muteForAll = useCallback(() => {
		if (meetingId !== undefined && participantAudioStatus) {
			MeetingsApi.updateAudioStreamStatus(meetingId, false, userIdToMute);
		}
	}, [meetingId, participantAudioStatus, userIdToMute]);

	return { muteForAllHasToAppear, muteForAll };
};

export default useMuteForAll;
