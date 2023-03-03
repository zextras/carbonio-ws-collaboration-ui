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
import { getAttachmentURL } from '../utils/attachmentUtils';

export type UsePreviewHook = {
	onPreviewClick: () => void;
};

const usePreview = (attachment: AttachmentMessageType): UsePreviewHook => {
	const [t] = useTranslation();
	const { createPreview } = useContext(PreviewsManagerContext);

	const attachmentURL = useMemo(
		() => getAttachmentURL(attachment.id, attachment.mimeType),
		[attachment.id, attachment.mimeType]
	);

	const attachmentType: string = useMemo(
		() => attachment.mimeType.split('/')[0]?.toUpperCase(),
		[attachment.mimeType]
	);

	const extension = useMemo(() => attachment.mimeType.split('/')[1]?.toUpperCase(), [attachment]);

	const size = useMemo(() => {
		if (attachment) {
			if (attachment.size < 1024) {
				return `${attachment.size}B`;
			}
			if (attachment.size < 1024 * 1024) {
				return `${(attachment.size / 1024).toFixed(2)}KB`;
			}
			if (attachment.size < 1024 * 1024 * 1024) {
				return `${(attachment.size / 1024 / 1024).toFixed(2)}MB`;
			}
			return `${(attachment.size / 1024 / 1024 / 1024).toFixed(2)}GB`;
		}
		return undefined;
	}, [attachment]);

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
		if (attachmentURL !== undefined) {
			createPreview({
				previewType: attachmentType as 'image' | 'pdf',
				filename: attachment.name,
				extension,
				size: size || undefined,
				actions: [
					{
						icon: 'DownloadOutline',
						tooltipLabel: t('preview.actions.tooltip.download', 'Download'),
						id: 'DownloadOutline',
						onClick: (): void => download()
					}
				],
				closeAction: {
					id: 'close-action',
					icon: 'ArrowBackOutline',
					tooltipLabel: t('preview.close.tooltip', 'Close')
				},
				src: attachmentURL
			});
		}
	}, [attachment.name, attachmentType, attachmentURL, createPreview, download, extension, size, t]);

	return { onPreviewClick };
};

export default usePreview;
