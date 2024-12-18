/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, useCallback } from 'react';

import { CreateSnackbarFn, Modal, Text, useSnackbar } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

import { RoomsApi } from '../../../../../network';
import { getRoomNameSelector } from '../../../../../store/selectors/RoomsSelectors';
import useStore from '../../../../../store/Store';

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

	const [t] = useTranslation();
	// TODO: translation keys
	const modalTitle = t('', `Edit ${roomName} Virtual Room`, {
		roomName
	});
	const editNameDescription = t(
		'',
		'Give to this Room a recognizable name in order to let your attendees know what they are expecting to meet about.'
	);
	const editModeratorsDescription = t(
		'',
		'You will moderate this Room. The additional moderator will be added as collaborators with the same privileges.'
	);
	const editVirtualRoomLabel = t('action.edit', 'Edit');
	const closeLabel = t('action.close', 'Close');
	const editRoomSnackbar = t('', 'Virtual Room edited successfully');
	const errorSnackbar = t(
		'settings.profile.errorGenericResponse',
		'Something went wrong. Please retry'
	);

	const createSnackbar: CreateSnackbarFn = useSnackbar();

	const handleDeleteRoom = useCallback(() => {
		// TODO: change name and moderators
		RoomsApi.updateRoom(roomId, { name: roomName })
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
	}, [createSnackbar, editRoomSnackbar, errorSnackbar, roomId, roomName, setShowModal]);

	return (
		<Modal
			title={modalTitle}
			open={showModal}
			onConfirm={handleDeleteRoom}
			confirmLabel={editVirtualRoomLabel}
			onClose={() => setShowModal(false)}
			showCloseIcon
			closeIconTooltip={closeLabel}
			ref={modalRef}
		>
			<Text overflow="break-word">{editNameDescription}</Text>
			<Text overflow="break-word">{editModeratorsDescription}</Text>
		</Modal>
	);
};

export default EditVirtualRoomModal;
