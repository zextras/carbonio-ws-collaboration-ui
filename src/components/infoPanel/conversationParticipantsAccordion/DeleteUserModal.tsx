/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Container, Modal, Text } from '@zextras/carbonio-design-system';
import React, { FC } from 'react';
import { useTranslation } from 'react-i18next';

type DeleteUserProps = {
	deleteUserModalOpen: boolean;
	deleteUser: () => void;
	closeModal: () => void;
};

const DeleteUserModal: FC<DeleteUserProps> = ({ deleteUserModalOpen, deleteUser, closeModal }) => {
	const [t] = useTranslation();
	const removeMemberTitle: string = t('modal.removeMember', 'Remove Member');
	const removeMemberDescriptionLabel: string = t(
		'modal.deleteUserDescription',
		'Are you sure you want to remove this member?'
	);

	return (
		<Modal
			size="small"
			open={deleteUserModalOpen}
			title={removeMemberTitle}
			confirmLabel={t('action.removeUser', 'Remove')}
			onConfirm={deleteUser}
			confirmColor="error"
			showCloseIcon
			onClose={closeModal}
		>
			<Container padding={{ vertical: 'large' }}>
				<Text>{removeMemberDescriptionLabel}</Text>
			</Container>
		</Modal>
	);
};

export default DeleteUserModal;