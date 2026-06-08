/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { PreviewItem } from '@zextras/carbonio-ui-preview';
import { TFunction } from 'i18next';

import {
	downloadAttachment,
	getAttachmentExtension,
	getAttachmentSize,
	getAttachmentType,
	getAttachmentURL
} from './attachmentUtils';
import { Attachment } from '../types/network/models/attachmentTypes';

export const buildPreviewItem = (
	attachment: Attachment,
	t: TFunction,
	options?: { onDelete?: (attachmentId: string) => void }
): PreviewItem | null => {
	const attachmentURL = getAttachmentURL(attachment.id, attachment.mimeType);
	if (!attachmentURL) return null;

	const attachmentType = getAttachmentType(attachment.mimeType);
	const extension = getAttachmentExtension(attachment.mimeType);
	const size = getAttachmentSize(attachment.size);

	const downloadAction = {
		icon: 'DownloadOutline',
		tooltipLabel: t('action.download', 'Download'),
		id: 'DownloadOutline',
		onClick: (ev: React.MouseEvent<HTMLButtonElement> | KeyboardEvent): void => {
			ev.preventDefault();
			downloadAttachment(attachment.id, attachment.name);
		}
	};
	const onDelete = options?.onDelete;
	const deleteAction = onDelete && {
		icon: 'Trash2Outline',
		tooltipLabel: t('action.delete', 'Delete'),
		id: 'Trash2Outline',
		onClick: (ev: React.MouseEvent<HTMLButtonElement> | KeyboardEvent): void => {
			ev.preventDefault();
			onDelete(attachment.id);
		}
	};
	const actions = deleteAction ? [downloadAction, deleteAction] : [downloadAction];

	const commonOptions = {
		id: attachment.id,
		filename: attachment.name,
		extension: extension?.toUpperCase(),
		size,
		actions,
		closeAction: {
			id: 'close-action',
			icon: 'ArrowBackOutline',
			tooltipLabel: t('action.close', 'Close')
		},
		previousTooltip: t('preview.previous.tooltip', 'Previous'),
		nextTooltip: t('preview.next.tooltip', 'Next'),
		src: attachmentURL
	};

	if (attachmentType === 'video') {
		return {
			...commonOptions,
			previewType: 'video',
			mimeType: attachment.mimeType,
			errorLabel: t(
				'preview.video.error',
				'This video cannot be played in your browser. Please download it.'
			)
		};
	}
	return { ...commonOptions, previewType: attachmentType };
};
