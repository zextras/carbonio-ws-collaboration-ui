/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { useCallback, useMemo } from 'react';

import { Container, DropdownItem, Icon, Text } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

import { DeleteAttachmentModal } from './DeleteAttachmentModal';
import useAttachmentForward from './useAttachmentForward';
import useDeleteAttachment from './useDeleteAttachment';
import { Attachment } from '../../../../types/network/models/attachmentTypes';
import { downloadAttachment } from '../../../../utils/attachmentUtils';
import ForwardMessageModal from '../../conversation/forwardModal/ForwardMessageModal';

type UseAttachmentActionsOptions = {
	onDeleted?: () => void;
};

type UseAttachmentActionsResult = {
	canDelete: boolean;
	openDeleteModal: () => void;
	canForward: boolean;
	openForwardModal: () => void;
	download: () => void;
	contextMenuItems: Array<DropdownItem>;
	modals: React.ReactElement;
};

const useAttachmentActions = (
	target: Attachment | Array<Attachment>,
	options?: UseAttachmentActionsOptions
): UseAttachmentActionsResult => {
	const [t] = useTranslation();
	const downloadLabel = t('action.download', 'Download');
	const forwardLabel = t('action.forward', 'Forward');
	const deleteLabel = t('action.delete', 'Delete');

	const attachments = useMemo(() => (Array.isArray(target) ? target : [target]), [target]);

	const {
		canDelete,
		modalOpen: deleteModalOpen,
		openModal: openDeleteModal,
		closeModal: closeDeleteModal,
		confirmDelete
	} = useDeleteAttachment(attachments, options?.onDeleted);

	const {
		canForward,
		modalOpen: forwardModalOpen,
		openModal: openForwardModal,
		closeModal: closeForwardModal,
		messagesToForward
	} = useAttachmentForward(attachments);

	const download = useCallback(
		() => attachments.forEach(({ id, name }) => downloadAttachment(id, name)),
		[attachments]
	);

	const contextMenuItems = useMemo<Array<DropdownItem>>(() => {
		const items: Array<DropdownItem> = [
			{
				id: 'download',
				icon: 'DownloadOutline',
				label: downloadLabel,
				onClick: download
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
						data-testid={`mediaGalleryCtxDelete-${attachments[0].id}`}
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
		attachments,
		canDelete,
		canForward,
		deleteLabel,
		download,
		downloadLabel,
		forwardLabel,
		openDeleteModal,
		openForwardModal
	]);

	const roomId = attachments[0]?.roomId;
	const modals = (
		<>
			{deleteModalOpen && (
				<DeleteAttachmentModal
					open
					count={attachments.length}
					onConfirm={confirmDelete}
					onClose={closeDeleteModal}
				/>
			)}
			{forwardModalOpen && roomId !== undefined && (
				<ForwardMessageModal
					open
					onClose={closeForwardModal}
					roomId={roomId}
					messagesToForward={messagesToForward}
				/>
			)}
		</>
	);

	return {
		canDelete,
		openDeleteModal,
		canForward,
		openForwardModal,
		download,
		contextMenuItems,
		modals
	};
};

export default useAttachmentActions;
