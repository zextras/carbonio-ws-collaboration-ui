/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { ReactElement, useCallback, useMemo } from 'react';

import {
	Container,
	CreateSnackbarFn,
	Modal,
	Text,
	useSnackbar
} from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

import { MeetingsApi } from '../../../../network';
import { getRoomIdByMeetingId } from '../../../../store/selectors/MeetingSelectors';
import { getRoomNameSelector } from '../../../../store/selectors/RoomsSelectors';
import useStore from '../../../../store/Store';
import { formatDate } from '../../../../utils/dateUtils';

type StopRecordingModalProps = {
	isOpen: boolean;
	closeModal: () => void;
	meetingId: string;
};

const StopRecordingModal = ({
	isOpen,
	closeModal,
	meetingId
}: StopRecordingModalProps): ReactElement => {
	const roomId = useStore((state) => getRoomIdByMeetingId(state, meetingId));
	const roomName = useStore((state) => getRoomNameSelector(state, roomId ?? ''));

	const defaultRecordingName = useMemo(
		() => `Rec ${formatDate(new Date(), 'YYYY-MM-DD HHmm')} ${roomName}`.replaceAll(' ', '_'),
		[roomName]
	);
	const [t] = useTranslation();
	const title: string = t('meeting.recordingModal.title', 'Stop recording');
	const descriptionLabel: string = t(
		'meeting.recordingModal.description',
		'You are going to stop the recording. You can start a new one at any time.'
	);
	const recordingCaption: string = t(
		'meeting.recordingModal.caption'
		// `The recording will be saved in "${folder.name}" folder on Files. Go to Settings > Chats > Recording to change the destination folder.`,
		// { folderName: folder.name }
	);
	const stopButtonLabel = t('meeting.recordingModal.confirmationAction', 'Stop');
	const closeLabel = t('action.close', 'Close');
	const recordingStopped = t(
		'meeting.recordingStop.successSnackbar.stopper'
		// `You will find ${recordingName} in ${folder.name} as soon as it is available`,
		// { recordingName, folderName: folder.name }
	);
	const errorSnackbarLabel = t(
		'meeting.recordingStop.failureSnackbar',
		'It is not possible to stop the registration, please contact your system administrator.'
	);

	const createSnackbar: CreateSnackbarFn = useSnackbar();

	const stopRecording = useCallback(() => {
		MeetingsApi.stopRecording(meetingId, defaultRecordingName)
			.then(() => {
				createSnackbar({
					key: new Date().toLocaleString(),
					severity: 'info',
					label: recordingStopped,
					hideButton: true
				});
			})
			.catch(() => {
				createSnackbar({
					key: new Date().toLocaleString(),
					severity: 'warning',
					label: errorSnackbarLabel,
					hideButton: true
				});
			})
			.finally(() => {
				closeModal();
			});
	}, [
		closeModal,
		createSnackbar,
		defaultRecordingName,
		errorSnackbarLabel,
		meetingId,
		recordingStopped
	]);

	return (
		<Modal
			size="small"
			open={isOpen}
			title={title}
			onConfirm={stopRecording}
			confirmColor="error"
			confirmLabel={stopButtonLabel}
			showCloseIcon
			onClose={closeModal}
			closeIconTooltip={closeLabel}
		>
			<Container crossAlignment="flex-start">
				<Text overflow="break-word">{descriptionLabel}</Text>
				<Text color="gray1" size="small" overflow="break-word">
					{recordingCaption}
				</Text>
			</Container>
		</Modal>
	);
};

export default StopRecordingModal;
