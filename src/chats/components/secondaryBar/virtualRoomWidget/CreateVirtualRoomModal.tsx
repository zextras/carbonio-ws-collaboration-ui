/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
	CreateSnackbarFn,
	Input,
	Modal,
	Padding,
	SingleSelectionOnChange,
	Text,
	useSnackbar
} from '@zextras/carbonio-design-system';
import { map, size } from 'lodash';
import { useTranslation } from 'react-i18next';

import { valueItem } from '../../../../integrations/virtualRoomIntegration/SelectVirtualRoomWidget';
import { addRoom } from '../../../../network';
import { getMeetingIdFromRoom } from '../../../../store/selectors/RoomsSelectors';
import useStore from '../../../../store/Store';
import { MemberBe } from '../../../../types/network/models/roomBeTypes';
import { RoomType } from '../../../../types/store/RoomTypes';
import { createMeetingLinkFromOutside } from '../../../../utils/MeetingsUtils';
import ContactsSelector, { ContactsSelected } from '../../contactSelector/ContactsSelector';

type CreateVirtualRoomModalProps = {
	open: boolean;
	onClose: () => void;
	createModalRef: React.RefObject<HTMLDivElement>;
	onChangeVirtualRoom?: SingleSelectionOnChange<valueItem>;
};

const CreateVirtualRoomModal: FC<CreateVirtualRoomModalProps> = ({
	open,
	onClose,
	createModalRef,
	onChangeVirtualRoom
}) => {
	const [t] = useTranslation();

	const closeLabel = t('action.close', 'Close');
	const createLabel = t('action.create', 'Create');
	const createTooltip = t('meeting.virtual.createTooltip', 'Create new Virtual Room');
	const virtualRoomNameInput = t('meeting.virtual.creationInput', 'Virtual Room’s name');
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
		'Give this Virtual Room a recognizable name so that your attendees know what they are expecting to meet about.'
	);
	const addModeratorsDescription = t(
		'meeting.virtual.modal.moderator.description',
		'You will moderate this Virtual Room. The additional moderator will be added as collaborators with the same privileges.'
	);
	const chipInputPlaceholder = t(
		'meeting.virtual.modal.moderator.input',
		`Virtual Room’s moderators`
	);

	const [nameError, setNameError] = useState(false);
	const [canCreateVirtualRoom, setCanCreateVirtualRoom] = useState(false);
	const [contactsSelected, setContactsSelected] = useState<ContactsSelected>([]);

	const textRef = useRef<HTMLInputElement>(null);

	const createSnackbar: CreateSnackbarFn = useSnackbar();

	const handleCreateButtonClick = useCallback(() => {
		const newOwnersToAdd: MemberBe[] = map(contactsSelected, (contactChip) => ({
			userId: contactChip.id,
			owner: true
		}));

		addRoom({
			name: textRef.current?.value ?? '',
			type: RoomType.TEMPORARY,
			members: newOwnersToAdd
		})
			.then((resp): void => {
				if (onChangeVirtualRoom !== undefined) {
					onChangeVirtualRoom({
						id: resp.id,
						label: resp.name ?? '',
						link: createMeetingLinkFromOutside(getMeetingIdFromRoom(useStore.getState(), resp.id))
					});
				}
				setContactsSelected([]);
				setCanCreateVirtualRoom(false);
				onClose();
			})
			.catch(() => {
				createSnackbar({
					key: new Date().toLocaleString(),
					severity: 'error',
					label: errorSnackbar,
					hideButton: true
				});
			});
	}, [contactsSelected, createSnackbar, errorSnackbar, onChangeVirtualRoom, onClose]);

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

	const handleCloseModal = useCallback(() => {
		setContactsSelected([]);
		onClose();
	}, [onClose]);

	useEffect(() => {
		if (open) {
			textRef.current?.focus();
		}
	}, [open]);

	return (
		<Modal
			open={open}
			title={createTooltip}
			confirmColor="primary"
			onConfirm={handleCreateButtonClick}
			confirmLabel={createLabel}
			confirmDisabled={!canCreateVirtualRoom}
			confirmTooltip={createVirtualRoomTooltip}
			showCloseIcon
			onClose={handleCloseModal}
			closeIconTooltip={closeLabel}
			ref={createModalRef}
		>
			<Text overflow="break-word" size="small">
				{newRoomModalDescription}
			</Text>
			<Padding bottom="1rem" />
			<Input
				label={`${virtualRoomNameInput}*`}
				inputRef={textRef}
				onChange={handleOnChangeInput}
				hasError={nameError}
				description={nameError ? invalidNameCaption : ''}
			/>
			<Text overflow="break-word" size="small">
				{addModeratorsDescription}
			</Text>
			<Padding bottom="1rem" />
			<ContactsSelector
				contactsSelected={contactsSelected}
				setContactSelected={setContactsSelected}
				chipInputPlaceholder={chipInputPlaceholder}
			/>
		</Modal>
	);
};

export default CreateVirtualRoomModal;
