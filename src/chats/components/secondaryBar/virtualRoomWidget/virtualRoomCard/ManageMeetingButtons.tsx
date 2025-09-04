/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, useCallback, useMemo, useState } from 'react';

import styled from '@emotion/styled';
import {
	Button,
	CreateSnackbarFn,
	Dropdown,
	DropdownItem,
	Row,
	Tooltip,
	useSnackbar
} from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

import useRoomMeeting from '../../../../../hooks/useRoomMeeting';
import { RoomsApi } from '../../../../../network';
import { getUserId } from '../../../../../store/selectors/SessionSelectors';
import useStore from '../../../../../store/Store';
import DeleteVirtualRoomModal from '../DeleteVirtualRoomModal';
import EditVirtualRoomModal from './EditVirtualRoomModal';

type ManageMeetingButtonsProps = {
	roomId: string;
	amIParticipating: boolean;
	isMyRoom: boolean | undefined;
	modalRef: React.RefObject<HTMLDivElement>;
	meetingIsActive: boolean;
};

const JoinRoomButton = styled(Button)<{ $isMyRoom: boolean | undefined }>`
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
	const roomActionsTooltip = t('tooltip.virtualActions', 'Room actions');
	const copyVirtualRoomLabel = t('action.virtual.copyLink', "Copy Virtual Room's link");
	const editVirtualRoomLabel = t('action.virtual.editRoom', 'Edit Virtual Room');
	const deleteVirtualRoomLabel = t('meeting.virtual.deleteTooltip', 'Delete Virtual Room');
	const startMeetingLabel = t('meeting.startMeeting', 'Start meeting');
	const joinMeetingLabel = t('meeting.joinMeeting', 'Join meeting');
	const rejoinMeetingLabel = t('meeting.rejoinMeeting', 'Rejoin meeting');
	const leaveRoomTooltip = t('modal.leaveRoom', 'Leave Room');
	const copyVirtualRoomLinkSnackbar = t(
		'meeting.virtual.copyLinkSnackbar',
		"Virtual Room's link copied"
	);

	const sessionId = useStore(getUserId);

	const [showEditModal, setShowEditModal] = useState(false);
	const [showDeleteModal, setShowDeleteModal] = useState(false);

	const createSnackbar: CreateSnackbarFn = useSnackbar();

	const { openMeeting, copyMeetingLink } = useRoomMeeting(roomId);

	const leaveConversation = useCallback(() => {
		if (sessionId) RoomsApi.deleteRoomMember(roomId, sessionId);
	}, [roomId, sessionId]);

	const handleCopyLink = useCallback(() => {
		copyMeetingLink();
		createSnackbar({
			key: new Date().toLocaleString(),
			severity: 'info',
			label: copyVirtualRoomLinkSnackbar,
			hideButton: true
		});
	}, [copyMeetingLink, createSnackbar, copyVirtualRoomLinkSnackbar]);

	const enterRoomTooltip = useMemo(() => {
		if (!meetingIsActive) return startMeetingLabel;
		if (amIParticipating) return rejoinMeetingLabel;
		return joinMeetingLabel;
	}, [amIParticipating, joinMeetingLabel, meetingIsActive, rejoinMeetingLabel, startMeetingLabel]);

	const handleEditModalOpening = useCallback(() => setShowEditModal((prevState) => !prevState), []);

	const handleDeleteModalOpening = useCallback(
		() => setShowDeleteModal((prevState) => !prevState),
		[]
	);

	const items = useMemo((): Array<DropdownItem> => {
		const actions = [];
		actions.push({
			id: 'copyLinkAction',
			label: copyVirtualRoomLabel,
			onClick: handleCopyLink,
			disabled: !(amIParticipating || isMyRoom)
		});
		if (isMyRoom) {
			actions.push({
				id: 'editRoomAction',
				label: editVirtualRoomLabel,
				onClick: handleEditModalOpening
			});
			actions.push({
				id: 'deleteRoomAction',
				label: deleteVirtualRoomLabel,
				onClick: handleDeleteModalOpening
			});
		}
		return actions;
	}, [
		amIParticipating,
		copyVirtualRoomLabel,
		deleteVirtualRoomLabel,
		editVirtualRoomLabel,
		handleCopyLink,
		handleDeleteModalOpening,
		handleEditModalOpening,
		isMyRoom
	]);

	const meetingIcon = useMemo(() => {
		if (!amIParticipating && !isMyRoom) return 'LogOut';
		if (!meetingIsActive) return 'StartMeeting';
		if (amIParticipating) return 'RejoinMeeting';
		return 'JoinMeeting';
	}, [amIParticipating, isMyRoom, meetingIsActive]);

	return (
		<Row orientation="horizontal" gap="0.25rem">
			<Tooltip label={roomActionsTooltip} disabled={!isMyRoom && !amIParticipating} disablePortal>
				<Dropdown items={items} placement="top-start" disablePortal>
					<Button
						icon="MoreVertical"
						type="ghost"
						color="gray0"
						onClick={(): void => undefined}
						disabled={!isMyRoom && !amIParticipating}
					/>
				</Dropdown>
			</Tooltip>
			<Tooltip label={amIParticipating || isMyRoom ? enterRoomTooltip : leaveRoomTooltip}>
				<JoinRoomButton
					color={amIParticipating || isMyRoom ? 'primary' : 'error'}
					icon={meetingIcon}
					onClick={amIParticipating || isMyRoom ? openMeeting : leaveConversation}
					$isMyRoom={amIParticipating || isMyRoom}
				/>
			</Tooltip>
			{showEditModal && (
				<EditVirtualRoomModal
					modalRef={modalRef}
					showModal={showEditModal}
					setShowModal={setShowEditModal}
					roomId={roomId}
				/>
			)}
			{showDeleteModal && (
				<DeleteVirtualRoomModal
					modalRef={modalRef}
					showModal={showDeleteModal}
					setShowModal={setShowDeleteModal}
					handleModalOpening={handleDeleteModalOpening}
					roomId={roomId}
				/>
			)}
		</Row>
	);
};

export default ManageMeetingButtons;
