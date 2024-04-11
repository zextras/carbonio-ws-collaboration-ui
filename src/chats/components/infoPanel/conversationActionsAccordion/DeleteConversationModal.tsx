/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC, useMemo } from 'react';

import { Container, Modal, Text } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

import { getMeetingActive } from '../../../../store/selectors/MeetingSelectors';
import useStore from '../../../../store/Store';
import { RoomType } from '../../../../types/store/RoomTypes';

type DeleteModalProps = {
	deleteConversationModalOpen: boolean;
	deleteConversation: () => void;
	closeModal: () => void;
	type: string;
	numberOfMembers: number;
	roomId: string;
};

const DeleteConversationModal: FC<DeleteModalProps> = ({
	deleteConversationModalOpen,
	deleteConversation,
	closeModal,
	type,
	numberOfMembers,
	roomId
}) => {
	const [t] = useTranslation();
	const deleteConversationButtonLabel = t('action.delete', 'Delete');
	const closeLabel = t('action.close', 'Close');
	const deleteConversationTitle = useMemo(() => {
		if (type === RoomType.GROUP) {
			if (numberOfMembers && numberOfMembers === 1) {
				return t('modal.leaveAndDelete', 'Leave and delete Group');
			}
			return t('modal.deleteGroup', 'Delete Group');
		}
		return t('modal.deleteRoom', 'Delete Room');
	}, [numberOfMembers, t, type]);

	const isMeetingActive = useStore((store) => getMeetingActive(store, roomId));

	const deleteConversationDescriptionLabel = useMemo(() => {
		if (type === RoomType.GROUP) {
			const confirmDeleteGroupLabel = t(
				'modal.deleteGroupLabel',
				'This action will affect all Group members and cannot be undone. Are you sure you want to delete this Group?'
			);
			if (isMeetingActive) {
				const deleteGroupMeetingOngoingLabel = t(
					'modal.deleteGroupMeetingOngoingLabel',
					'There is currently an active meeting. Deleting the Group will end the meeting without any warning.'
				);
				return (
					<>
						{deleteGroupMeetingOngoingLabel}
						<br />
						<br />
						{confirmDeleteGroupLabel}
					</>
				);
			}
			return confirmDeleteGroupLabel;
		}
		return t('modal.deleteRoomLabel', 'Are you sure to delete this Room?');
	}, [type, t, isMeetingActive]);

	return (
		<Modal
			size="small"
			open={deleteConversationModalOpen}
			title={deleteConversationTitle}
			confirmLabel={deleteConversationButtonLabel}
			onConfirm={deleteConversation}
			confirmColor="error"
			showCloseIcon
			closeIconTooltip={closeLabel}
			onClose={closeModal}
			data-testid="delete_modal"
		>
			<Container padding={{ vertical: 'large' }}>
				<Text overflow="break-word">{deleteConversationDescriptionLabel}</Text>
			</Container>
		</Modal>
	);
};

export default DeleteConversationModal;
