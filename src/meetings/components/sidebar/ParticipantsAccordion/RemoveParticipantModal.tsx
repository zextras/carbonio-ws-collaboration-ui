/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, useCallback } from 'react';

import {
	Container,
	CreateSnackbarFn,
	Modal,
	Text,
	useSnackbar
} from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

import { kickParticipant } from '../../../../network';
import { getUserName } from '../../../../store/selectors/UsersSelectors';
import useStore from '../../../../store/Store';

type RemoveParticipantModalProps = {
	meetingId: string;
	memberId: string;
	closeModal: () => void;
};

const RemoveParticipantModal: FC<RemoveParticipantModalProps> = ({
	meetingId,
	memberId,
	closeModal
}) => {
	const [t] = useTranslation();

	const memberName: string = useStore((store) => getUserName(store, memberId));

	const titleLabel = t('meeting.kick.modal.title', 'Remove {{name}} from the meeting?', {
		name: memberName
	});
	const descriptionLabel = t(
		'meeting.kick.modal.description',
		'{{name}} will be removed from this meeting, even while sharing the screen or recording.',
		{ name: memberName }
	);
	const confirmLabel = t('meeting.kick.modal.confirm', 'Yes, remove');
	const cancelLabel = t('meeting.kick.modal.cancel', 'No, cancel');
	const closeLabel = t('action.close', 'Close');
	const successSnackbarLabel = t(
		'meeting.kick.snackbar.success',
		'{{name}} has been removed from the meeting.',
		{ name: memberName }
	);
	const errorSnackbarLabel = t(
		'meeting.kick.snackbar.error',
		"Couldn't remove {{name}}. Please try again.",
		{ name: memberName }
	);

	const createSnackbar: CreateSnackbarFn = useSnackbar();

	const removeParticipant = useCallback(() => {
		kickParticipant(meetingId, memberId)
			.then(() =>
				createSnackbar({
					key: new Date().toLocaleString(),
					severity: 'success',
					label: successSnackbarLabel,
					hideButton: true
				})
			)
			.catch(() =>
				createSnackbar({
					key: new Date().toLocaleString(),
					severity: 'error',
					label: errorSnackbarLabel,
					hideButton: true
				})
			);
		closeModal();
	}, [closeModal, createSnackbar, errorSnackbarLabel, meetingId, memberId, successSnackbarLabel]);

	return (
		<Modal
			open
			title={titleLabel}
			confirmLabel={confirmLabel}
			confirmColor="error"
			onConfirm={removeParticipant}
			secondaryActionLabel={cancelLabel}
			onSecondaryAction={closeModal}
			showCloseIcon
			onClose={closeModal}
			closeIconTooltip={closeLabel}
			data-testid="remove_participant_modal"
		>
			<Container padding={{ vertical: 'large' }}>
				<Text overflow="break-word">{descriptionLabel}</Text>
			</Container>
		</Modal>
	);
};

export default RemoveParticipantModal;
