/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC, useCallback, useContext, useMemo, useState } from 'react';

import styled from '@emotion/styled';
import { Button, Tooltip, useSnackbar } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

import { DeleteAttachmentModal } from './DeleteAttachmentModal';
import { MediaGallerySelectionContext } from './MediaGallerySelectionContext';
import { buildAttachmentForwardMessages } from './useAttachmentForward';
import { bulkDeleteRoomAttachments } from '../../../../network';
import { xmppClient } from '../../../../network/xmpp/XMPPClient';
import { getUserId } from '../../../../store/selectors/SessionSelectors';
import useStore from '../../../../store/Store';
import { downloadAttachment } from '../../../../utils/attachmentUtils';
import ForwardMessageModal from '../../conversation/forwardModal/ForwardMessageModal';

const BarContainer = styled.div`
	position: absolute;
	bottom: 0.75rem;
	left: 50%;
	transform: translateX(-50%);
	z-index: 2;
	display: flex;
	gap: 0.25rem;
	padding: 0.25rem 0.5rem;
	border-radius: 2rem;
	background-color: ${({ theme }): string => theme.palette.gray5.regular};
	box-shadow: 0 0 0.25rem rgba(0, 0, 0, 0.25);
`;

type BulkActionsBarProps = {
	roomId: string;
};

export const BulkActionsBar: FC<BulkActionsBarProps> = ({ roomId }) => {
	const [t] = useTranslation();
	const downloadTooltip = t('action.download', 'Download');
	const forwardTooltip = t('action.forward', 'Forward');
	const deleteTooltip = t('action.delete', 'Delete');
	const forwardDisabledTooltip = t(
		'mediaGallery.selection.forwardDisabled',
		'Some of the selected attachments cannot be forwarded'
	);
	const deleteDisabledTooltip = t(
		'mediaGallery.selection.deleteDisabled',
		'You can only delete your own attachments'
	);
	const successLabel = t('feedback.attachmentsDeleted', 'Attachments deleted');
	const errorLabel = t('feedback.attachmentsDeleteError', 'Could not delete some attachments');

	const sessionId = useStore(getUserId);
	const removeMediaGalleryAttachment = useStore((store) => store.removeMediaGalleryAttachment);
	const createSnackbar = useSnackbar();

	const { selectedAttachments, clearSelection } = useContext(MediaGallerySelectionContext);

	const canForwardAll = useMemo(
		() => selectedAttachments.every((attachment) => attachment.stanzaId !== undefined),
		[selectedAttachments]
	);
	const canDeleteAll = useMemo(
		() => selectedAttachments.every((attachment) => attachment.userId === sessionId),
		[selectedAttachments, sessionId]
	);

	const [deleteModalOpen, setDeleteModalOpen] = useState(false);
	const [forwardModalOpen, setForwardModalOpen] = useState(false);

	const onDownload = useCallback(() => {
		// Parallel downloads without any cap: the browser queues them by itself.
		selectedAttachments.forEach((attachment) => downloadAttachment(attachment.id, attachment.name));
	}, [selectedAttachments]);

	const messagesToForward = useMemo(
		() =>
			selectedAttachments.flatMap((attachment) => buildAttachmentForwardMessages(attachment) ?? []),
		[selectedAttachments]
	);

	const confirmDelete = useCallback(() => {
		setDeleteModalOpen(false);
		const showSnackbar = (severity: 'success' | 'error', label: string): void => {
			createSnackbar({
				key: new Date().toLocaleString(),
				severity,
				label,
				hideButton: true
			});
		};
		const targets = selectedAttachments;
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
				clearSelection();
			})
			.catch(() => showSnackbar('error', errorLabel));
	}, [
		clearSelection,
		createSnackbar,
		errorLabel,
		removeMediaGalleryAttachment,
		roomId,
		selectedAttachments,
		successLabel
	]);

	return (
		<BarContainer data-testid="mediaGalleryBulkActionsBar">
			<Tooltip label={downloadTooltip} placement="top">
				<Button
					data-testid="mediaGalleryBulkDownload"
					aria-label={downloadTooltip}
					size="large"
					icon="DownloadOutline"
					type="ghost"
					color="gray0"
					onClick={onDownload}
				/>
			</Tooltip>
			<Tooltip label={canForwardAll ? forwardTooltip : forwardDisabledTooltip} placement="top">
				<Button
					data-testid="mediaGalleryBulkForward"
					aria-label={forwardTooltip}
					size="large"
					icon="Forward"
					type="ghost"
					color="gray0"
					disabled={!canForwardAll}
					onClick={(): void => setForwardModalOpen(true)}
				/>
			</Tooltip>
			<Tooltip label={canDeleteAll ? deleteTooltip : deleteDisabledTooltip} placement="top">
				<Button
					data-testid="mediaGalleryBulkDelete"
					aria-label={deleteTooltip}
					size="large"
					icon="Trash2Outline"
					type="ghost"
					color="error"
					disabled={!canDeleteAll}
					onClick={(): void => setDeleteModalOpen(true)}
				/>
			</Tooltip>
			{deleteModalOpen && (
				<DeleteAttachmentModal
					open
					onConfirm={confirmDelete}
					onClose={(): void => setDeleteModalOpen(false)}
				/>
			)}
			{forwardModalOpen && (
				<ForwardMessageModal
					open
					onClose={(): void => setForwardModalOpen(false)}
					roomId={roomId}
					messagesToForward={messagesToForward}
				/>
			)}
		</BarContainer>
	);
};
