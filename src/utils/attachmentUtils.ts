/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { AttachmentsApi } from '../network';

// TODO implement all the possible extensions based on Previewer
const previewExtensionSupported = {
	png: 'image/png',
	gif: 'image/gif',
	jpeg: 'image/jpeg',
	pdf: 'application/pdf'
};

export const isPreviewSupported = (mimeType: string): boolean =>
	Object.values(previewExtensionSupported).includes(mimeType);

export const getPreviewURL = (attachmentId: string, mimeType: string): string | undefined => {
	if (isPreviewSupported(mimeType)) {
		return AttachmentsApi.getURLPreview(attachmentId);
	}
	return undefined;
};

export const getAttachmentURL = (attachmentId: string, mimeType: string): string | undefined => {
	if (isPreviewSupported(mimeType)) {
		return AttachmentsApi.getURLAttachment(attachmentId);
	}
	return undefined;
};
