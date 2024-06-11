/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { useCallback, useMemo } from 'react';

import { CreateSnackbarFn, useSnackbar } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

import { MeetingsApi } from '../network';
import {
	getParticipantAudioStatus,
	getRoomIdByMeetingId
} from '../store/selectors/MeetingSelectors';
import { getOwnershipOfTheRoom } from '../store/selectors/RoomsSelectors';
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
	const errorSnackbar = t(
		'settings.profile.errorGenericResponse',
		'Something went wrong. Please retry'
	);

	const sessionId: string | undefined = useStore((store) => getUserId(store));
	const participantAudioStatus = useStore((store) =>
		getParticipantAudioStatus(store, meetingId || '', userIdToMute)
	);
	const roomId = useStore((store) => getRoomIdByMeetingId(store, meetingId || ''));
	const amIModerator = useStore((store) => getOwnershipOfTheRoom(store, roomId || ''));

	const createSnackbar: CreateSnackbarFn = useSnackbar();

	const muteForAllHasToAppear = useMemo(
		() => participantAudioStatus && amIModerator && userIdToMute !== sessionId,
		[amIModerator, participantAudioStatus, sessionId, userIdToMute]
	);

	const muteForAll = useCallback(() => {
		if (meetingId !== undefined && participantAudioStatus) {
			MeetingsApi.updateAudioStreamStatus(meetingId, false, userIdToMute).catch(() => {
				createSnackbar({
					key: new Date().toLocaleString(),
					type: 'error',
					label: errorSnackbar
				});
			});
		}
	}, [createSnackbar, errorSnackbar, meetingId, participantAudioStatus, userIdToMute]);

	return { muteForAllHasToAppear, muteForAll };
};

export default useMuteForAll;
