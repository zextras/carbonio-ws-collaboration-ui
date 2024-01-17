/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { Dispatch, FC, SetStateAction, useCallback, useContext, useState } from 'react';

import {
	Container,
	CreateSnackbarFn,
	IconButton,
	Padding,
	Row,
	SnackbarManagerContext,
	Text,
	Modal,
	Tooltip
} from '@zextras/carbonio-design-system';
import { map } from 'lodash';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

type virtualRoomElementProps = {
	virtualRoomsList: string[];
	setVirtualRoomsList: Dispatch<SetStateAction<string[]>>;
	room: string;
	modalRef: React.RefObject<HTMLDivElement>;
};

const CustomIconButton = styled(IconButton)`
	border-radius: 0.125rem;
`;

const VirtualRoomListElement: FC<virtualRoomElementProps> = ({
	virtualRoomsList,
	setVirtualRoomsList,
	room,
	modalRef
}) => {
	const [t] = useTranslation();

	const deleteVirtualRoomTooltip = t(
		'meeting.scheduledMeetings.deleteVirtualRoomTooltip',
		'Delete Virtual Room'
	);
	const copyVirtualRoomTooltip = t(
		'meeting.scheduledMeetings.copyVirtualRoomTooltip',
		"Copy Virtual Room's link"
	);
	const copyVirtualRoomLinkSnackbar = t(
		'meeting.scheduledMeetings.copyVirtualRoomLink',
		"Virtual Room's link copied"
	);
	const deleteVirtualRoomSnackbar = t(
		'meeting.scheduledMeetings.deleteVirtualRoom',
		'Virtual Room deleted successfully'
	);
	const closeLabel = t('action.close', 'Close');
	const deleteVirtualRoomLabel = t('action.delete', 'Delete');
	const deleteVirtualRoomDescription = t(
		'meeting.scheduledMeetings.deleteMeetingModalDescription',
		'You are deleting this Virtual Room, if it has active meetings, it will be interrupted and no one will be able to access it anymore. Proceed?'
	);
	const modalTitle = t(
		'meeting.scheduledMeetings.deleteMeetingModalTitle',
		`Delete ${room} Virtual Room`,
		{ roomName: room }
	);

	const [showModal, setShowModal] = useState(false);
	const createSnackbar: CreateSnackbarFn = useContext(SnackbarManagerContext);

	// TODO store deletion handling
	const handleDeleteRoom = useCallback(() => {
		const list: string[] = [];
		map(virtualRoomsList, (element) => {
			if (element !== room) list.push(element);
		});
		setVirtualRoomsList(list);
		createSnackbar({
			key: new Date().toLocaleString(),
			type: 'success',
			label: deleteVirtualRoomSnackbar,
			hideButton: true
		});
	}, [createSnackbar, deleteVirtualRoomSnackbar, room, setVirtualRoomsList, virtualRoomsList]);

	// TODO copy link handling
	const handleCopyLink = useCallback(() => {
		console.log('HERE HANDLE THE COPY OF THE LINK');
		createSnackbar({
			key: new Date().toLocaleString(),
			type: 'info',
			label: copyVirtualRoomLinkSnackbar,
			hideButton: true
		});
	}, [createSnackbar, copyVirtualRoomLinkSnackbar]);

	// TODO enter or rejoin meeting handling
	// TODO tooltip handling
	const handleEnterRoom = useCallback(() => {
		console.log('HERE HANDLE ENTERING THE ROOM');
	}, []);

	const handleModalOpening = useCallback(() => {
		setShowModal((prevState) => !prevState);
	}, []);

	return (
		<Container
			padding={{ horizontal: '0.5rem', vertical: '0.75rem' }}
			orientation="horizontal"
			mainAlignment="space-between"
		>
			<Row takeAvailableSpace mainAlignment="flex-start">
				<Text>{room}</Text>
			</Row>
			<Row>
				<Tooltip label={deleteVirtualRoomTooltip}>
					<CustomIconButton
						customSize={{ iconSize: '1.25rem', paddingSize: '0.125rem' }}
						icon="Trash2Outline"
						onClick={handleModalOpening}
					/>
				</Tooltip>
				<Padding right="0.25rem" />
				<Tooltip label={copyVirtualRoomTooltip}>
					<CustomIconButton
						customSize={{ iconSize: '1.25rem', paddingSize: '0.125rem' }}
						icon="Link2Outline"
						onClick={handleCopyLink}
					/>
				</Tooltip>
				<Padding right="0.25rem" />
				<CustomIconButton
					customSize={{ iconSize: '1.25rem', paddingSize: '0.125rem' }}
					icon="ArrowForwardOutline"
					onClick={handleEnterRoom}
				/>
			</Row>
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
		</Container>
	);
};

export default VirtualRoomListElement;
