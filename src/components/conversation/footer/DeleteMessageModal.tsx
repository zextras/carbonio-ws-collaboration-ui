/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Container, Modal, Text } from '@zextras/carbonio-design-system';
import React, { FC, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { getXmppClient } from '../../../store/selectors/ConnectionSelector';
import useStore from '../../../store/Store';

type DeleteMessageModalProps = {
	roomId: string;
	stanzaId: string;
	removeStanzaId: (stanzaId: string | undefined) => void;
};

const DeleteMessageModal: FC<DeleteMessageModalProps> = ({ roomId, stanzaId, removeStanzaId }) => {
	const xmppClient = useStore(getXmppClient);

	const [t] = useTranslation();
	const deleteMessageTitle = t('modal.deleteMessageTitle', 'Delete selected message?');
	const clearHistoryDescriptionLabel = t(
		'modal.deleteMessageTitleDescription',
		'If you remove the entire content of the message, it will no longer be available and will consequently be deleted.'
	);
	const deleteActionLabel = t('action.delete', 'Delete');
	const closeLabel = t('action.close', 'Close');

	const onClose = useCallback(() => removeStanzaId(undefined), [removeStanzaId]);

	const deleteMessage = useCallback(() => {
		xmppClient.sendChatMessageDeletion(roomId, stanzaId);
		onClose();
	}, [onClose, roomId, stanzaId, xmppClient]);

	return (
		<Modal
			size="small"
			open={stanzaId}
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
