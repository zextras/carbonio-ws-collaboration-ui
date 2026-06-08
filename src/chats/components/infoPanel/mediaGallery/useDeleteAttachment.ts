/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { useCallback, useState } from 'react';

import { useSnackbar } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

import { bulkDeleteRoomAttachments } from '../../../../network';
import { xmppClient } from '../../../../network/xmpp/XMPPClient';
import { getUserId } from '../../../../store/selectors/SessionSelectors';
import useStore from '../../../../store/Store';
import { Attachment } from '../../../../types/network/models/attachmentTypes';

export type UseDeleteAttachmentHook = {
	canDelete: boolean;
	modalOpen: boolean;
	openModal: () => void;
	closeModal: () => void;
	confirmDelete: () => void;
};

const useDeleteAttachment = (attachment: Attachment): UseDeleteAttachmentHook => {
	const [t] = useTranslation();
	const successLabel = t('feedback.attachmentDeleted', 'Attachment deleted');
	const errorLabel = t('feedback.attachmentDeleteError', 'Could not delete the attachment');

	const sessionId = useStore(getUserId);
	const removeMediaGalleryAttachment = useStore((store) => store.removeMediaGalleryAttachment);
	const createSnackbar = useSnackbar();

	const [modalOpen, setModalOpen] = useState(false);

	const canDelete = sessionId === attachment.userId;

	const openModal = useCallback(() => setModalOpen(true), []);
	const closeModal = useCallback(() => setModalOpen(false), []);

	const confirmDelete = useCallback(() => {
		setModalOpen(false);
		const showSnackbar = (severity: 'success' | 'error', label: string): void => {
			createSnackbar({
				key: new Date().toLocaleString(),
				severity,
				label,
				hideButton: true
			});
		};
		bulkDeleteRoomAttachments(attachment.roomId, [attachment.id])
			.then((response) => {
				if (response.failedIds?.includes(attachment.id)) {
					showSnackbar('error', errorLabel);
					return;
				}
				removeMediaGalleryAttachment(attachment.roomId, attachment.id);
				if (attachment.stanzaId) {
					xmppClient.sendChatMessageDeletion(attachment.roomId, attachment.stanzaId);
				}
				showSnackbar('success', successLabel);
			})
			.catch(() => showSnackbar('error', errorLabel));
	}, [
		attachment.id,
		attachment.roomId,
		attachment.stanzaId,
		createSnackbar,
		errorLabel,
		removeMediaGalleryAttachment,
		successLabel
	]);

	return { canDelete, modalOpen, openModal, closeModal, confirmDelete };
};

export default useDeleteAttachment;
