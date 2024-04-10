/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { ReactElement, useCallback, useMemo, useState } from 'react';

import {
	Button,
	Container,
	CreateSnackbarFn,
	Input,
	Modal,
	Padding,
	Text,
	Tooltip,
	useSnackbar
} from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

import { MeetingsApi } from '../../../../network';
import { getRoomIdByMeetingId } from '../../../../store/selectors/MeetingSelectors';
import { getRoomNameSelector } from '../../../../store/selectors/RoomsSelectors';
import useStore from '../../../../store/Store';
import { formatDate } from '../../../../utils/dateUtils';
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
	const roomId = useStore((state) => getRoomIdByMeetingId(state, meetingId));
	const roomName = useStore((state) => getRoomNameSelector(state, roomId ?? ''));

	const defaultRecordingName = useMemo(
		() => `Rec ${formatDate(new Date(), 'YYYY-MM-DD HHmm')} ${roomName}`.replaceAll(' ', '_'),
		[roomName]
	);
	const [recordingName, setRecordingName] = useState(defaultRecordingName);
	const folder = getLocalStorageItem(LOCAL_STORAGE_NAMES.RECORDING);

	const [t] = useTranslation();
	const title: string = t('meeting.recordingModal.title', 'Stop recording');
	const descriptionLabel: string = t(
		'meeting.recordingModal.description',
		'You are going to stop the recording. You can start a new one at any time.'
	);
	const recordingInputLabel: string = t('meeting.recordingModal.inputLabel', 'Recording Name');
	const filenameIsRequiredLabel = t(
		'meeting.recordingModal.requiredNameError',
		'The recording file name is required'
	);
	const filenameIsTooLongLabel = t(
		'meeting.recordingModal.exceededCharsError',
		'The recording file name must not exceed 128 characters'
	);
	const recordingCaption: string = t(
		'meeting.recordingModal.caption',
		`The recording will be saved in "${folder.name}".`,
		{ folderName: folder.name }
	);
	const stopButtonLabel = t('meeting.recordingModal.confirmationAction', 'Stop');
	const closeLabel = t('action.close', 'Close');
	const recordingStopped = t(
		'meeting.recordingStop.successSnackbar.stopper',
		`You will find ${recordingName} in ${folder.name} as soon as it is available`,
		{ recordingName, folderName: folder.name }
	);
	const errorSnackbarLabel = t(
		'meeting.recordingStop.failureSnackbar',
		'It is not possible to stop the registration, please contact your system administrator.'
	);

	const createSnackbar: CreateSnackbarFn = useSnackbar();

	const onNameChange = useCallback((e) => {
		if (e.target.value.length < 129) setRecordingName(e.target.value);
	}, []);

	const onCloseModal = useCallback(() => {
		closeModal();
		setRecordingName(defaultRecordingName);
	}, [closeModal, defaultRecordingName]);

	const stopRecording = useCallback(() => {
		MeetingsApi.stopRecording(meetingId, recordingName, folder.id)
			.then(() => {
				createSnackbar({
					key: new Date().toLocaleString(),
					type: 'info',
					label: recordingStopped,
					hideButton: true
				});
				onCloseModal();
			})
			.catch(() => {
				createSnackbar({
					key: new Date().toLocaleString(),
					type: 'warning',
					label: errorSnackbarLabel,
					hideButton: true
				});
				onCloseModal();
			});
	}, [
		createSnackbar,
		errorSnackbarLabel,
		folder.id,
		meetingId,
		onCloseModal,
		recordingName,
		recordingStopped
	]);

	const inputDescription = useMemo(() => {
		if (recordingName === '') return filenameIsRequiredLabel;
		if (recordingName.length >= 128) return filenameIsTooLongLabel;
		return undefined;
	}, [filenameIsTooLongLabel, filenameIsRequiredLabel, recordingName]);

	const tooltipLabel = useMemo(() => {
		if (recordingName === '') return filenameIsRequiredLabel;
		if (recordingName.length >= 128) return filenameIsTooLongLabel;
		return '';
	}, [filenameIsRequiredLabel, filenameIsTooLongLabel, recordingName]);

	const CustomFooter = useMemo(
		() => (
			<Tooltip label={tooltipLabel} placement="right">
				<Container crossAlignment="flex-end">
					<Button
						color="error"
						label={stopButtonLabel}
						onClick={stopRecording}
						disabled={recordingName === '' || recordingName.length >= 128}
					/>
				</Container>
			</Tooltip>
		),
		[recordingName, stopButtonLabel, stopRecording, tooltipLabel]
	);

	return (
		<Modal
			size="small"
			open={isOpen}
			title={title}
			showCloseIcon
			onClose={onCloseModal}
			closeIconTooltip={closeLabel}
			customFooter={CustomFooter}
		>
			<Container crossAlignment="flex-start">
				<Text overflow="break-word">{descriptionLabel}</Text>
				<Padding top="large" />
				<Input
					label={`${recordingInputLabel}*`}
					value={recordingName}
					onChange={onNameChange}
					backgroundColor="gray5"
					hasError={recordingName === '' || recordingName.length >= 128}
					description={inputDescription}
				/>
				<Padding top="small" />
				<Text color="gray1" size="small">
					{recordingCaption}
				</Text>
			</Container>
		</Modal>
	);
};

export default StopRecordingModal;
