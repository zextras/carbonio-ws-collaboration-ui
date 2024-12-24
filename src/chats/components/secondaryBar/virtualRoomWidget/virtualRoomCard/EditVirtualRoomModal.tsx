/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, useCallback, useEffect, useMemo, useState } from 'react';

import {
	Container,
	CreateSnackbarFn,
	Input,
	Modal,
	Text,
	useSnackbar
} from '@zextras/carbonio-design-system';
import { filter, forEach, map, size } from 'lodash';
import { useTranslation } from 'react-i18next';

import { RoomsApi } from '../../../../../network';
import { getMeetingParticipants } from '../../../../../store/selectors/MeetingSelectors';
import { getOwners, getRoomNameSelector } from '../../../../../store/selectors/RoomsSelectors';
import { getUserId } from '../../../../../store/selectors/SessionSelectors';
import { getUserEmail, getUserName } from '../../../../../store/selectors/UsersSelectors';
import useStore from '../../../../../store/Store';
import ContactsSelector, { ContactsSelected } from '../../../contactSelector/ContactsSelector';

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
	const meetingParticipants = useStore((state) => getMeetingParticipants(state, roomId));

	const [t] = useTranslation();
	const modalTitle = t('meeting.virtual.modal.edit.title ', `Edit "${roomName}" Virtual Room`, {
		roomName
	});
	const namePlaceholder = t('meeting.virtual.creationInput', 'Virtual Room’s name');
	const editNameDescription = t(
		'meeting.virtual.modal.description',
		'Give this Virtual Room a recognizable name so that your attendees know what they are expecting to meet about.'
	);
	const editModeratorsDescription = t(
		'meeting.virtual.modal.moderator.description',
		'You will moderate this Virtual Room. The additional moderator will be added as collaborators with the same privileges.'
	);
	const chipInputPlaceholder = t(
		'meeting.virtual.modal.moderator.input',
		`Virtual Room’s moderators`
	);
	const confirmLabelDisabled = t('editModal.confirmDisabled', "You haven't changed anything");
	const editVirtualRoomLabel = t('action.edit', 'Edit');
	const closeLabel = t('action.close', 'Close');
	const errorSnackbar = t(
		'settings.profile.errorGenericResponse',
		'Something went wrong. Please retry'
	);

	const [newName, setNewName] = useState<string>(roomName);
	const [contactsSelected, setContactsSelected] = useState<ContactsSelected>([]);

	const onNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.value.length <= 129) setNewName(e.target.value);
	}, []);

	useEffect(() => {
		const otherOwners = filter(owners, (owner) => owner.userId !== getUserId(useStore.getState()));
		setContactsSelected(
			map(otherOwners, (owner) => ({
				id: owner.userId,
				displayName: getUserName(useStore.getState(), owner.userId),
				email: getUserEmail(useStore.getState(), owner.userId) ?? ''
			}))
		);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const { ownersToAdd, ownersToRemove, ownersToUpgrade, ownerToDemote } = useMemo(() => {
		const newOwners = contactsSelected
			.map((user) => user.id)
			.filter((userId) => !owners.some((owner) => owner.userId === userId));
		const ownersToAdd = newOwners.filter((userId) => !meetingParticipants?.[userId]);
		const ownersToUpgrade = newOwners.filter((userId) => meetingParticipants?.[userId]);

		const oldOwners = owners
			.map((user) => user.userId)
			.filter((userId) => !contactsSelected.some((contactChip) => contactChip.id === userId))
			.filter((userId) => userId !== getUserId(useStore.getState()));
		const ownersToRemove = oldOwners.filter((userId) => !meetingParticipants?.[userId]);
		const ownerToDemote = oldOwners.filter((userId) => meetingParticipants?.[userId]);
		return { ownersToAdd, ownersToUpgrade, ownersToRemove, ownerToDemote };
	}, [contactsSelected, meetingParticipants, owners]);

	const createSnackbar: CreateSnackbarFn = useSnackbar();

	const handleEditRoom = useCallback(() => {
		const promises = [];
		if (newName !== roomName) promises.push(RoomsApi.updateRoom(roomId, { name: newName }));
		if (size(ownersToAdd) > 0) {
			const members = map(ownersToAdd, (userId) => ({
				userId,
				owner: true,
				historyCleared: false
			}));
			promises.push(RoomsApi.addRoomMembers(roomId, members));
		}
		if (size(ownersToRemove) > 0) {
			forEach(ownersToRemove, (userId) => {
				promises.push(RoomsApi.deleteRoomMember(roomId, userId));
			});
		}
		if (size(ownersToUpgrade) > 0) {
			forEach(ownersToUpgrade, (userId) => {
				promises.push(RoomsApi.promoteRoomMember(roomId, userId));
			});
		}
		if (size(ownerToDemote) > 0) {
			forEach(ownerToDemote, (userId) => {
				promises.push(RoomsApi.demotesRoomMember(roomId, userId));
			});
		}

		Promise.all(promises)
			.then(() => {
				setShowModal(false);
			})
			.catch(() => {
				createSnackbar({
					key: new Date().toLocaleString(),
					label: errorSnackbar,
					hideButton: true
				});
			});
	}, [
		createSnackbar,
		errorSnackbar,
		newName,
		ownerToDemote,
		ownersToAdd,
		ownersToRemove,
		ownersToUpgrade,
		roomId,
		roomName,
		setShowModal
	]);

	const nameError = useMemo(() => size(newName) === 0 || size(newName) > 128, [newName]);

	const changeSomething = useMemo(
		() =>
			newName !== roomName ||
			size(ownersToAdd) + size(ownersToRemove) + size(ownersToUpgrade) + size(ownerToDemote) > 0,
		[newName, ownerToDemote, ownersToAdd, ownersToRemove, ownersToUpgrade, roomName]
	);

	const disableEditButton = useMemo(
		() => nameError || !changeSomething,
		[changeSomething, nameError]
	);

	return (
		<Modal
			ref={modalRef}
			title={modalTitle}
			open={showModal}
			onConfirm={handleEditRoom}
			confirmLabel={editVirtualRoomLabel}
			confirmDisabled={disableEditButton}
			confirmTooltip={changeSomething ? undefined : confirmLabelDisabled}
			onClose={() => setShowModal(false)}
			showCloseIcon
			closeIconTooltip={closeLabel}
		>
			<Container gap="1rem">
				<Text overflow="break-word">{editNameDescription}</Text>
				<Input
					label={`${namePlaceholder}*`}
					value={newName}
					onChange={onNameChange}
					hasError={nameError}
				/>
				<Text overflow="break-word">{editModeratorsDescription}</Text>
				<ContactsSelector
					contactsSelected={contactsSelected}
					setContactSelected={setContactsSelected}
					chipInputPlaceholder={chipInputPlaceholder}
				/>
			</Container>
		</Modal>
	);
};

export default EditVirtualRoomModal;
