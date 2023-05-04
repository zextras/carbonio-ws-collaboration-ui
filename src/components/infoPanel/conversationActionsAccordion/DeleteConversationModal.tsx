/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Container, Modal, Text } from '@zextras/carbonio-design-system';
import React, { FC, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { RoomType } from '../../../types/store/RoomTypes';

type DeleteModalProps = {
	deleteConversationModalOpen: boolean;
	deleteConversation: () => void;
	closeModal: () => void;
	type: string;
	numberOfMembers: number;
};

const DeleteConversationModal: FC<DeleteModalProps> = ({
	deleteConversationModalOpen,
	deleteConversation,
	closeModal,
	type,
	numberOfMembers
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
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [type]);

	const deleteConversationDescriptionLabel = useMemo(() => {
		if (type === RoomType.GROUP) {
			return t('modal.deleteGroupLabel', 'Are you sure to delete this Group?');
		}
		return t('modal.deleteRoomLabel', 'Are you sure to delete this Room?');
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [type]);

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
				<Text>{deleteConversationDescriptionLabel}</Text>
			</Container>
		</Modal>
	);
};

export default DeleteConversationModal;
