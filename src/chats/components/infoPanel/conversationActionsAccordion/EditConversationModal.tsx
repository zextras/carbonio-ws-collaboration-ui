/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
	Container,
	Input,
	Modal,
	CreateSnackbarFn,
	useSnackbar
} from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

import { updateRoom } from '../../../../network';
import {
	getRoomDescriptionSelector,
	getRoomNameSelector
} from '../../../../store/selectors/RoomsSelectors';
import useStore from '../../../../store/Store';

type EditConversationProps = {
	roomId: string;
	editModalOpen: boolean;
	closeModal: () => void;
};

const EditConversationModal: FC<EditConversationProps> = ({
	roomId,
	closeModal,
	editModalOpen
}) => {
	const roomName = useStore((state) => getRoomNameSelector(state, roomId));
	const roomDescription = useStore((state) => getRoomDescriptionSelector(state, roomId));
	const inputRef = useRef<HTMLInputElement>(null);

	const [t] = useTranslation();
	const errorSnackbar = t(
		'settings.profile.errorGenericResponse',
		'Something went wrong. Please retry'
	);
	const namePlaceholder = t('conversationInfo.title', 'Title');
	const topicPlaceholder = t('conversationInfo.topic', 'Topic');
	const confirmEditLabel = t('editModal.confirm', 'Edit details');
	const confirmLabelDisabled = t('editModal.confirmDisabled', "You haven't changed anything");
	const errorLabelDisabled = t('editModal.errorDisabled', 'Check the information entered');
	const closeLabel = t('action.close', 'Close');
	const editLabel = t('action.editRoom', `Edit ${roomName}`, { roomName });

	const [newName, setNewName] = useState(roomName);
	const [newDescription, setNewDescription] = useState(roomDescription);
	const [loading, setLoading] = useState(false);

	const nameDescription = useMemo(() => {
		if (newName.length === 0)
			return t('editModal.nameTooShort', 'The name is an essential information');
		if (newName.length > 128)
			return t('editModal.nameTooLong', 'Maximum title length is 128 characters');
		return t('editModal.groupNameDetails', 'It is required and identifies the Group');
	}, [newName.length, t]);

	const topicDescription = useMemo(() => {
		if (newDescription.length > 256)
			return t('editModal.topicTooLong', 'Maximum topic length is 256 characters');
		return t('editModal.groupDescriptionDetails', 'It describes the subject of the Group');
	}, [newDescription.length, t]);

	const nameError = useMemo(() => newName.length === 0 || newName.length > 128, [newName]);

	const descriptionError = useMemo(() => newDescription.length > 256, [newDescription]);

	const buttonDisabled = useMemo(
		() =>
			(roomName === newName && roomDescription === newDescription) || nameError || descriptionError,
		[newDescription, newName, roomDescription, roomName, nameError, descriptionError]
	);

	const editButtonTooltip = useMemo(() => {
		if (buttonDisabled) {
			if (nameError || descriptionError) return errorLabelDisabled;
			return confirmLabelDisabled;
		}
		return confirmEditLabel;
	}, [
		buttonDisabled,
		confirmEditLabel,
		confirmLabelDisabled,
		descriptionError,
		errorLabelDisabled,
		nameError
	]);

	const createSnackbar: CreateSnackbarFn = useSnackbar();

	const onNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.value.length <= 129) setNewName(e.target.value);
	}, []);

	const onDescriptionChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.value.length <= 257) setNewDescription(e.target.value);
	}, []);

	const editAction = useCallback(() => {
		setLoading(true);
		updateRoom(roomId, { name: newName, description: newDescription })
			.then(() => closeModal())
			.catch(() => {
				createSnackbar({
					key: new Date().toLocaleString(),
					severity: 'error',
					label: errorSnackbar
				});
			})
			.finally(() => setLoading(false));
	}, [roomId, newName, newDescription, closeModal, createSnackbar, errorSnackbar]);

	useEffect(() => {
		if (editModalOpen) {
			inputRef.current?.focus();
		}
	}, [editModalOpen]);

	return (
		<Modal
			size="medium"
			open={editModalOpen}
			title={editLabel}
			onConfirm={editAction}
			confirmLabel={confirmEditLabel}
			confirmDisabled={buttonDisabled || loading}
			confirmTooltip={editButtonTooltip}
			showCloseIcon
			closeIconTooltip={closeLabel}
			onClose={closeModal}
			data-testid="edit_conversation_modal"
		>
			<Container gap="0.5rem">
				<Input
					inputRef={inputRef}
					data-testid="name_input"
					value={newName}
					label={`${namePlaceholder}*`}
					description={nameDescription}
					onChange={onNameChange}
					background="gray5"
					hasError={nameError}
				/>
				<Input
					data-testid="description_input"
					value={newDescription}
					label={topicPlaceholder}
					description={topicDescription}
					onChange={onDescriptionChange}
					background="gray5"
					hasError={descriptionError}
				/>
			</Container>
		</Modal>
	);
};

export default EditConversationModal;
