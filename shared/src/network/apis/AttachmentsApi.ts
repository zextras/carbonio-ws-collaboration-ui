/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
/* eslint-disable sonarjs/no-nested-template-literals */

import { sharedConfig } from '../../config';
import { RequestType } from '../../types/network/fetch';
import { Attachment } from '../../types/network/models/attachmentTypes';
import { buildQueryString } from '../../utils/fetchUtils';

export const getAttachment = (fileId: string): Promise<Blob> =>
	sharedConfig.fetchAPI(`attachments/${fileId}/download`, RequestType.GET);

export const getAttachmentInfo = (fileId: string): Promise<Attachment> =>
	sharedConfig.fetchAPI(`attachments/${fileId}`, RequestType.GET);

export const deleteAttachment = (fileId: string): Promise<Response> =>
	sharedConfig.fetchAPI(`attachments/${fileId}`, RequestType.DELETE);

export const getImagePreview = (
	fileId: string,
	area: string,
	quality?: string,
	format?: string
): Promise<Blob> => {
	const params = buildQueryString({ quality, output_format: format });
	return sharedConfig.fetchAPI(`preview/image/${fileId}/${area}/${params}`, RequestType.GET);
};

export const getImageThumbnail = (
	fileId: string,
	area: string,
	quality?: string,
	format?: string,
	shape?: string
): Promise<Blob> => {
	const params = buildQueryString({ quality, output_format: format, shape });
	return sharedConfig.fetchAPI(
		`preview/image/${fileId}/${area}/thumbnail/${params}`,
		RequestType.GET
	);
};

export const getPdfPreview = (
	fileId: string,
	firstPage?: number,
	lastPage?: number
): Promise<Blob> => {
	const params = buildQueryString({ first_page: firstPage, last_page: lastPage });
	return sharedConfig.fetchAPI(`preview/pdf/${fileId}/${params}`, RequestType.GET);
};

export const getPdfThumbnail = (
	fileId: string,
	area: string,
	quality?: string,
	shape?: string,
	format = 'jpeg'
): Promise<Blob> => {
	const params = buildQueryString({ shape, quality, output_format: format });
	return sharedConfig.fetchAPI(
		`preview/pdf/${fileId}/${area}/thumbnail/${params}`,
		RequestType.GET
	);
};
