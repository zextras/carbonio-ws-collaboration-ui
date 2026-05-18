/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
/* eslint-disable sonarjs/no-nested-template-literals */

import { Attachment } from '../../types/network/models/attachmentTypes';
import { buildQueryString, fetchAPI, RequestType } from '../../utils/FetchUtils';

export const getAttachment = (fileId: string): Promise<Blob> =>
	fetchAPI(`attachments/${fileId}/download`, RequestType.GET);

export const getAttachmentInfo = (fileId: string): Promise<Attachment> =>
	fetchAPI(`attachments/${fileId}`, RequestType.GET);

export const getURLAttachment = (fileId: string): string =>
	`${window.document.location.origin}/services/chats/attachments/${fileId}/download`;

export const deleteAttachment = (fileId: string): Promise<Response> =>
	fetchAPI(`attachments/${fileId}`, RequestType.DELETE);

export const getImagePreview = (
	fileId: string,
	area: string,
	quality?: string,
	format?: string
): Promise<Blob> => {
	const params = buildQueryString({ quality, output_format: format });
	return fetchAPI(`preview/image/${fileId}/${area}/${params}`, RequestType.GET);
};

export const getImagePreviewURL = (
	fileId: string,
	area: string,
	quality?: string,
	format?: string
): string => {
	const params = buildQueryString({ quality, output_format: format });
	return `${window.document.location.origin}/services/chats/preview/image/${fileId}/${area}/${params}`;
};

export const getImageThumbnail = (
	fileId: string,
	area: string,
	quality?: string,
	format?: string,
	shape?: string
): Promise<Blob> => {
	const params = buildQueryString({ quality, output_format: format, shape });
	return fetchAPI(`preview/image/${fileId}/${area}/thumbnail/${params}`, RequestType.GET);
};

export const getImageThumbnailURL = (
	fileId: string,
	area: string,
	quality?: string,
	format?: string,
	shape?: string
): string => {
	const params = buildQueryString({ quality, output_format: format, shape });
	return `${window.document.location.origin}/services/chats/preview/image/${fileId}/${area}/thumbnail/${params}`;
};

export const getPdfPreview = (
	fileId: string,
	firstPage?: number,
	lastPage?: number
): Promise<Blob> => {
	const params = buildQueryString({ first_page: firstPage, last_page: lastPage });
	return fetchAPI(`preview/pdf/${fileId}/${params}`, RequestType.GET);
};

export const getPdfPreviewURL = (fileId: string, firstPage?: number, lastPage?: number): string => {
	const params = buildQueryString({ first_page: firstPage, last_page: lastPage });
	return `${window.document.location.origin}/services/chats/preview/pdf/${fileId}/${params}`;
};

export const getPdfThumbnail = (
	fileId: string,
	area: string,
	quality?: string,
	shape?: string,
	format = 'jpeg'
): Promise<Blob> => {
	const params = buildQueryString({ shape, quality, output_format: format });
	return fetchAPI(`preview/pdf/${fileId}/${area}/thumbnail/${params}`, RequestType.GET);
};

export const getPdfThumbnailURL = (
	fileId: string,
	area: string,
	quality?: string,
	shape?: string,
	format = 'jpeg'
): string => {
	const params = buildQueryString({ shape, quality, output_format: format });
	return `${window.document.location.origin}/services/chats/preview/pdf/${fileId}/${area}/thumbnail/${params}`;
};
