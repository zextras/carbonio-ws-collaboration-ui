/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Container } from '@zextras/carbonio-design-system';
import React, { FC, useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import useRouting from '../../../hooks/useRouting';
import RoomsApi from '../../../network/apis/RoomsApi';
import { getNumbersOfRoomMembers } from '../../../store/selectors/RoomsSelectors';
import useStore from '../../../store/Store';
import { RoomType } from '../../../types/store/RoomTypes';
import ActionComponent from './ActionComponent';
import DeleteConversationModal from './DeleteConversationModal';

type DeleteProps = {
	roomId: string;
	type: string;
};

const DeleteConversationAction: FC<DeleteProps> = ({ roomId, type }) => {
	const [t] = useTranslation();
	const deleteLabel = useMemo(() => {
		if (type === RoomType.GROUP) {
			return t('modal.deleteGroup', 'Delete Group');
		}
		return t('modal.deleteRoom', 'Delete Room');
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [type]);
	const numberOfMembers: number = useStore((state) => getNumbersOfRoomMembers(state, roomId));
	const [deleteConversationModalOpen, setDeleteConversationModalOpen] = useState(false);

	const { goToMainPage } = useRouting();

	const deleteConversation = useCallback(() => {
		RoomsApi.deleteRoom(roomId)
			.then(() => {
				useStore.getState().deleteRoom(roomId);
				goToMainPage();
			})
			.catch(() => null);
	}, [goToMainPage, roomId]);

	const closeModal = (): void => {
		setDeleteConversationModalOpen(false);
	};

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
				/>
			)}
		</Container>
	);
};

export default DeleteConversationAction;
