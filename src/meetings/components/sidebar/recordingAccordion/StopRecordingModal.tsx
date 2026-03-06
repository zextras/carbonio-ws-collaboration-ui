/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { ReactElement, useCallback } from 'react';

import {
	Container,
	CreateSnackbarFn,
	Modal,
	Text,
	useSnackbar
} from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

import { stopRecording } from '../../../../network';
import { getUserId } from '../../../../store/selectors/SessionSelectors';
import useStore from '../../../../store/Store';
import { getLocalStorageItem, LOCAL_STORAGE_NAMES } from '../../../../utils/localStorageUtils';

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
	const folder = getLocalStorageItem(LOCAL_STORAGE_NAMES.RECORDING);

	const loggedUserId = useStore(getUserId);
	const recStartedBy = useStore((state) => state.meetings[meetingId].recUserId);

	const [t] = useTranslation();
	const title: string = t('meeting.recordingModal.title', 'Stop recording');
	const descriptionLabel: string = t(
		'meeting.recordingModal.description',
		'You are going to stop the recording. You can start a new one at any time.'
	);
	const recordingCaption: string = t(
		'meeting.recordingModal.caption',
		`The recording will be saved in "${folder.name}" folder on Files. Go to Settings > Chats > Recording to change the destination folder.`,
		{ folderName: folder.name }
	);
	const recordingCaptionGeneral = t(
		'meeting.sidebar.recording.description',
		'The recording will be saved in the Files space of the moderator who started it.'
	);
	const stopButtonLabel = t('meeting.recordingModal.confirmationAction', 'Stop');
	const closeLabel = t('action.close', 'Close');
	const recordingStopped = t(
		'meeting.recordingStop.successSnackbar.stopper',
		`You will find the recording in ${folder.name} as soon as it is available`,
		{ folderName: folder.name }
	);
	const recordingGeneral = t(
		'meeting.recordingStop.successSnackbar.general',
		'Recording stopped successfully'
	);
	const errorSnackbarLabel = t(
		'meeting.recordingStop.failureSnackbar',
		'It is not possible to stop the registration, please contact your system administrator.'
	);

	const createSnackbar: CreateSnackbarFn = useSnackbar();

	const stopRecordingAction = useCallback(() => {
		stopRecording(meetingId)
			.then(() => {
				const snackbarLabel = loggedUserId === recStartedBy ? recordingGeneral : recordingStopped;
				createSnackbar({
					key: new Date().toLocaleString(),
					severity: 'info',
					label: snackbarLabel,
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
		errorSnackbarLabel,
		loggedUserId,
		meetingId,
		recStartedBy,
		recordingGeneral,
		recordingStopped
	]);

	return (
		<Modal
			size="small"
			open={isOpen}
			title={title}
			onConfirm={stopRecordingAction}
			confirmColor="error"
			confirmLabel={stopButtonLabel}
			showCloseIcon
			onClose={closeModal}
			closeIconTooltip={closeLabel}
		>
			<Container crossAlignment="flex-start" gap="1rem">
				<Text overflow="break-word">{descriptionLabel}</Text>
				<Text overflow="break-word">
					{loggedUserId === recStartedBy ? recordingCaption : recordingCaptionGeneral}
				</Text>
			</Container>
		</Modal>
	);
};

export default StopRecordingModal;
