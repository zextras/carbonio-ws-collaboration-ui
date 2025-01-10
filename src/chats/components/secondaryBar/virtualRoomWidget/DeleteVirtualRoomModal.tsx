/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, useCallback } from 'react';

import {
	CreateSnackbarFn,
	Modal,
	SingleSelectionOnChange,
	Text,
	useSnackbar
} from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

import { valueItem } from '../../../../integrations/virtualRoomIntegration/SelectVirtualRoomWidget';
import { RoomsApi } from '../../../../network';
import { getRoomNameSelector } from '../../../../store/selectors/RoomsSelectors';
import useStore from '../../../../store/Store';

type deleteVirtualRoomModalProps = {
	showModal: boolean;
	handleModalOpening: () => void;
	setShowModal: React.Dispatch<React.SetStateAction<boolean>>;
	modalRef: React.Ref<HTMLDivElement>;
	roomId: string;
	onChangeVirtualRoom?: SingleSelectionOnChange<valueItem>;
};

const DeleteVirtualRoomModal: FC<deleteVirtualRoomModalProps> = ({
	showModal,
	setShowModal,
	handleModalOpening,
	modalRef,
	roomId,
	onChangeVirtualRoom
}) => {
	const [t] = useTranslation();

	const closeLabel = t('action.close', 'Close');
	const deleteVirtualRoomLabel = t('action.delete', 'Delete');
	const noVirtualRoomLabel = t('appointment.input.defaultValue', 'No Virtual Room selected');
	const deleteVirtualRoomDescription = t(
		'meeting.virtual.deleteModalDescription',
		'You are deleting this Virtual Room, if it has active meetings, they will be stopped and no one will be able to access the Room anymore. Proceed?'
	);
	const deleteVirtualRoomSnackbar = t(
		'meeting.virtual.deleteSnackbar',
		'Virtual Room deleted successfully'
	);
	const errorSnackbar = t(
		'settings.profile.errorGenericResponse',
		'Something went wrong. Please retry'
	);

	const createSnackbar: CreateSnackbarFn = useSnackbar();

	const roomName = useStore((state) => getRoomNameSelector(state, roomId));
	const modalTitle = t('meeting.virtual.deleteModalTitle', `Delete "${roomName}" Virtual Room`, {
		roomName
	});

	const handleDeleteRoom = useCallback(() => {
		RoomsApi.deleteRoomAndMeeting(roomId)
			.then(() => {
				if (onChangeVirtualRoom !== undefined) {
					onChangeVirtualRoom({
						id: 'no_room_selected',
						label: noVirtualRoomLabel
					});
				}
				setShowModal(false);
				createSnackbar({
					key: new Date().toLocaleString(),
					severity: 'success',
					label: deleteVirtualRoomSnackbar,
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
		createSnackbar,
		deleteVirtualRoomSnackbar,
		errorSnackbar,
		noVirtualRoomLabel,
		onChangeVirtualRoom,
		roomId,
		setShowModal
	]);

	return (
		<Modal
			title={modalTitle}
			open={showModal}
			onConfirm={handleDeleteRoom}
			confirmLabel={deleteVirtualRoomLabel}
			onClose={handleModalOpening}
			showCloseIcon
			ref={modalRef}
			confirmColor="error"
			closeIconTooltip={closeLabel}
		>
			<Text overflow="break-word">{deleteVirtualRoomDescription}</Text>
		</Modal>
	);
};

export default DeleteVirtualRoomModal;
