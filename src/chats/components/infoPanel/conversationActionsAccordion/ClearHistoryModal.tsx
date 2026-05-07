/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC, useCallback } from 'react';

import { Container, Modal, Text } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

import { RoomsApi } from '../../../../network';
import ChatApi from '../../../../network/apis/ChatApi';
import { xmppClient } from '../../../../network/xmpp/XMPPClient';
import {
	getLastMessageSelector,
	getRoomUnreadSelector
} from '../../../../store/selectors/ChatsRegistrySelectors';
import { getIsMongooseIM } from '../../../../store/selectors/ConnectionSelector';
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

	const isMongooseIM = useStore((store) => getIsMongooseIM(store));
	const unreadMessagesCount = useStore((store) => getRoomUnreadSelector(store, roomId));
	const lastTextMessage = useStore((store) => getLastMessageSelector(store, roomId));

	const clearHistory = useCallback(() => {
		if (unreadMessagesCount > 0) {
			if (isMongooseIM) {
				// XMPP: mark read via IQ stanza
				if (lastTextMessage) {
					xmppClient.readMessage(roomId, lastTextMessage.id);
				}
			} else {
				const registry = useStore.getState().chatsRegistry[roomId];
				const msgs = registry?.messages ?? [];
				const lastMsg = msgs[msgs.length - 1];
				const lastMsgId = (lastMsg as any)?.stanzaId ?? (lastMsg as any)?.id;
				if (lastMsgId) {
					ChatApi.setReadMarker(roomId, lastMsgId).catch((err) => {
						console.error('[ClearHistoryModal] Failed to set read marker:', err);
					});
				}
			}
		}
		RoomsApi.clearRoomHistory(roomId).then(() => {
			successfulSnackbar();
			closeModal();
		});
	}, [isMongooseIM, lastTextMessage, closeModal, roomId, successfulSnackbar, unreadMessagesCount]);

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
