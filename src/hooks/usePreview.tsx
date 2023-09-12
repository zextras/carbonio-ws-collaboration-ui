/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { PreviewsManagerContext } from '@zextras/carbonio-ui-preview';
import { useCallback, useContext, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { AttachmentsApi } from '../network';
import { AttachmentMessageType } from '../types/store/MessageTypes';
import {
	getAttachmentExtension,
	getAttachmentSize,
	getAttachmentType,
	getAttachmentURL
} from '../utils/attachmentUtils';

export type UsePreviewHook = {
	onPreviewClick: () => void;
};

const usePreview = (attachment: AttachmentMessageType): UsePreviewHook => {
	const [t] = useTranslation();
	const { createPreview } = useContext(PreviewsManagerContext);

	const extension = getAttachmentExtension(attachment.mimeType)?.toUpperCase();

	const attachmentType = getAttachmentType(attachment.mimeType);

	const size = useMemo(() => getAttachmentSize(attachment.size), [attachment]);

	const attachmentURL = useMemo(
		() => getAttachmentURL(attachment.id, attachment.mimeType),
		[attachment.id, attachment.mimeType]
	);

	const download = useCallback(() => {
		const downloadUrl = AttachmentsApi.getURLAttachment(attachment.id);
		const linkTag: HTMLAnchorElement = document.createElement('a');
		document.body.appendChild(linkTag);
		linkTag.href = downloadUrl;
		linkTag.download = attachment.name;
		linkTag.target = '_blank';
		linkTag.click();
		linkTag.remove();
	}, [attachment.id, attachment.name]);

	const onPreviewClick = useCallback(() => {
		if (attachmentURL) {
			createPreview({
				previewType: attachmentType,
				filename: attachment.name,
				extension,
				size,
				actions: [
					{
						icon: 'DownloadOutline',
						tooltipLabel: t('action.download', 'Download'),
						id: 'DownloadOutline',
						onClick: (): void => download()
					}
				],
				closeAction: {
					id: 'close-action',
					icon: 'ArrowBackOutline',
					tooltipLabel: t('action.close', 'Close')
				},
				src: attachmentURL
			});
		}
	}, [attachment.name, attachmentURL, createPreview, download, extension, size, t, attachmentType]);

	return { onPreviewClick };
};

export default usePreview;
