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

// generates random id format 'aaaaaaaa'-'aaaa'-'aaaa'-'aaaa'-'aaaaaaaaaaaa'
export const uid = (): string => {
	const s4 = (): string =>
		Math.floor((1 + Math.random()) * 0x10000)
			.toString(16)
			.substring(1);
	return `${s4() + s4()}-${s4()}-${s4()}-${s4()}-${s4()}${s4()}${s4()}`;
};
