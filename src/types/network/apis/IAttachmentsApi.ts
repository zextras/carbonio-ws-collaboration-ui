/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import {
	DeleteAttachmentResponse,
	GetAttachmentInfoResponse,
	GetAttachmentResponse,
	GetImageResponse,
	GetImageThumbnailResponse,
	GetPdfResponse,
	GetPdfThumbnailResponse
} from '../responses/attachmentsResponses';

interface IAttachmentsApi {
	// Attachments API
	deleteAttachment(fileId: string): Promise<DeleteAttachmentResponse>;
	getAttachmentInfo(fileId: string): Promise<GetAttachmentInfoResponse>;
	getURLAttachment(fileId: string): string;
	getAttachment(fileId: string): Promise<GetAttachmentResponse>;

	// Preview API
	getImagePreview(
		fileId: string,
		area: string,
		quality?: string,
		format?: string
	): Promise<GetImageResponse>;
	getImagePreviewURL(fileId: string, area: string, quality?: string, format?: string): string;
	getImageThumbnail(
		fileId: string,
		area: string,
		quality?: string,
		format?: string,
		shape?: string
	): Promise<GetImageThumbnailResponse>;
	getImageThumbnailURL(
		fileId: string,
		area: string,
		quality?: string,
		format?: string,
		shape?: string
	): string;
	getPdfPreview(fileId: string, firsPage?: number, lastPage?: number): Promise<GetPdfResponse>;
	getPdfPreviewURL(fileId: string, firsPage?: number, lastPage?: number): string;
	getPdfThumbnail(
		fileId: string,
		area: string,
		quality?: string,
		shape?: string,
		format?: string
	): Promise<GetPdfThumbnailResponse>;
	getPdfThumbnailURL(
		fileId: string,
		area: string,
		quality?: string,
		shape?: string,
		format?: string
	): string;
}

export enum ImageQuality {
	LOWEST = 'Lowest',
	LOW = 'Low',
	MEDIUM = 'Medium',
	HIGH = 'High',
	HIGHEST = 'Highest'
}

export enum AttachmentType {
	JPEG = 'Jpeg',
	PNG = 'Png',
	GIF = 'Gif',
	WEBP = 'Webp',
	PDF = 'pdf'
}

export enum ImageShape {
	ROUNDED = 'Rounded',
	RECTANGULAR = 'Rectangular'
}

export default IAttachmentsApi;
