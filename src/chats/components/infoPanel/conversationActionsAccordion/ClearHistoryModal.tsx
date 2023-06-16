/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Container, Modal, Text } from '@zextras/carbonio-design-system';
import React, { FC, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { RoomsApi } from '../../../../network';
import { getXmppClient } from '../../../../store/selectors/ConnectionSelector';
import { getLastTextMessageIdSelector } from '../../../../store/selectors/MessagesSelectors';
import { getRoomUnreadsSelector } from '../../../../store/selectors/UnreadsCounterSelectors';
import useStore from '../../../../store/Store';
import { ClearRoomHistoryResponse } from '../../../../types/network/responses/roomsResponses';

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
	const clearHistoryTitle = t('action.clearHistory', 'Clear history');
	const clearHistoryDescriptionLabel = t(
		'modal.clearHistoryDescription',
		'You are about to clean up your conversation history, remember that this action cannot be undone. The history of other members will not be deleted.'
	);
	const clearHistoryButtonLabel = t('action.clearHistory', 'Clear history');
	const closeLabel = t('action.close', 'Close');

	const setClearedAt = useStore((state) => state.setClearedAt);
	const xmppClient = useStore(getXmppClient);
	const unreadMessagesCount = useStore((store) => getRoomUnreadsSelector(store, roomId));
	const lastTextMessageId: string | undefined = useStore((state) =>
		getLastTextMessageIdSelector(state, roomId)
	);

	const clearHistory = useCallback(() => {
		if (unreadMessagesCount > 0 && lastTextMessageId) {
			xmppClient.readMessage(roomId, lastTextMessageId);
		}
		RoomsApi.clearRoomHistory(roomId).then((response: ClearRoomHistoryResponse) => {
			setClearedAt(roomId, response.clearedAt);
			successfulSnackbar();
			closeModal();
		});
	}, [
		closeModal,
		lastTextMessageId,
		roomId,
		setClearedAt,
		successfulSnackbar,
		unreadMessagesCount,
		xmppClient
	]);

	return (
		<Modal
			size="small"
			open={clearHistoryModalOpen}
			title={clearHistoryTitle}
			confirmLabel={clearHistoryButtonLabel}
			onConfirm={clearHistory}
			confirmColor="error"
			showCloseIcon
			closeIconTooltip={closeLabel}
			onClose={closeModal}
		>
			<Container padding={{ vertical: 'large' }}>
				<Text overflow="break-word">{clearHistoryDescriptionLabel}</Text>
			</Container>
		</Modal>
	);
};

export default ClearHistoryModal;
