/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { AttachmentsApi } from '../network';
import { ImageQuality } from '../types/network/apis/IAttachmentsApi';

// TODO implement all the possible extensions based on Previewer
const previewExtensionSupported = {
	png: 'image/png',
	gif: 'image/gif',
	jpeg: 'image/jpeg',
	webp: 'image/webp',
	pdf: 'application/pdf'
};

export const isPreviewSupported = (mimeType: string): boolean =>
	Object.values(previewExtensionSupported).includes(mimeType);

// returns the thumbnail's url of the attachment
export const getThumbnailURL = (attachmentId: string, mimeType: string): string | undefined => {
	if (isPreviewSupported(mimeType)) {
		return mimeType === previewExtensionSupported.pdf
			? AttachmentsApi.getPdfThumbnailURL(attachmentId, '0x0', ImageQuality.LOW)
			: AttachmentsApi.getImageThumbnailURL(attachmentId, '0x0', ImageQuality.LOW);
	}
	return undefined;
};

// returns the attachment's url
export const getAttachmentURL = (attachmentId: string, mimeType: string): string | undefined => {
	if (isPreviewSupported(mimeType)) {
		return mimeType === previewExtensionSupported.pdf
			? AttachmentsApi.getPdfPreviewURL(attachmentId)
			: AttachmentsApi.getImagePreviewURL(attachmentId, '0x0', ImageQuality.HIGH);
	}
	return undefined;
};
