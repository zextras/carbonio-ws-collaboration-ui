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

export const getExtension = (attachmentType: string): string | undefined => {
	const type = attachmentType.split('/');
	if (type[1]) return type[1].toUpperCase();
	return undefined;
};

export const getAttachmentType = (extension: string): 'pdf' | 'image' => {
	if (extension === 'PDF') {
		return 'pdf';
	}
	return 'image';
};

export const canDisplayPreview = (attachmentType: string): boolean => {
	const type = attachmentType.split('/');
	return type[0] === 'image';
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const getAttachmentIcon = (fileType: string): string => {
	switch (fileType.split('/')[0]) {
		case 'audio':
			return 'FileAudioOutline';
		case 'video':
			return 'FileVideoOutline';
		case 'application':
			switch (fileType.split('/')[1]) {
				case 'pdf':
					return 'FilePdfOutline';
				case 'powerpoint':
					return 'FilePresentationOutline';
				case 'rft':
				case 'zip':
					return 'FileZipOutline';
				case 'excel':
				case 'x-excel':
					return 'FileCalcOutline';
				default:
					return 'FileAppOutline';
			}
		case 'text':
			return 'FileOutline';
		case 'image':
			return 'FileImageOutline';
		default:
			return 'FileOutline';
	}
};

export const getAttachmentSize = (attachmentSize: number): string | undefined => {
	if (attachmentSize) {
		if (attachmentSize < 1024) {
			return `${attachmentSize}B`;
		}
		if (attachmentSize < 1024 * 1024) {
			return `${(attachmentSize / 1024).toFixed(2)}KB`;
		}
		if (attachmentSize < 1024 * 1024 * 1024) {
			return `${(attachmentSize / 1024 / 1024).toFixed(2)}MB`;
		}
		return `${(attachmentSize / 1024 / 1024 / 1024).toFixed(2)}GB`;
	}
	return undefined;
};
