/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import {
	getImagePreviewURL,
	getImageThumbnailURL,
	getPdfPreviewURL,
	getPdfThumbnailURL,
	getURLAttachment
} from '../network';
import { AttachmentMessageType } from '../types/store/ChatsRegistryTypes';

const PDF_MIME_TYPE = 'application/pdf';

export enum AttachmentType {
	JPEG = 'jpeg',
	PNG = 'png',
	GIF = 'gif',
	SVG = 'svg',
	WEBP = 'webp',
	PDF = 'pdf',
	DOCX = 'docx',
	PPTX = 'pptx',
	XLSX = 'xlsx',
	MPKG = 'mpkg',
	ODP = 'odp',
	ODS = 'ods',
	ODT = 'odt',
	PPT = 'ppt',
	XLS = 'xls',
	MP4 = 'mp4',
	WEBM = 'webm',
	OGV = 'ogv',
	MOV = 'mov'
}

export const VIDEO_MIME_TYPES = [
	'video/mp4',
	'video/webm',
	'video/ogg',
	'video/quicktime'
] as const;

export enum ImageQuality {
	LOWEST = 'Lowest',
	LOW = 'Low',
	MEDIUM = 'Medium',
	HIGH = 'High',
	HIGHEST = 'Highest'
}

export enum ImageShape {
	ROUNDED = 'Rounded',
	RECTANGULAR = 'Rectangular'
}

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
		mimeType: PDF_MIME_TYPE,
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
	},
	{
		extension: AttachmentType.MP4,
		mimeType: 'video/mp4',
		preview: AttachmentType.MP4
	},
	{
		extension: AttachmentType.WEBM,
		mimeType: 'video/webm',
		preview: AttachmentType.WEBM
	},
	{
		extension: AttachmentType.OGV,
		mimeType: 'video/ogg',
		preview: AttachmentType.OGV
	},
	{
		extension: AttachmentType.MOV,
		mimeType: 'video/quicktime',
		preview: AttachmentType.MOV
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
	if (mimeType.startsWith('video/')) return getURLAttachment(attachmentId);
	if (getAttachmentExtension(mimeType) === AttachmentType.PDF)
		return getPdfPreviewURL(attachmentId);
	return getImagePreviewURL(attachmentId, '0x0', ImageQuality.HIGH, getPreviewType(mimeType));
};

export const getAttachmentThumbnailURL = (
	attachmentId: string,
	mimeType: string
): string | undefined => {
	if (!isPreviewSupported(mimeType)) return undefined;
	if (mimeType.startsWith('video/')) return undefined;
	if (getAttachmentExtension(mimeType) === AttachmentType.PDF)
		return getPdfThumbnailURL(attachmentId, '0x0', ImageQuality.LOW);
	return getImageThumbnailURL(
		attachmentId,
		'0x0',
		ImageQuality.LOW,
		getPreviewType(mimeType),
		ImageShape.RECTANGULAR
	);
};

export const downloadAttachment = (attachmentId: string, fileName: string): void => {
	const downloadUrl = getURLAttachment(attachmentId);
	const linkTag: HTMLAnchorElement = document.createElement('a');
	document.body.appendChild(linkTag);
	linkTag.href = downloadUrl;
	linkTag.download = fileName;
	linkTag.target = '_blank';
	linkTag.click();
	linkTag.remove();
};

export const getImageSize = (url: string): Promise<{ width: number; height: number }> =>
	new Promise((resolve, reject) => {
		try {
			const img = new Image();
			img.addEventListener(
				'load',
				() => {
					resolve({ width: img.naturalWidth, height: img.naturalHeight });
				},
				{ once: true }
			);
			img.src = url;
		} catch {
			reject(new Error(`Could not get image size for`));
		}
	});

export const canDisplayPreviewOnLoad = (attachmentType: string): boolean => {
	const type = attachmentType.split('/');
	return type[0] === 'image';
};

export const isAttachmentImage = (attachmentType: string): boolean => {
	const type = attachmentType.split('/');
	if (type[0]) return type[0] === 'image';
	return false;
};

export const isAttachmentVideo = (attachmentType: string): boolean =>
	attachmentType.split('/')[0] === 'video';

export const getAttachmentType = (attachmentType: string): 'pdf' | 'image' | 'video' => {
	if (isAttachmentImage(attachmentType)) return 'image';
	if (isAttachmentVideo(attachmentType)) return 'video';
	return 'pdf';
};

export const getApplicationIcon = (mimeType: string): string => {
	switch (mimeType.split('/')[1]) {
		case 'pdf':
			return 'FilePdfOutline';
		case 'powerpoint':
			return 'FilePresentationOutline';
		case 'rft':
		case 'zip':
		case 'x-zip':
			return 'FileZipOutline';
		case 'excel':
		case 'x-excel':
		case 'vnd.ms-excel':
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

const spreadsheetMimeTypes = new Set([
	'application/vnd.ms-excel',
	'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
	'application/vnd.oasis.opendocument.spreadsheet',
	'text/csv'
]);

const presentationMimeTypes = new Set([
	'application/vnd.ms-powerpoint',
	'application/vnd.openxmlformats-officedocument.presentationml.presentation',
	'application/vnd.oasis.opendocument.presentation'
]);

export const getPinAttachmentIcon = (fileType: string): string => {
	const mainType = fileType.split('/')[0];

	if (fileType.includes('pdf')) {
		return 'FilePdf';
	}
	if (mainType === 'image') {
		return 'Image';
	}
	if (spreadsheetMimeTypes.has(fileType)) {
		return 'FileCalc';
	}
	if (presentationMimeTypes.has(fileType)) {
		return 'FilePresentation';
	}
	if (mainType === 'video') {
		return 'Video';
	}
	if (mainType === 'audio') {
		return 'Music';
	}
	return 'FileText';
};

export const getPinAttachmentColor = (fileType: string): string => {
	const mainType = fileType.split('/')[0];

	if (fileType === PDF_MIME_TYPE || mainType === 'image' || mainType === 'video') {
		return 'error';
	}
	if (spreadsheetMimeTypes.has(fileType)) {
		return 'success';
	}
	if (presentationMimeTypes.has(fileType)) {
		return '#FFA726'; // avatar_47
	}
	if (mainType === 'audio') {
		return 'gray0';
	}
	return 'primary';
};
