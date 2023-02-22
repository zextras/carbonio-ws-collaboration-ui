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
	jpeg: 'image/jpeg'
};

export const getPreviewURL = (attachmentId: string, mimeType: string): string | undefined => {
	const isPreviewSupported = Object.values(previewExtensionSupported).includes(mimeType);
	if (isPreviewSupported) {
		return AttachmentsApi.getURLPreview(attachmentId);
	}
	return undefined;
};
