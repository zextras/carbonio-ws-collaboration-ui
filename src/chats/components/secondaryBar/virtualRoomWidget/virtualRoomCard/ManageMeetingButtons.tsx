/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, useCallback, useMemo, useState } from 'react';

import {
	Button,
	CreateSnackbarFn,
	Modal,
	Row,
	Text,
	Tooltip,
	useSnackbar
} from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import useRoomMeeting from '../../../../../hooks/useRoomMeeting';
import { RoomsApi } from '../../../../../network';
import { getRoomSelector } from '../../../../../store/selectors/RoomsSelectors';
import { getUserId } from '../../../../../store/selectors/SessionSelectors';
import useStore from '../../../../../store/Store';

type ManageMeetingButtonsProps = {
	roomId: string;
	amIParticipating: boolean;
	isMyRoom: boolean | undefined;
	modalRef: React.RefObject<HTMLDivElement>;
	meetingIsActive: boolean;
};

const CustomDeleteButton = styled(Button)<{ $isMyRoom: boolean | undefined }>`
	${({ $isMyRoom }): string | undefined | false => !$isMyRoom && 'opacity: 0.5; cursor: default;'};
	&:hover {
		background-color: ${({ theme }): string => theme.palette.error.regular};
		color: ${({ theme }): string => theme.palette.gray6.regular};
	}
`;

const CustomMainButton = styled(Button)<{ $isMyRoom: boolean | undefined }>`
	${({ $isMyRoom }): string | undefined | false => !$isMyRoom && 'opacity: 1;'};
`;

const ManageMeetingButtons: FC<ManageMeetingButtonsProps> = ({
	roomId,
	isMyRoom,
	modalRef,
	amIParticipating,
	meetingIsActive
}) => {
	const [t] = useTranslation();
	const deleteVirtualRoomTooltip = t('meeting.virtual.deleteTooltip', 'Delete Virtual Room');
	const copyVirtualRoomTooltip = t('meeting.virtual.copyTooltip', "Copy Virtual Room's link");
	const startMeeting = t('meeting.startMeeting', 'Start meeting');
	const joinMeeting = t('meeting.joinMeeting', 'Join meeting');
	const rejoinMeeting = t('meeting.rejoinMeeting', 'Rejoin meeting');
	const closeLabel = t('action.close', 'Close');
	const deleteVirtualRoomLabel = t('action.delete', 'Delete');
	const leaveRoomTooltip = t('modal.leaveRoom', 'Leave Room');
	const copyVirtualRoomLinkSnackbar = t(
		'meeting.virtual.copyLinkSnackbar',
		"Virtual Room's link copied"
	);
	const deleteVirtualRoomSnackbar = t(
		'meeting.virtual.deleteSnackbar',
		'Virtual Room deleted successfully'
	);
	const deleteVirtualRoomDescription = t(
		'meeting.virtual.deleteModalDescription',
		'You are deleting this Virtual Room, if it has active meetings, they will be stopped and no one will be able to access the Room anymore. Proceed?'
	);
	const errorSnackbar = t(
		'settings.profile.errorGenericResponse',
		'Something went wrong. Please retry'
	);

	const sessionId = useStore(getUserId);
	const room = useStore((state) => getRoomSelector(state, roomId));
	const modalTitle = t('meeting.virtual.deleteModalTitle', `Delete ${room.name} Virtual Room`, {
		roomName: room.name
	});

	const [showModal, setShowModal] = useState(false);
	const createSnackbar: CreateSnackbarFn = useSnackbar();
	const { openMeeting, copyMeetingLink } = useRoomMeeting(roomId);

	const leaveConversation = useCallback(() => {
		if (sessionId) {
			RoomsApi.deleteRoomMember(roomId, sessionId).then(() => {});
		}
	}, [roomId, sessionId]);

	const enterMeeting = useMemo(
		() => (amIParticipating ? rejoinMeeting : joinMeeting),
		[amIParticipating, joinMeeting, rejoinMeeting]
	);

	const handleCopyLink = useCallback(() => {
		copyMeetingLink();
		createSnackbar({
			key: new Date().toLocaleString(),
			severity: 'info',
			label: copyVirtualRoomLinkSnackbar,
			hideButton: true
		});
	}, [copyMeetingLink, createSnackbar, copyVirtualRoomLinkSnackbar]);

	const enterRoomTooltip = useMemo(
		() => (meetingIsActive ? enterMeeting : startMeeting),
		[enterMeeting, meetingIsActive, startMeeting]
	);

	const handleDeleteRoom = useCallback(() => {
		RoomsApi.deleteRoomAndMeeting(roomId)
			.then(() => {
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
	}, [createSnackbar, deleteVirtualRoomSnackbar, errorSnackbar, roomId]);

	const handleModalOpening = useCallback(() => setShowModal((prevState) => !prevState), []);

	return (
		<>
			<Row orientation="horizontal" gap="0.25rem">
				{isMyRoom && (
					<Tooltip label={deleteVirtualRoomTooltip}>
						<CustomDeleteButton
							type="ghost"
							color="text"
							icon="Trash2Outline"
							onClick={handleModalOpening}
							$isMyRoom={amIParticipating || isMyRoom}
						/>
					</Tooltip>
				)}
				<Tooltip label={copyVirtualRoomTooltip} disabled={!(amIParticipating || isMyRoom)}>
					<Button
						type="ghost"
						color="text"
						icon="Link2Outline"
						onClick={handleCopyLink}
						disabled={!(amIParticipating || isMyRoom)}
					/>
				</Tooltip>
				<Tooltip label={amIParticipating || isMyRoom ? enterRoomTooltip : leaveRoomTooltip}>
					<CustomMainButton
						color={amIParticipating || isMyRoom ? 'primary' : 'error'}
						icon={amIParticipating || isMyRoom ? 'Video' : 'LogOut'}
						onClick={amIParticipating || isMyRoom ? openMeeting : leaveConversation}
						$isMyRoom={amIParticipating || isMyRoom}
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
		</>
	);
};

export default ManageMeetingButtons;
