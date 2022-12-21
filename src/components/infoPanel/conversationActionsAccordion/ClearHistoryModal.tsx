/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Container, Modal, Text } from '@zextras/carbonio-design-system';
import React, { FC, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { RoomsApi } from '../../../network';
import useStore from '../../../store/Store';
import { ClearRoomHistoryResponse } from '../../../types/network/responses/roomsResponses';

type ClearHistoryModalProps = {
	roomId: string;
	clearHistoryModalOpen: boolean;
	closeModal: () => void;
	successfulSnackbar: () => void;
};

const ClearHistoryModal: FC<ClearHistoryModalProps> = ({
	roomId,
	clearHistoryModalOpen,
	closeModal,
	successfulSnackbar
}) => {
	const [t] = useTranslation();
	const clearHistoryTitle = t('action.clearHistory', 'Clear History');
	const clearHistoryDescriptionLabel = t(
		'modal.clearHistoryDescription',
		'You are about to clean up your conversation history, remember that this action cannot be undone. The history of other participants will not be deleted.'
	);
	const clearHistoryButtonLabel = t('action.clearHistory', 'Clear History');
	const setClearedAt = useStore((state) => state.setClearedAt);

	const clearHistory = useCallback(() => {
		RoomsApi.clearRoomHistory(roomId).then((response: ClearRoomHistoryResponse) => {
			setClearedAt(roomId, response.clearedAt);
			successfulSnackbar();
			closeModal();
		});
	}, [closeModal, roomId, setClearedAt, successfulSnackbar]);

	return (
		<Modal
			size="small"
			open={clearHistoryModalOpen}
			title={clearHistoryTitle}
			confirmLabel={clearHistoryButtonLabel}
			onConfirm={clearHistory}
			confirmColor="error"
			showCloseIcon
			onClose={closeModal}
		>
			<Container padding={{ vertical: 'large' }}>
				<Text overflow="break-word">{clearHistoryDescriptionLabel}</Text>
			</Container>
		</Modal>
	);
};

export default ClearHistoryModal;
