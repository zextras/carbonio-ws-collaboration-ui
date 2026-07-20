/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { useMemo } from 'react';

import { Container, DropdownItem, Icon, Text } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

import { DeleteAttachmentModal } from './DeleteAttachmentModal';
import useAttachmentForward from './useAttachmentForward';
import useDeleteAttachment from './useDeleteAttachment';
import { Attachment } from '../../../../types/network/models/attachmentTypes';
import { downloadAttachment } from '../../../../utils/attachmentUtils';
import ForwardMessageModal from '../../conversation/forwardModal/ForwardMessageModal';

type UseAttachmentActionsResult = {
	canDelete: boolean;
	openDeleteModal: () => void;
	canForward: boolean;
	openForwardModal: () => void;
	// Download / Forward / Delete entries for the right-click contextual menu.
	contextMenuItems: Array<DropdownItem>;
	// Modals driven by the actions above; render them next to the component.
	modals: React.ReactElement;
};

const useAttachmentActions = (attachment: Attachment): UseAttachmentActionsResult => {
	const [t] = useTranslation();
	const downloadLabel = t('action.download', 'Download');
	const forwardLabel = t('action.forward', 'Forward');
	const deleteLabel = t('action.delete', 'Delete');

	const {
		canDelete,
		modalOpen: deleteModalOpen,
		openModal: openDeleteModal,
		closeModal: closeDeleteModal,
		confirmDelete
	} = useDeleteAttachment(attachment);

	const {
		canForward,
		modalOpen: forwardModalOpen,
		openModal: openForwardModal,
		closeModal: closeForwardModal,
		messagesToForward
	} = useAttachmentForward(attachment);

	const contextMenuItems = useMemo<Array<DropdownItem>>(() => {
		const items: Array<DropdownItem> = [
			{
				id: 'download',
				icon: 'DownloadOutline',
				label: downloadLabel,
				onClick: (): void => downloadAttachment(attachment.id, attachment.name)
			}
		];
		if (canForward) {
			items.push({
				id: 'forward',
				icon: 'Forward',
				label: forwardLabel,
				onClick: openForwardModal
			});
		}
		if (canDelete) {
			items.push({
				id: 'delete',
				onClick: openDeleteModal,
				customComponent: (
					<Container
						data-testid={`mediaGalleryCtxDelete-${attachment.id}`}
						orientation="horizontal"
						mainAlignment="flex-start"
						gap="0.5rem"
						width="fill"
					>
						<Icon icon="Trash2Outline" color="error" />
						<Text color="error">{deleteLabel}</Text>
					</Container>
				)
			});
		}
		return items;
	}, [
		attachment.id,
		attachment.name,
		canDelete,
		canForward,
		deleteLabel,
		downloadLabel,
		forwardLabel,
		openDeleteModal,
		openForwardModal
	]);

	const modals = (
		<>
			{deleteModalOpen && (
				<DeleteAttachmentModal open onConfirm={confirmDelete} onClose={closeDeleteModal} />
			)}
			{forwardModalOpen && (
				<ForwardMessageModal
					open
					onClose={closeForwardModal}
					roomId={attachment.roomId}
					messagesToForward={messagesToForward}
				/>
			)}
		</>
	);

	return { canDelete, openDeleteModal, canForward, openForwardModal, contextMenuItems, modals };
};

export default useAttachmentActions;
