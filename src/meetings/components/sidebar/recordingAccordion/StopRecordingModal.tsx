/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { ReactElement, useCallback, useMemo, useState } from 'react';

import { Container, Input, Modal, ModalFooter, Text } from '@zextras/carbonio-design-system';
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
	// TODO: translation keys
	const [t] = useTranslation();
	const title: string = t('', 'Stop recording');
	const descriptionLabel: string = t(
		'',
		'You are going to stop the recording. You can start a new one at any time.'
	);
	const recordingInputLabel: string = t('', 'Recording Name*');
	// TODO: retrieve path from local storage
	const recordingInputDescription: string = t('', 'The recording will be saved in "/".');
	const stopButtonLabel = t('', 'Stop');
	const closeLabel = t('action.close', 'Close');

	const roomId = useStore((state) => getRoomIdByMeetingId(state, meetingId));
	const roomName = useStore((state) => getRoomNameSelector(state, roomId || ''));

	const defaultRecordingName = useMemo(
		() => `Rec ${formatDate(new Date(), 'YYYY-MM-DD HHmm')} ${roomName}`.replaceAll(' ', '_'),
		[roomName]
	);
	const [recordingName, setRecordingName] = useState(defaultRecordingName);

	const onNameChange = useCallback((e) => {
		// TODO: character limit
		if (e.target.value.length <= 129) setRecordingName(e.target.value);
	}, []);

	const stopRecording = useCallback(() => {
		MeetingsApi.stopRecording(meetingId, recordingName, '/');
		closeModal();
	}, [closeModal, meetingId, recordingName]);

	const onCloseModal = useCallback(() => {
		closeModal();
		setRecordingName(defaultRecordingName);
	}, [closeModal, defaultRecordingName]);

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
