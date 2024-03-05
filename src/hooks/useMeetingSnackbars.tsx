/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { useCallback } from 'react';

import { CreateSnackbarFn, useSnackbar } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

import useEventListener, { EventName } from './useEventListener';
import { getRoomIdByMeetingId } from '../store/selectors/MeetingSelectors';
import { getRoomNameSelector } from '../store/selectors/RoomsSelectors';
import useStore from '../store/Store';

const useMeetingSnackbars = (meetingId: string): void => {
	const roomId = useStore((state) => getRoomIdByMeetingId(state, meetingId));
	const roomsName = useStore((state) => getRoomNameSelector(state, roomId || ''));

	const [t] = useTranslation();
	const okLabel = t('action.ok', 'Ok');
	const mutedByModerator = t(
		'snackbar.mutedByModerator',
		"You've been muted by a moderator, unmute yourself to speak"
	);
	// TODO: Add translation keys
	const recordingStarted = t(
		'',
		`The recording of the "Chats WEB ${roomsName}" meeting has started`,
		{ meetingName: roomsName }
	);

	const createSnackbar: CreateSnackbarFn = useSnackbar();

	const handleMutedEvent = useCallback(() => {
		createSnackbar({
			key: new Date().toLocaleString(),
			type: 'info',
			label: mutedByModerator,
			actionLabel: okLabel,
			disableAutoHide: true
		});
	}, [createSnackbar, mutedByModerator, okLabel]);

	useEventListener(EventName.MEMBER_MUTED, handleMutedEvent);

	const handleRecordingStarted = useCallback(() => {
		createSnackbar({
			key: new Date().toLocaleString(),
			type: 'info',
			label: recordingStarted,
			hideButton: true
		});
	}, [createSnackbar, recordingStarted]);

	useEventListener(EventName.MEETING_RECORDING_STARTED, handleRecordingStarted);

	const handleRecordingStopped = useCallback(() => {
		// TODO add moderator name and translation key
		const recordingStopped = t('', '[Moderator] stopped the registration of this meeting');
		createSnackbar({
			key: new Date().toLocaleString(),
			type: 'info',
			label: recordingStopped,
			hideButton: true
		});
	}, [createSnackbar, t]);

	useEventListener(EventName.MEETING_RECORDING_STOPPED, handleRecordingStopped);
};

export default useMeetingSnackbars;
