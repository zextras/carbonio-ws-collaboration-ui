/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { useCallback, useMemo, useState } from 'react';

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

// Deletion of one or more attachments of the same room: the API is bulk, so a
// single attachment is just a list of one.
// onDeleted runs once the request completed, partial failures included: the bulk
// bar uses it to leave the selection mode.
const useDeleteAttachment = (
	attachments: Array<Attachment>,
	onDeleted?: () => void
): UseDeleteAttachmentHook => {
	const [t] = useTranslation();
	const singleSuccessLabel = t('feedback.attachmentDeleted', 'Attachment deleted');
	const singleErrorLabel = t('feedback.attachmentDeleteError', 'Could not delete the attachment');
	const multiSuccessLabel = t('feedback.attachmentsDeleted', 'Attachments deleted');
	const multiErrorLabel = t('feedback.attachmentsDeleteError', 'Could not delete some attachments');

	const sessionId = useStore(getUserId);
	const removeMediaGalleryAttachment = useStore((store) => store.removeMediaGalleryAttachment);
	const createSnackbar = useSnackbar();

	const [modalOpen, setModalOpen] = useState(false);

	// Own attachments only, and nothing to delete is not deletable.
	const canDelete = useMemo(
		() =>
			attachments.length > 0 && attachments.every((attachment) => attachment.userId === sessionId),
		[attachments, sessionId]
	);

	const openModal = useCallback(() => setModalOpen(true), []);
	const closeModal = useCallback(() => setModalOpen(false), []);

	const confirmDelete = useCallback(() => {
		setModalOpen(false);
		const targets = attachments;
		const roomId = targets[0]?.roomId;
		if (roomId === undefined) return;

		const single = targets.length === 1;
		const successLabel = single ? singleSuccessLabel : multiSuccessLabel;
		const errorLabel = single ? singleErrorLabel : multiErrorLabel;
		const showSnackbar = (severity: 'success' | 'error', label: string): void => {
			createSnackbar({
				key: new Date().toLocaleString(),
				severity,
				label,
				hideButton: true
			});
		};

		bulkDeleteRoomAttachments(
			roomId,
			targets.map((attachment) => attachment.id)
		)
			.then((response) => {
				const failedIds = new Set(response.failedIds ?? []);
				targets.forEach((attachment) => {
					if (failedIds.has(attachment.id)) return;
					removeMediaGalleryAttachment(roomId, attachment.id);
					if (attachment.stanzaId) {
						xmppClient.sendChatMessageDeletion(roomId, attachment.stanzaId);
					}
				});
				showSnackbar(
					failedIds.size > 0 ? 'error' : 'success',
					failedIds.size > 0 ? errorLabel : successLabel
				);
				onDeleted?.();
			})
			.catch(() => showSnackbar('error', errorLabel));
	}, [
		attachments,
		createSnackbar,
		multiErrorLabel,
		multiSuccessLabel,
		onDeleted,
		removeMediaGalleryAttachment,
		singleErrorLabel,
		singleSuccessLabel
	]);

	return { canDelete, modalOpen, openModal, closeModal, confirmDelete };
};

export default useDeleteAttachment;
