/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { AttachmentsApi } from '../network';
import { AttachmentType, ImageQuality, ImageShape } from '../types/network/apis/IAttachmentsApi';
import { AttachmentMessageType } from '../types/store/ChatsRegistryTypes';

export const extensionsSupported = [
	{
		extension: AttachmentType.JPEG,
		mimeType: 'image/jpeg',
		preview: AttachmentType.JPEG
	},
	{
		extension: AttachmentType.PNG,
		mimeType: 'image/png',
		preview: AttachmentType.PNG
	},
	{
		extension: AttachmentType.GIF,
		mimeType: 'image/gif',
		preview: AttachmentType.GIF
	},
	{
		extension: AttachmentType.SVG,
		mimeType: 'image/svg+xml',
		preview: AttachmentType.PNG
	},
	{
		extension: AttachmentType.WEBP,
		mimeType: 'image/webp',
		preview: AttachmentType.JPEG
	},
	{
		extension: AttachmentType.PDF,
		mimeType: 'application/pdf',
		preview: AttachmentType.JPEG
	},
	{
		extension: AttachmentType.DOCX,
		mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
	},
	{
		extension: AttachmentType.PPTX,
		mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
	},
	{
		extension: AttachmentType.XLSX,
		mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
	},
	{
		extension: AttachmentType.ODP,
		mimeType: 'application/vnd.oasis.opendocument.presentation'
	},
	{
		extension: AttachmentType.ODS,
		mimeType: 'application/vnd.oasis.opendocument.spreadsheet'
	},
	{
		extension: AttachmentType.ODT,
		mimeType: 'application/vnd.oasis.opendocument.text'
	},
	{
		extension: AttachmentType.MPKG,
		mimeType: 'application/vnd.apple.installer+xml'
	}
];

export const isPreviewSupported = (mimeType: string): boolean =>
	extensionsSupported.some((ext) => ext.mimeType === mimeType && ext.preview);

export const getPreviewType = (mimeType: string): string | undefined => {
	const extension = extensionsSupported.find((ext) => ext.mimeType === mimeType);
	if (extension) return extension.preview ?? AttachmentType.JPEG;
	return AttachmentType.JPEG;
};

export const getAttachmentExtension = (mimeType: string | undefined): string => {
	if (!mimeType) return '';
	const extension = extensionsSupported.find((ext) => ext.mimeType === mimeType);
	if (extension) return extension.extension;
	const type = mimeType.split('/');
	return type[1] || type[0];
};

export const getAttachmentSize = (messageSize: number | undefined): string => {
	if (!messageSize) return '';
	if (messageSize < 1024) {
		return `${messageSize}B`;
	}
	if (messageSize < 1024 * 1024) {
		return `${(messageSize / 1024).toFixed(2)}KB`;
	}
	if (messageSize < 1024 * 1024 * 1024) {
		return `${(messageSize / 1024 / 1024).toFixed(2)}MB`;
	}
	return `${(messageSize / 1024 / 1024 / 1024).toFixed(2)}GB`;
};

export const getAttachmentDimensions = (
	attachment: AttachmentMessageType
): { width: number; height: number } => {
	const area =
		getAttachmentExtension(attachment.mimeType) === AttachmentType.PDF
			? '2480x3508'
			: (attachment.area ?? '0x0');
	const [width, height] = area.split('x');
	return {
		width: parseInt(width, 10),
		height: parseInt(height, 10)
	};
};

export const getAttachmentURL = (attachmentId: string, mimeType: string): string | undefined => {
	if (!isPreviewSupported(mimeType)) return undefined;
	if (getAttachmentExtension(mimeType) === AttachmentType.PDF)
		return AttachmentsApi.getPdfPreviewURL(attachmentId);
	return AttachmentsApi.getImagePreviewURL(
		attachmentId,
		'0x0',
		ImageQuality.HIGH,
		getPreviewType(mimeType)
	);
};

export const getAttachmentThumbnailURL = (
	attachmentId: string,
	mimeType: string
): string | undefined => {
	if (!isPreviewSupported(mimeType)) return undefined;
	if (getAttachmentExtension(mimeType) === AttachmentType.PDF)
		return AttachmentsApi.getPdfThumbnailURL(attachmentId, '0x0', ImageQuality.LOW);
	return AttachmentsApi.getImageThumbnailURL(
		attachmentId,
		'0x0',
		ImageQuality.LOW,
		getPreviewType(mimeType),
		ImageShape.RECTANGULAR
	);
};

export const canDisplayPreviewOnLoad = (attachmentType: string): boolean => {
	const type = attachmentType.split('/');
	return type[0] === 'image';
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

export const getApplicationIcon = (mimeType: string): string => {
	switch (mimeType.split('/')[1]) {
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
