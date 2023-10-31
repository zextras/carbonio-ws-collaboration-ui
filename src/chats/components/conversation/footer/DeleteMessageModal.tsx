/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC, useCallback } from 'react';

import { Container, Modal, Text } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

import { getReferenceMessage } from '../../../../store/selectors/ActiveConversationsSelectors';
import { getXmppClient } from '../../../../store/selectors/ConnectionSelector';
import useStore from '../../../../store/Store';

type DeleteMessageModalProps = {
	roomId: string;
	open: boolean;
	setModalStatus: (status: boolean) => void;
};

const DeleteMessageModal: FC<DeleteMessageModalProps> = ({ roomId, open, setModalStatus }) => {
	const xmppClient = useStore(getXmppClient);
	const referenceMessage = useStore((store) => getReferenceMessage(store, roomId));

	const [t] = useTranslation();
	const deleteMessageTitle = t('modal.deleteMessageTitle', 'Delete selected message?');
	const clearHistoryDescriptionLabel = t(
		'modal.deleteMessageTitleDescription',
		"You're deleting the message, it will no longer be available"
	);
	const deleteActionLabel = t('action.delete', 'Delete');
	const closeLabel = t('action.close', 'Close');

	const onClose = useCallback(() => setModalStatus(false), [setModalStatus]);

	const deleteMessage = useCallback(() => {
		if (referenceMessage) {
			xmppClient.sendChatMessageDeletion(roomId, referenceMessage.stanzaId);
		}
		onClose();
	}, [onClose, referenceMessage, roomId, xmppClient]);

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
