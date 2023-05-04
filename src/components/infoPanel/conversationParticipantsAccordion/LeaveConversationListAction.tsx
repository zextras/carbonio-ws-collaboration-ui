/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { IconButton, Tooltip } from '@zextras/carbonio-design-system';
import React, { FC, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

import useRouting from '../../../hooks/useRouting';
import { RoomsApi } from '../../../network';
import useStore from '../../../store/Store';
import { RoomType } from '../../../types/store/RoomTypes';
import DeleteConversationModal from '../conversationActionsAccordion/DeleteConversationModal';
import LeaveConversationModal from '../conversationActionsAccordion/LeaveConversationModal';

type LeaveConversationProps = {
	iAmOwner: boolean;
	numberOfMembers: number;
	isSessionParticipant: boolean;
	numberOfOwners: number;
	roomId: string;
};

const LeaveConversationListAction: FC<LeaveConversationProps> = ({
	iAmOwner,
	numberOfMembers,
	isSessionParticipant,
	numberOfOwners,
	roomId
}) => {
	const [t] = useTranslation();
	const leaveAndDeleteLabel: string = t(
		'tooltip.leaveAndDelete',
		'Leave and delete the conversation'
	);
	const promoteSomeoneElseToModeratorLabel: string = t(
		'tooltip.promoteSomeoneElseToModerator',
		'Promote someone else to moderator to leave'
	);
	const leaveConversationLabel: string = t('tooltip.leaveConversation', 'Leave conversation');

	const tooltipLabel =
		// eslint-disable-next-line no-nested-ternary
		iAmOwner && numberOfMembers === 1
			? leaveAndDeleteLabel
			: numberOfOwners === 1 && iAmOwner
			? promoteSomeoneElseToModeratorLabel
			: leaveConversationLabel;

	const deleteRoom = useStore((state) => state.deleteRoom);
	const sessionId = useStore((store) => store.session.id);

	const [leaveConversationModalOpen, setLeaveConversationModalOpen] = useState<boolean>(false);
	const [deleteConversationModalOpen, setDeleteConversationModalOpen] = useState<boolean>(false);

	const { goToMainPage } = useRouting();

	const leaveConversation = useCallback(() => {
		if (sessionId) {
			RoomsApi.deleteRoomMember(roomId, sessionId)
				.then(() => {
					deleteRoom(roomId);
					goToMainPage();
				})
				.catch(() => null);
		}
	}, [deleteRoom, goToMainPage, roomId, sessionId]);

	const deleteConversation = useCallback(() => {
		RoomsApi.deleteRoom(roomId)
			.then(() => {
				deleteRoom(roomId);
				goToMainPage();
			})
			.catch(() => null);
	}, [deleteRoom, goToMainPage, roomId]);

	const closeLeaveModal = useCallback(() => {
		setLeaveConversationModalOpen(false);
	}, []);

	const closeDeleteConversationModal = useCallback(() => {
		setDeleteConversationModalOpen(false);
	}, []);
	return (
		<>
			<Tooltip label={tooltipLabel} maxWidth="fit-content">
				<IconButton
					iconColor="error"
					size="extralarge"
					icon={iAmOwner && numberOfMembers === 1 ? 'Trash2Outline' : 'LogOut'}
					onClick={
						iAmOwner && numberOfMembers === 1
							? (): void => setDeleteConversationModalOpen(true)
							: (): void => setLeaveConversationModalOpen(true)
					}
					disabled={
						iAmOwner && isSessionParticipant && numberOfOwners === 1 && numberOfMembers !== 1
					}
				/>
			</Tooltip>
			{deleteConversationModalOpen && (
				<DeleteConversationModal
					deleteConversationModalOpen={deleteConversationModalOpen}
					deleteConversation={deleteConversation}
					closeModal={closeDeleteConversationModal}
					type={RoomType.GROUP}
					numberOfMembers={numberOfMembers}
				/>
			)}
			{leaveConversationModalOpen && (
				<LeaveConversationModal
					leaveConversationModalOpen={leaveConversationModalOpen}
					leaveConversation={leaveConversation}
					closeModal={closeLeaveModal}
					roomType={RoomType.GROUP}
				/>
			)}
		</>
	);
};

export default LeaveConversationListAction;
