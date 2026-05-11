/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { useCallback, useContext } from 'react';

import { PreviewsManagerContext } from '@zextras/carbonio-ui-preview';
import { useTranslation } from 'react-i18next';

import { AttachmentMessageType } from '../types/store/ChatsRegistryTypes';
import { buildPreviewItem, downloadAttachment } from '../utils/attachmentUtils';

export type UsePreviewHook = {
	onPreviewClick: () => void;
	closePreview: () => void;
};

export type UsePreviewOptions = {
	onDelete?: () => void;
};

const usePreview = (
	attachment: AttachmentMessageType,
	options?: UsePreviewOptions
): UsePreviewHook => {
	const [t] = useTranslation();
	const { createPreview, emptyPreview } = useContext(PreviewsManagerContext);

	const onDelete = options?.onDelete;

	const onPreviewClick = useCallback(() => {
		const item = buildPreviewItem(
			attachment,
			{
				onDownload: () => downloadAttachment(attachment.id, attachment.name),
				onDelete
			},
			{
				downloadLabel: t('action.download', 'Download'),
				deleteLabel: t('action.delete', 'Delete'),
				closeLabel: t('action.close', 'Close')
			}
		);
		if (!item) return;
		createPreview(item);
	}, [attachment, onDelete, t, createPreview]);

	const closePreview = useCallback(() => emptyPreview(), [emptyPreview]);

	return { onPreviewClick, closePreview };
};

export default usePreview;
