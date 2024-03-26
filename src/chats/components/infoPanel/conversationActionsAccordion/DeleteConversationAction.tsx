/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC, useCallback, useMemo, useState } from 'react';

import { Container } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

import ActionComponent from './ActionComponent';
import DeleteConversationModal from './DeleteConversationModal';
import useRouting from '../../../../hooks/useRouting';
import { RoomsApi } from '../../../../network';
import { RoomType } from '../../../../types/store/RoomTypes';

type DeleteProps = {
	roomId: string;
	type: string;
	numberOfMembers: number;
};

const DeleteConversationAction: FC<DeleteProps> = ({ roomId, type, numberOfMembers }) => {
	const [t] = useTranslation();
	const deleteLabel = useMemo(() => {
		if (type === RoomType.GROUP) {
			return t('modal.deleteGroup', 'Delete Group');
		}
		return t('modal.deleteRoom', 'Delete Room');
	}, [t, type]);

	const [deleteConversationModalOpen, setDeleteConversationModalOpen] = useState(false);

	const { goToMainPage } = useRouting();

	const deleteConversation = useCallback(
		() => RoomsApi.deleteRoomAndMeeting(roomId).then(() => goToMainPage()),
		[goToMainPage, roomId]
	);

	const closeModal = useCallback(() => setDeleteConversationModalOpen(false), []);

	return (
		<Container>
			<ActionComponent
				icon="Trash2Outline"
				actionColor="error"
				padding={{ top: 'small', bottom: 'large' }}
				label={deleteLabel}
				withArrow
				action={(): void => setDeleteConversationModalOpen(true)}
			/>
			{deleteConversationModalOpen && (
				<DeleteConversationModal
					deleteConversationModalOpen={deleteConversationModalOpen}
					deleteConversation={deleteConversation}
					closeModal={closeModal}
					type={type}
					numberOfMembers={numberOfMembers}
					roomId={roomId}
				/>
			)}
		</Container>
	);
};

export default DeleteConversationAction;
