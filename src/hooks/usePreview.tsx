/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { useCallback, useContext, useMemo } from 'react';

import { PreviewsManagerContext } from '@zextras/carbonio-ui-preview';
import { useTranslation } from 'react-i18next';

import { AttachmentMessageType } from '../types/store/ChatsRegistryTypes';
import {
	downloadAttachment,
	getAttachmentExtension,
	getAttachmentSize,
	getAttachmentType,
	getAttachmentURL
} from '../utils/attachmentUtils';

export type UsePreviewHook = {
	onPreviewClick: () => void;
};

export type UsePreviewOptions = {
	onDelete?: () => void;
};

const usePreview = (
	attachment: AttachmentMessageType,
	options?: UsePreviewOptions
): UsePreviewHook => {
	const [t] = useTranslation();
	const { createPreview } = useContext(PreviewsManagerContext);

	const onDelete = options?.onDelete;

	const attachmentType = getAttachmentType(attachment.mimeType);

	const extension = getAttachmentExtension(attachment.mimeType);
	const size = getAttachmentSize(attachment.size);

	const attachmentURL = useMemo(
		() => getAttachmentURL(attachment.id, attachment.mimeType),
		[attachment.id, attachment.mimeType]
	);

	const download = useCallback(
		() => downloadAttachment(attachment.id, attachment.name),
		[attachment.id, attachment.name]
	);

	const onPreviewClick = useCallback(() => {
		if (attachmentURL) {
			const downloadAction = {
				icon: 'DownloadOutline',
				tooltipLabel: t('action.download', 'Download'),
				id: 'DownloadOutline',
				onClick: (): void => download()
			};
			const deleteAction = onDelete && {
				icon: 'Trash2Outline',
				tooltipLabel: t('action.delete', 'Delete'),
				id: 'Trash2Outline',
				onClick: (): void => onDelete()
			};
			const actions = deleteAction ? [downloadAction, deleteAction] : [downloadAction];
			createPreview({
				previewType: attachmentType,
				filename: attachment.name,
				extension: extension?.toUpperCase(),
				size,
				actions,
				closeAction: {
					id: 'close-action',
					icon: 'ArrowBackOutline',
					tooltipLabel: t('action.close', 'Close')
				},
				src: attachmentURL
			});
		}
	}, [
		attachment.name,
		attachmentURL,
		createPreview,
		download,
		extension,
		size,
		t,
		attachmentType,
		onDelete
	]);

	return { onPreviewClick };
};

export default usePreview;
