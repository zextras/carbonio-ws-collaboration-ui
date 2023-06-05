/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import {
	Button,
	Container,
	Input,
	Modal,
	Padding,
	SnackbarManagerContext,
	CreateSnackbarFn,
	Tooltip
} from '@zextras/carbonio-design-system';
import React, { FC, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { RoomsApi } from '../../../network';
import {
	getRoomDescriptionSelector,
	getRoomNameSelector
} from '../../../store/selectors/RoomsSelectors';
import useStore from '../../../store/Store';
import { UpdateRoomResponse } from '../../../types/network/responses/roomsResponses';

type EditConversationProps = {
	editModalOpen: boolean;
	closeModal: () => void;
	roomId: string;
};

type CreateSnackbarFn = typeof CreateSnackbarFn;

const EditConversationModal: FC<EditConversationProps> = ({
	roomId,
	closeModal,
	editModalOpen
}) => {
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

	const roomName: string = useStore((state) => getRoomNameSelector(state, roomId));
	const roomDescription: string = useStore((state) => getRoomDescriptionSelector(state, roomId));
	const editLabel = t('action.editRoom', `Edit ${roomName}`, {
		roomName
	});
	const setRoomNameAndDescription = useStore((store) => store.setRoomNameAndDescription);

	const [newName, setNewName] = useState<string>('');
	const [newDescription, setNewDescription] = useState<string>('');
	const [buttonDisabled, setButtonDisabled] = useState<boolean>(true);

	const createSnackbar: CreateSnackbarFn = useContext(SnackbarManagerContext);

	const nameError = useMemo(() => newName.length === 0 || newName.length > 128, [newName]);
	const descriptionError = useMemo(() => newDescription.length > 256, [newDescription]);
	const nameDescription = useMemo(() => {
		if (newName.length === 0)
			return t('editModal.nameTooShort', 'The name is an essential information');
		if (newName.length > 128)
			return t('editModal.nameTooLong', 'Maximum title length is 128 characters');
		return t('editModal.groupNameDetails', 'It is required and identifies the Group');
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [newName]);
	const topicDescription = useMemo(() => {
		if (newDescription.length > 256)
			return t('editModal.topicTooLong', 'Maximum topic length is 256 characters');
		return t('editModal.groupDescriptionDetails', 'It describes the subject of the Group');
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [newDescription]);

	const editAction = useCallback(() => {
		setButtonDisabled(true);
		RoomsApi.updateRoom(roomId, { name: newName, description: newDescription })
			.then((room: UpdateRoomResponse) => {
				setButtonDisabled(false);
				setRoomNameAndDescription(room.id, room.name, room.description);
				closeModal();
			})
			.catch(() => {
				setButtonDisabled(false);
				createSnackbar({
					key: new Date().toLocaleString(),
					type: 'error',
					label: errorSnackbar
				});
			});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [roomId, newName, newDescription, closeModal]);

	useEffect(() => {
		setButtonDisabled(
			(roomName === newName && roomDescription === newDescription) || nameError || descriptionError
		);
	}, [newDescription, newName, roomDescription, roomName, nameError, descriptionError]);

	useEffect(() => {
		setNewName(roomName);
		if (roomDescription) setNewDescription(roomDescription);
	}, [roomDescription, roomName]);

	const onNameChange = useCallback((e) => {
		if (e.target.value.length <= 129) setNewName(e.target.value);
	}, []);

	const onDescriptionChange = useCallback((e) => {
		if (e.target.value.length <= 257) setNewDescription(e.target.value);
	}, []);

	const modalFooter = useMemo(
		() => (
			<Container mainAlignment="flex-end" orientation="horizontal">
				<Tooltip
					placement="bottom"
					label={
						buttonDisabled
							? nameError || descriptionError
								? errorLabelDisabled
								: confirmLabelDisabled
							: confirmEditLabel
					}
					role="tooltip"
				>
					<Container height="fit" width="fit">
						<Button
							data-testid="edit_button"
							label={confirmEditLabel}
							onClick={editAction}
							disabled={buttonDisabled}
						/>
					</Container>
				</Tooltip>
			</Container>
		),
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[buttonDisabled, descriptionError, nameError, editAction]
	);

	return (
		<Modal
			size="medium"
			open={editModalOpen}
			title={editLabel}
			confirmColor="primary"
			showCloseIcon
			closeIconTooltip={closeLabel}
			customFooter={modalFooter}
			onClose={closeModal}
			data-testid="edit_conversation_modal"
		>
			<Container>
				<Input
					data-testid="name_input"
					value={newName}
					label={`${namePlaceholder}*`}
					description={nameDescription}
					onChange={onNameChange}
					backgroundColor="gray5"
					hasError={nameError}
				/>
				<Padding bottom="small" />
				<Input
					data-testid="description_input"
					value={newDescription}
					label={topicPlaceholder}
					description={topicDescription}
					onChange={onDescriptionChange}
					backgroundColor="gray5"
					hasError={descriptionError}
				/>
			</Container>
		</Modal>
	);
};

export default EditConversationModal;