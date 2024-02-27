/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { AttachmentsApi } from '../network';
import { AttachmentType, ImageQuality, ImageShape } from '../types/network/apis/IAttachmentsApi';

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

export const canDisplayPreviewOnLoad = (attachmentType: string): boolean => {
	const type = attachmentType.split('/');
	return type[0] === 'image';
};

// get attachment extension
export const getAttachmentExtension = (attachmentType: string): string | undefined => {
	const type = attachmentType.split('/');
	switch (type[1]) {
		case 'gif':
			return AttachmentType.GIF;
		case 'png':
			return AttachmentType.PNG;
		case 'jpeg':
			return AttachmentType.JPEG;
		case 'webp':
			return AttachmentType.WEBP;
		case 'pdf':
			return AttachmentType.PDF;
		case 'vnd.openxmlformats-officedocument.wordprocessingml.document':
			return AttachmentType.DOCX;
		case 'vnd.openxmlformats-officedocument.presentationml.presentation':
			return AttachmentType.PPTX;
		case 'vnd.openxmlformats-officedocument.spreadsheetml.sheet':
			return AttachmentType.XLSX;
		case 'vnd.oasis.opendocument.presentation':
			return AttachmentType.ODP;
		case 'vnd.oasis.opendocument.spreadsheet':
			return AttachmentType.ODS;
		case 'vnd.oasis.opendocument.text':
			return AttachmentType.ODT;
		case 'vnd.apple.installer+xml':
			return AttachmentType.MPKG;
		case 'vnd.ms-powerpoint':
			return AttachmentType.PPT;
		case 'vnd.ms-excel':
			return AttachmentType.XLS;
		default:
			return type[1];
	}
};

export const getAttachmentInfo = (
	messageMimeType: string | undefined,
	messageSize: number | undefined
): { extension: string | undefined; size: string | undefined } => {
	let size;
	let extension;
	if (messageMimeType !== undefined) {
		extension = getAttachmentExtension(messageMimeType)?.toUpperCase();
	} else {
		extension = undefined;
	}
	if (messageSize !== undefined) {
		if (messageSize < 1024) {
			size = `${messageSize}B`;
		} else if (messageSize < 1024 * 1024) {
			size = `${(messageSize / 1024).toFixed(2)}KB`;
		} else if (messageSize < 1024 * 1024 * 1024) {
			size = `${(messageSize / 1024 / 1024).toFixed(2)}MB`;
		} else {
			size = `${(messageSize / 1024 / 1024 / 1024).toFixed(2)}GB`;
		}
	} else {
		size = undefined;
	}
	return { extension, size };
};

// returns the thumbnail's url of the attachment
export const getThumbnailURL = (attachmentId: string, mimeType: string): string | undefined => {
	if (isPreviewSupported(mimeType)) {
		return mimeType === previewExtensionSupported.pdf
			? AttachmentsApi.getPdfThumbnailURL(attachmentId, '0x0', ImageQuality.LOW)
			: AttachmentsApi.getImageThumbnailURL(
					attachmentId,
					'0x0',
					ImageQuality.LOW,
					getAttachmentExtension(mimeType),
					ImageShape.RECTANGULAR
				);
	}
	return undefined;
};

// returns the attachment's url
export const getAttachmentURL = (attachmentId: string, mimeType: string): string | undefined => {
	if (isPreviewSupported(mimeType)) {
		return mimeType === previewExtensionSupported.pdf
			? AttachmentsApi.getPdfPreviewURL(attachmentId)
			: AttachmentsApi.getImagePreviewURL(
					attachmentId,
					'0x0',
					ImageQuality.HIGH,
					getAttachmentExtension(mimeType)
				);
	}
	return undefined;
};

// return if the attachment is an image or not
export const isAttachmentImage = (attachmentType: string): boolean => {
	const type = attachmentType.split('/');
	if (type[0]) return type[0] === 'image';
	return false;
};

// get attachment type, it's necessary for the previewer
export const getAttachmentType = (attachmentType: string): 'pdf' | 'image' => {
	if (!isAttachmentImage(attachmentType)) {
		return 'pdf';
	}
	return 'image';
};

export const getApplicationIcon = (fileType: string): string => {
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
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const getAttachmentIcon = (fileType: string): string => {
	switch (fileType.split('/')[0]) {
		case 'audio':
			return 'FileAudioOutline';
		case 'video':
			return 'FileVideoOutline';
		case 'application':
			return getApplicationIcon(fileType);
		case 'text':
			return 'FileOutline';
		case 'image':
			return 'FileImageOutline';
		default:
			return 'FileOutline';
	}
};

// generates random id format 'aaaaaaaa'-'aaaa'-'aaaa'-'aaaa'-'aaaaaaaaaaaa'
export const uid = (): string => {
	const s4 = (): string =>
		Math.floor((1 + Math.random()) * 0x10000)
			.toString(16)
			.substring(1);
	return `${s4() + s4()}-${s4()}-${s4()}-${s4()}-${s4()}${s4()}${s4()}`;
};
