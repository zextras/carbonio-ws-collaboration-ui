/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, useCallback, useMemo, useState } from 'react';

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
import styled from 'styled-components';

import useRoomMeeting from '../../../../../hooks/useRoomMeeting';
import { RoomsApi } from '../../../../../network';
import { getUserId } from '../../../../../store/selectors/SessionSelectors';
import useStore from '../../../../../store/Store';
import DeleteVirtualRoomModal from '../DeleteVirtualRoomModal';

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
	const roomActionsTooltip = t('', 'Room actions'); // TODO: key translations
	const copyVirtualRoomLabel = t('meeting.virtual.copyTooltip', "Copy Virtual Room's link");
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

	const [showModal, setShowModal] = useState(false);
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

	const handleModalOpening = useCallback(() => setShowModal((prevState) => !prevState), []);

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
				id: 'deleteRoomAction',
				label: deleteVirtualRoomLabel,
				onClick: handleModalOpening
			});
		}
		return actions;
	}, [
		amIParticipating,
		copyVirtualRoomLabel,
		deleteVirtualRoomLabel,
		handleCopyLink,
		handleModalOpening,
		isMyRoom
	]);

	return (
		<Row orientation="horizontal" gap="0.25rem">
			<Tooltip label={roomActionsTooltip} disablePortal>
				<Dropdown items={items} placement="top-start" disablePortal>
					<Button icon="MoreVertical" type="ghost" color="gray0" onClick={(): void => undefined} />
				</Dropdown>
			</Tooltip>
			<Tooltip label={amIParticipating || isMyRoom ? enterRoomTooltip : leaveRoomTooltip}>
				<JoinRoomButton
					color={amIParticipating || isMyRoom ? 'primary' : 'error'}
					icon={amIParticipating || isMyRoom ? 'Video' : 'LogOut'}
					onClick={amIParticipating || isMyRoom ? openMeeting : leaveConversation}
					$isMyRoom={amIParticipating || isMyRoom}
				/>
			</Tooltip>
			<DeleteVirtualRoomModal
				showModal={showModal}
				setShowModal={setShowModal}
				handleModalOpening={handleModalOpening}
				modalRef={modalRef}
				roomId={roomId}
			/>
		</Row>
	);
};

export default ManageMeetingButtons;
