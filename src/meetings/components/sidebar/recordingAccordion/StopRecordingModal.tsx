/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { ReactElement, useCallback, useMemo, useState } from 'react';

import {
	Container,
	CreateSnackbarFn,
	Input,
	Modal,
	ModalFooter,
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
	const roomName = useStore((state) => getRoomNameSelector(state, roomId || ''));

	const defaultRecordingName = useMemo(
		() => `Rec ${formatDate(new Date(), 'YYYY-MM-DD HHmm')} ${roomName}`.replaceAll(' ', '_'),
		[roomName]
	);
	const [recordingName, setRecordingName] = useState(defaultRecordingName);
	const folder = { id: 'LOCAL_ROOT', name: 'Home' }; // TODO: retrieve path from local storage

	// TODO: translation keys
	const [t] = useTranslation();
	const title: string = t('', 'Stop recording');
	const descriptionLabel: string = t(
		'',
		'You are going to stop the recording. You can start a new one at any time.'
	);
	const recordingInputLabel: string = t('', 'Recording Name*');
	const recordingInputDescription: string = t(
		'',
		`The recording will be saved in "/${folder.name}".`,
		{ folderName: folder.name }
	);
	const stopButtonLabel = t('', 'Stop');
	const closeLabel = t('action.close', 'Close');
	const recordingStopped = t(
		'',
		`You will find ${recordingName} in /${folder.name} as soon as it is available`,
		{ fileName: recordingName, folderName: folder.name }
	);
	const errorSnackbarLabel = t(
		'',
		'It is not possible to stop the registration, please contact your system administrator.'
	);

	const createSnackbar: CreateSnackbarFn = useSnackbar();

	const onNameChange = useCallback((e) => {
		if (e.target.value.length < 128) setRecordingName(e.target.value);
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

	return (
		<Modal
			size="small"
			open={isOpen}
			title={title}
			showCloseIcon
			onClose={onCloseModal}
			closeIconTooltip={closeLabel}
			customFooter={
				<ModalFooter
					onConfirm={stopRecording}
					confirmLabel={stopButtonLabel}
					confirmColor="error"
					confirmDisabled={recordingName === ''}
				/>
			}
		>
			<Container padding={{ vertical: 'large' }} gap="1rem">
				<Text overflow="break-word">{descriptionLabel}</Text>
				<Input
					label={recordingInputLabel}
					description={recordingInputDescription}
					value={recordingName}
					onChange={onNameChange}
					backgroundColor="gray5"
				/>
			</Container>
		</Modal>
	);
};

export default StopRecordingModal;
