/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC, useCallback } from 'react';

import { Container, Modal, Text } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

import { clearRoomHistory } from '../../../../network';
import { xmppClient } from '../../../../network/xmpp/XMPPClient';
import {
	getLastMessageSelector,
	getRoomUnreadSelector
} from '../../../../store/selectors/ChatsRegistrySelectors';
import useStore from '../../../../store/Store';

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
		"You're cleaning your chat history, please note that this action is irreversible. The history will be deleted for you and not for the other members."
	);
	const clearHistoryButtonLabel = t('action.clearHistory', 'Clear history');
	const closeLabel = t('action.close', 'Close');

	const unreadMessagesCount = useStore((store) => getRoomUnreadSelector(store, roomId));
	const lastTextMessage = useStore((state) => getLastMessageSelector(state, roomId));

	const clearHistory = useCallback(() => {
		if (unreadMessagesCount > 0 && lastTextMessage) {
			xmppClient.readMessage(roomId, lastTextMessage.id);
		}
		clearRoomHistory(roomId).then(() => {
			successfulSnackbar();
			closeModal();
		});
	}, [closeModal, lastTextMessage, roomId, successfulSnackbar, unreadMessagesCount]);

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
