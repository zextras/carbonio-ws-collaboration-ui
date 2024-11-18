/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { Dispatch, FC, SetStateAction, useCallback, useMemo, useRef, useState } from 'react';

import {
	Button,
	CreateSnackbarFn,
	Input,
	Modal,
	Padding,
	Text,
	useSnackbar
} from '@zextras/carbonio-design-system';
import { size } from 'lodash';
import { useTranslation } from 'react-i18next';

import { RoomsApi } from '../../../../network';
import { RoomType } from '../../../../types/store/RoomTypes';

type CreateVirtualRoomButtonProps = {
	toggleModal: () => void;
	showCreationModal: boolean;
	setShowCreationModal: Dispatch<SetStateAction<boolean>>;
	createModalRef: React.RefObject<HTMLDivElement>;
};

const CreateVirtualRoomButton: FC<CreateVirtualRoomButtonProps> = ({
	toggleModal,
	showCreationModal,
	setShowCreationModal,
	createModalRef
}) => {
	const [t] = useTranslation();

	const closeLabel = t('action.close', 'Close');
	const createTooltip = t('meeting.virtual.createTooltip', 'Create new Virtual Room');
	const virtualRoomNameInput = t('meeting.virtual.creationInput', 'New Virtual Room’s name*');
	const invalidNameString = t('meeting.virtual.invalidNameTooltip', 'Invalid name');
	const invalidNameCaption = t(
		'meeting.virtual.modal.invalidNameCaption',
		'Please enter a shorter name'
	);
	const errorSnackbar = t(
		'settings.profile.errorGenericResponse',
		'Something went wrong. Please retry'
	);
	const roomNameRequiredTooltip = t(
		'meeting.virtual.nameRequiredTooltip',
		'Virtual Room’s name is required'
	);
	const newRoomModalDescription = t(
		'meeting.virtual.modal.description',
		'Give to this Room a recognizable name in order to let your attendees know what they are expecting to meet about.'
	);

	const [nameError, setNameError] = useState(false);
	const [canCreateVirtualRoom, setCanCreateVirtualRoom] = useState(false);

	const textRef = useRef<HTMLInputElement>(null);

	const createSnackbar: CreateSnackbarFn = useSnackbar();

	const handleCreateButtonClick = useCallback(() => {
		RoomsApi.addRoom({
			name: textRef.current?.value ?? '',
			type: RoomType.TEMPORARY
		})
			.then(() => {
				setCanCreateVirtualRoom(false);
				setShowCreationModal(false);
			})
			.catch(() => {
				createSnackbar({
					key: new Date().toLocaleString(),
					severity: 'error',
					label: errorSnackbar,
					hideButton: true
				});
			});
	}, [createSnackbar, errorSnackbar, setShowCreationModal]);

	const createVirtualRoomTooltip = useMemo(() => {
		if (nameError) return invalidNameString;
		if (canCreateVirtualRoom) return createTooltip;
		return roomNameRequiredTooltip;
	}, [canCreateVirtualRoom, createTooltip, invalidNameString, nameError, roomNameRequiredTooltip]);

	const handleOnChangeInput = useCallback(() => {
		const textSize = size(textRef.current?.value);
		if (textSize <= 0) {
			setCanCreateVirtualRoom(false);
			setNameError(false);
		} else if (textSize < 128) {
			setCanCreateVirtualRoom(true);
			setNameError(false);
		} else {
			textRef.current!.value = textRef.current!.value.slice(0, 128);
			setCanCreateVirtualRoom(false);
			setNameError(true);
		}
	}, []);

	return (
		<>
			<Button label="Create new Room" color="primary" width="fill" onClick={toggleModal} />
			<Modal
				open={showCreationModal}
				title={createTooltip}
				confirmColor="primary"
				onConfirm={handleCreateButtonClick}
				confirmLabel="create"
				confirmDisabled={!canCreateVirtualRoom}
				confirmTooltip={createVirtualRoomTooltip}
				showCloseIcon
				onClose={toggleModal}
				closeIconTooltip={closeLabel}
				ref={createModalRef}
			>
				<Text overflow="break-word" size="small">
					{newRoomModalDescription}
				</Text>
				<Padding bottom="1rem" />
				<Input
					label={virtualRoomNameInput}
					inputRef={textRef}
					onChange={handleOnChangeInput}
					hasError={nameError}
					description={nameError ? invalidNameCaption : ''}
				/>
			</Modal>
		</>
	);
};

export default CreateVirtualRoomButton;
