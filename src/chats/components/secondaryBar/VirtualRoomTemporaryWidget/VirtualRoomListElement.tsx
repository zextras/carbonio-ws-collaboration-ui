/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC, useCallback, useContext, useState } from 'react';

import {
	Container,
	CreateSnackbarFn,
	IconButton,
	Row,
	SnackbarManagerContext,
	Text,
	Modal,
	Tooltip
} from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import { CHATS_ROUTE, MEETINGS_PATH } from '../../../../constants/appConstants';
import { RoomsApi } from '../../../../network';
import { getMyMeetingParticipation } from '../../../../store/selectors/MeetingSelectors';
import { getRoomSelector } from '../../../../store/selectors/RoomsSelectors';
import useStore from '../../../../store/Store';

type virtualRoomElementProps = {
	roomId: string;
	modalRef: React.RefObject<HTMLDivElement>;
};

const CustomIconButton = styled(IconButton)`
	border-radius: 0.125rem;
`;

const VirtualRoomListElement: FC<virtualRoomElementProps> = ({ roomId, modalRef }) => {
	const room = useStore((state) => getRoomSelector(state, roomId));
	const amIPartecipating = useStore((state) => getMyMeetingParticipation(state, roomId));

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
		`Delete ${room.name} Virtual Room`,
		{ roomName: room.name }
	);
	const errorSnackbar = t(
		'settings.profile.errorGenericResponse',
		'Something went wrong. Please retry'
	);
	const joinMeeting = t('meeting.joinMeeting', 'Join meeting');
	const rejoinMeeting = t('meeting.rejoinMeeting', 'Rejoin meeting');

	const [showModal, setShowModal] = useState(false);
	const createSnackbar: CreateSnackbarFn = useContext(SnackbarManagerContext);

	const handleDeleteRoom = useCallback(() => {
		RoomsApi.deleteRoom(roomId)
			.then(() => {
				createSnackbar({
					key: new Date().toLocaleString(),
					type: 'success',
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
	}, [createSnackbar, deleteVirtualRoomSnackbar, errorSnackbar, roomId]);

	const handleCopyLink = useCallback(() => {
		const link = `${window.location.href.split(CHATS_ROUTE)[0]}${MEETINGS_PATH}${room.id}`;
		if (window.parent.navigator.clipboard) {
			window.parent.navigator.clipboard.writeText(link);
		} else {
			const input = window.document.createElement('input');
			input.setAttribute('value', link);
			window.parent.document.body.appendChild(input);
			input.select();
			window.parent.document.execCommand('copy');
			window.parent.document.body.removeChild(input);
		}
		createSnackbar({
			key: new Date().toLocaleString(),
			type: 'info',
			label: copyVirtualRoomLinkSnackbar,
			hideButton: true
		});
	}, [room.id, createSnackbar, copyVirtualRoomLinkSnackbar]);

	const handleEnterRoom = useCallback(() => window.open(`${MEETINGS_PATH}${room.id}`), [room.id]);

	const handleModalOpening = useCallback(() => setShowModal((prevState) => !prevState), []);

	return (
		<Container
			padding={{ horizontal: '0.5rem', vertical: '0.75rem' }}
			orientation="horizontal"
			mainAlignment="space-between"
		>
			<Row takeAvailableSpace mainAlignment="flex-start">
				<Text>{room.name}</Text>
			</Row>
			<Row gap="0.25rem">
				<Tooltip label={deleteVirtualRoomTooltip}>
					<CustomIconButton
						customSize={{ iconSize: '1.25rem', paddingSize: '0.125rem' }}
						icon="Trash2Outline"
						onClick={handleModalOpening}
					/>
				</Tooltip>
				<Tooltip label={copyVirtualRoomTooltip}>
					<CustomIconButton
						customSize={{ iconSize: '1.25rem', paddingSize: '0.125rem' }}
						icon="Link2Outline"
						onClick={handleCopyLink}
					/>
				</Tooltip>
				<Tooltip label={amIPartecipating ? rejoinMeeting : joinMeeting}>
					<CustomIconButton
						customSize={{ iconSize: '1.25rem', paddingSize: '0.125rem' }}
						icon="ArrowForwardOutline"
						onClick={handleEnterRoom}
					/>
				</Tooltip>
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
