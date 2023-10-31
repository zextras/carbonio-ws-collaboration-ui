/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC } from 'react';

import { Container, Modal, Text } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

type DeleteUserProps = {
	deleteUserModalOpen: boolean;
	deleteUser: () => void;
	closeModal: () => void;
};

const DeleteUserModal: FC<DeleteUserProps> = ({ deleteUserModalOpen, deleteUser, closeModal }) => {
	const [t] = useTranslation();
	const removeMemberTitle: string = t('modal.removeMember', 'Remove member');
	const removeMemberDescriptionLabel: string = t(
		'modal.deleteUserDescription',
		'Are you sure you want to remove this member?'
	);
	const closeLabel = t('action.close', 'Close');

	return (
		<Modal
			size="small"
			open={deleteUserModalOpen}
			title={removeMemberTitle}
			confirmLabel={t('action.removeUser', 'Remove')}
			onConfirm={deleteUser}
			confirmColor="error"
			showCloseIcon
			closeIconTooltip={closeLabel}
			onClose={closeModal}
			data-testid="delete_user_modal"
		>
			<Container padding={{ vertical: 'large' }}>
				<Text>{removeMemberDescriptionLabel}</Text>
			</Container>
		</Modal>
	);
};

export default DeleteUserModal;
