/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, useCallback, useMemo, useState } from 'react';

import {
	Button,
	CreateSnackbarFn,
	Row,
	Tooltip,
	useSnackbar
} from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';
import styled, { DefaultTheme } from 'styled-components';

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

const CustomDeleteButton = styled(Button)<{ $isMyRoom: boolean | undefined }>`
	${({
		$isMyRoom
	}: {
		$isMyRoom: boolean | undefined;
		theme: DefaultTheme;
	}): string | undefined | false => !$isMyRoom && 'opacity: 0.5; cursor: default;'};
	&:hover {
		background-color: ${({ theme }): string => theme.palette.error.regular};
		color: ${({ theme }): string => theme.palette.gray6.regular};
	}
`;

const CustomMainButton = styled(Button)<{ isMyRoom: boolean | undefined }>`
	${({
		isMyRoom
	}: {
		isMyRoom: boolean | undefined;
		theme: DefaultTheme;
	}): string | undefined | false => !isMyRoom && 'opacity: 1;'};
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
						isMyRoom={amIParticipating || isMyRoom}
					/>
				</Tooltip>
			</Row>
			<DeleteVirtualRoomModal
				showModal={showModal}
				setShowModal={setShowModal}
				handleModalOpening={handleModalOpening}
				modalRef={modalRef}
				roomId={roomId}
			/>
		</>
	);
};

export default ManageMeetingButtons;
