/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC, useCallback, useMemo, useState } from 'react';

import {
	Container,
	CreateSnackbarFn,
	IconButton,
	Row,
	useSnackbar,
	Text,
	Modal,
	Tooltip
} from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import useRoomMeeting from '../../../../hooks/useRoomMeeting';
import { RoomsApi } from '../../../../network';
import {
	getMeetingActive,
	getMyMeetingParticipation
} from '../../../../store/selectors/MeetingSelectors';
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
	const meetingIsActive: boolean = useStore((store) => getMeetingActive(store, roomId));
	const amIParticipating = useStore((state) => getMyMeetingParticipation(state, roomId));

	const [t] = useTranslation();

	const deleteVirtualRoomTooltip = t('meeting.virtual.deleteTooltip', 'Delete Virtual Room');
	const copyVirtualRoomTooltip = t('meeting.virtual.copyTooltip', "Copy Virtual Room's link");
	const copyVirtualRoomLinkSnackbar = t(
		'meeting.virtual.copyLinkSnackbar',
		"Virtual Room's link copied"
	);
	const deleteVirtualRoomSnackbar = t(
		'meeting.virtual.deleteSnackbar',
		'Virtual Room deleted successfully'
	);
	const closeLabel = t('action.close', 'Close');
	const deleteVirtualRoomLabel = t('action.delete', 'Delete');
	const deleteVirtualRoomDescription = t(
		'meeting.virtual.deleteModalDescription',
		'You are deleting this Virtual Room, if it has active meetings, it will be interrupted and no one will be able to access it anymore. Proceed?'
	);
	const modalTitle = t('meeting.virtual.deleteModalTitle', `Delete ${room.name} Virtual Room`, {
		roomName: room.name
	});
	const errorSnackbar = t(
		'settings.profile.errorGenericResponse',
		'Something went wrong. Please retry'
	);
	const startMeeting = t('meeting.startMeeting', 'Start meeting');
	const joinMeeting = t('meeting.joinMeeting', 'Join meeting');
	const rejoinMeeting = t('meeting.rejoinMeeting', 'Rejoin meeting');

	const [showModal, setShowModal] = useState(false);
	const createSnackbar: CreateSnackbarFn = useSnackbar();
	const { openMeeting, copyMeetingLink } = useRoomMeeting(roomId);

	const handleDeleteRoom = useCallback(() => {
		RoomsApi.deleteRoomAndMeeting(roomId)
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
		copyMeetingLink();
		createSnackbar({
			key: new Date().toLocaleString(),
			type: 'info',
			label: copyVirtualRoomLinkSnackbar,
			hideButton: true
		});
	}, [copyMeetingLink, createSnackbar, copyVirtualRoomLinkSnackbar]);

	const enterRoomTooltip = useMemo(
		() => (meetingIsActive ? (amIParticipating ? rejoinMeeting : joinMeeting) : startMeeting),
		[amIParticipating, joinMeeting, meetingIsActive, rejoinMeeting, startMeeting]
	);

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
				<Tooltip label={enterRoomTooltip}>
					<CustomIconButton
						customSize={{ iconSize: '1.25rem', paddingSize: '0.125rem' }}
						icon="ArrowForwardOutline"
						onClick={openMeeting}
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
