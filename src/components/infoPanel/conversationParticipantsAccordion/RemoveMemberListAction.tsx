/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { IconButton, Tooltip } from '@zextras/carbonio-design-system';
import React, { FC, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

import DeleteUserModal from './DeleteUserModal';
import { RoomsApi } from '../../../network';
import useStore from '../../../store/Store';

type RemoveMemberProps = {
	roomId: string;
	memberId: string;
};

const RemoveMemberListAction: FC<RemoveMemberProps> = ({ roomId, memberId }) => {
	const [t] = useTranslation();
	const removeMemberLabel: string = t('tooltip.removeMember', 'Remove member');
	const [deleteUserModalOpen, setDeleteUserModalOpen] = useState<boolean>(false);

	const closeDeleteModal = useCallback(() => {
		setDeleteUserModalOpen(false);
	}, []);

	const deleteUser = useCallback(() => {
		RoomsApi.deleteRoomMember(roomId, memberId)
			.then(() => {
				useStore.getState().removeRoomMember(roomId, memberId);
			})
			.catch(() => null);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [roomId, memberId]);

	return (
		<>
			<Tooltip label={removeMemberLabel}>
				<IconButton
					iconColor="error"
					size="extralarge"
					icon="Trash2Outline"
					onClick={(): void => setDeleteUserModalOpen(true)}
				/>
			</Tooltip>
			{deleteUserModalOpen && (
				<DeleteUserModal
					deleteUserModalOpen={deleteUserModalOpen}
					deleteUser={deleteUser}
					closeModal={closeDeleteModal}
				/>
			)}
		</>
	);
};

export default RemoveMemberListAction;
