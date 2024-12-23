/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, useCallback, useMemo, useState } from 'react';

import {
	Container,
	CreateSnackbarFn,
	Input,
	Modal,
	Text,
	useSnackbar
} from '@zextras/carbonio-design-system';
import { map } from 'lodash';
import { useTranslation } from 'react-i18next';

import { RoomsApi } from '../../../../../network';
import { getOwners, getRoomNameSelector } from '../../../../../store/selectors/RoomsSelectors';
import useStore from '../../../../../store/Store';
import { AddMemberFields } from '../../../../../types/network/models/roomBeTypes';
import ContactsSelector, { ContactsSelected } from '../../../ContactsSelector';

type deleteVirtualRoomModalProps = {
	showModal: boolean;
	setShowModal: React.Dispatch<React.SetStateAction<boolean>>;
	modalRef: React.Ref<HTMLDivElement>;
	roomId: string;
};

const EditVirtualRoomModal: FC<deleteVirtualRoomModalProps> = ({
	showModal,
	setShowModal,
	modalRef,
	roomId
}) => {
	const roomName = useStore((state) => getRoomNameSelector(state, roomId));
	const owners = useStore((state) => getOwners(state, roomId));

	const [t] = useTranslation();
	// TODO: translation keys
	const modalTitle = t('', `Edit ${roomName} Virtual Room`, {
		roomName
	});
	const namePlaceholder = t('', "Room's name*");
	const editNameDescription = t(
		'meeting.virtual.modal.description',
		'Give to this Room a recognizable name in order to let your attendees know what they are expecting to meet about.'
	);
	const editModeratorsDescription = t(
		'meeting.virtual.modal.moderator.description',
		'You will moderate this Room. The additional moderator will be added as collaborators with the same privileges.'
	);
	const chipInputPlaceholder = t('meeting.virtual.modal.moderator.input', `Room's moderators`);
	const editVirtualRoomLabel = t('action.edit', 'Edit');
	const closeLabel = t('action.close', 'Close');
	const editRoomSnackbar = t('', 'Virtual Room edited successfully');
	const errorSnackbar = t(
		'settings.profile.errorGenericResponse',
		'Something went wrong. Please retry'
	);

	const [newName, setNewName] = useState<string>(roomName);
	const [contactsSelected, setContactsSelected] = useState<ContactsSelected>([]);

	const onNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.value.length <= 129) setNewName(e.target.value);
	}, []);

	const nameError = useMemo(() => newName.length === 0 || newName.length > 128, [newName]);

	const createSnackbar: CreateSnackbarFn = useSnackbar();

	const handleEditRoom = useCallback(() => {
		const newOwnersToAdd: AddMemberFields[] = map(contactsSelected, (contactChip) => ({
			userId: contactChip.id,
			owner: true,
			historyCleared: false
		}));
		Promise.all([
			RoomsApi.updateRoom(roomId, { name: newName }),
			RoomsApi.addRoomMembers(roomId, newOwnersToAdd)
		])
			.then(() => {
				setShowModal(false);
				createSnackbar({
					key: new Date().toLocaleString(),
					severity: 'success',
					label: editRoomSnackbar,
					hideButton: true
				});
			})
			.catch(() => {
				createSnackbar({
					key: new Date().toLocaleString(),
					label: errorSnackbar,
					hideButton: true
				});
			});
	}, [
		contactsSelected,
		createSnackbar,
		editRoomSnackbar,
		errorSnackbar,
		newName,
		roomId,
		setShowModal
	]);

	const disableEditButton = useMemo(() => nameError, [nameError]);

	return (
		<Modal
			ref={modalRef}
			size="medium"
			title={modalTitle}
			open={showModal}
			onConfirm={handleEditRoom}
			confirmLabel={editVirtualRoomLabel}
			confirmDisabled={disableEditButton}
			onClose={() => setShowModal(false)}
			showCloseIcon
			closeIconTooltip={closeLabel}
		>
			<Container gap="1rem">
				<Text overflow="break-word">{editNameDescription}</Text>
				<Input
					label={namePlaceholder}
					value={newName}
					onChange={onNameChange}
					hasError={nameError}
				/>
				<Text overflow="break-word">{editModeratorsDescription}</Text>
				<ContactsSelector
					contactsSelected={contactsSelected}
					setContactSelected={setContactsSelected}
					currentMembers={owners}
					chipInputPlaceholder={chipInputPlaceholder}
				/>
			</Container>
		</Modal>
	);
};

export default EditVirtualRoomModal;
