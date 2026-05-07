/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC, useCallback } from 'react';

import {
	Container,
	CreateSnackbarFn,
	Modal,
	Text,
	useSnackbar
} from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

import ChatApi from '../../../../network/apis/ChatApi';
import { xmppClient } from '../../../../network/xmpp/XMPPClient';
import { getReferenceMessage } from '../../../../store/selectors/ActiveConversationsSelectors';
import { getIsMongooseIM } from '../../../../store/selectors/ConnectionSelector';
import useStore from '../../../../store/Store';

type DeleteMessageModalProps = {
	roomId: string;
	open: boolean;
	setModalStatus: (status: boolean) => void;
};

const DeleteMessageModal: FC<DeleteMessageModalProps> = ({ roomId, open, setModalStatus }) => {
	const referenceMessage = useStore((store) => getReferenceMessage(store, roomId));
	const isMongooseIM = getIsMongooseIM(useStore.getState());

	const [t] = useTranslation();
	const deleteMessageTitle = t('modal.deleteMessageTitle', 'Delete selected message?');
	const clearHistoryDescriptionLabel = t(
		'modal.deleteMessageTitleDescription',
		"You're deleting the message, it will no longer be available"
	);
	const deleteActionLabel = t('action.delete', 'Delete');
	const closeLabel = t('action.close', 'Close');
	const deleteErrorLabel = t('feedback.deleteMessageError', 'Failed to delete message');

	const createSnackbar: CreateSnackbarFn = useSnackbar();

	const onClose = useCallback(() => setModalStatus(false), [setModalStatus]);

	const deleteMessage = useCallback(() => {
		if (referenceMessage) {
			if (isMongooseIM) {
				xmppClient.sendChatMessageDeletion(roomId, referenceMessage.stanzaId);
			} else {
				ChatApi.deleteMessage(roomId, referenceMessage.stanzaId).catch(() => {
					createSnackbar({
						key: new Date().toLocaleString(),
						severity: 'error',
						label: deleteErrorLabel,
						hideButton: true,
						autoHideTimeout: 3000
					});
				});
			}
		}
		onClose();
	}, [onClose, referenceMessage, roomId, isMongooseIM, createSnackbar, deleteErrorLabel]);

	return (
		<Modal
			size="small"
			open={open}
			title={deleteMessageTitle}
			confirmLabel={deleteActionLabel}
			onConfirm={deleteMessage}
			confirmColor="error"
			showCloseIcon
			closeIconTooltip={closeLabel}
			onClose={onClose}
		>
			<Container padding={{ vertical: 'large' }}>
				<Text overflow="break-word">{clearHistoryDescriptionLabel}</Text>
			</Container>
		</Modal>
	);
};

export default DeleteMessageModal;
