/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
/* eslint-disable @typescript-eslint/explicit-function-return-type, @typescript-eslint/explicit-module-boundary-types */
/**
 * Zextras Carbonio Workstream Collaboration API
 * Zextras Carbonio Workstream Collaboration HTTP APIs definition.
 * OpenAPI spec version: 1.6.0
 */
import type {
	GetImagePreviewParams,
	GetImageThumbnailParams,
	GetPdfPreviewParams,
	GetPdfThumbnailParams,
	N200PreviewFileResponse
} from '../api.schemas';

/**
 * Creates and returns a preview of the image fetched by id
with the given size, quality and format
- **fileId**: UUID of the image
- **quality**: quality of the output image
(the higher you go the slower the process)
- **output_format**: format of the output image
- **area**: width of the output image (>=0) x
height of the output image (>=0), width x height => 100x200.
The first is width, the latter height, the order is important!
- **crop**: True will crop the picture starting from the borders.
This option will lose information, leaving it False will scale and
have borders to fill the requested size.

 * @summary Get image preview
 */
export const getGetImagePreviewUrl = (
	fileId: string,
	area: string,
	params?: GetImagePreviewParams
) => {
	const normalizedParams = new URLSearchParams();

	Object.entries(params || {}).forEach(([key, value]) => {
		if (value !== undefined) {
			normalizedParams.append(key, value === null ? 'null' : value.toString());
		}
	});

	const stringifiedParams = normalizedParams.toString();

	return stringifiedParams.length > 0
		? `/preview/image/${fileId}/${area}/?${stringifiedParams}`
		: `/preview/image/${fileId}/${area}/`;
};

export const getImagePreview = async (
	fileId: string,
	area: string,
	params?: GetImagePreviewParams,
	options?: RequestInit
): Promise<N200PreviewFileResponse> => {
	const res = await fetch(getGetImagePreviewUrl(fileId, area, params), {
		...options,
		method: 'GET'
	});

	const body = [204, 205, 304].includes(res.status) ? null : await res.text();
	const data: N200PreviewFileResponse = body ? JSON.parse(body) : {};

	return data;
};

/**
 * Creates and returns a preview of the image fetched by id
with the given size, quality and format
- **fileId**: UUID of the image
- **quality**: quality of the output image
(the higher you go the slower the process)
- **output_format**: format of the output image
- **area**: width of the output image (>=0) x
height of the output image (>=0), width x height => 100x200.
The first is width, the latter height, the order is important!
- **shape**: Rounded and Rectangular are currently supported.

 * @summary Get image thumbnail
 */
export const getGetImageThumbnailUrl = (
	fileId: string,
	area: string,
	params?: GetImageThumbnailParams
) => {
	const normalizedParams = new URLSearchParams();

	Object.entries(params || {}).forEach(([key, value]) => {
		if (value !== undefined) {
			normalizedParams.append(key, value === null ? 'null' : value.toString());
		}
	});

	const stringifiedParams = normalizedParams.toString();

	return stringifiedParams.length > 0
		? `/preview/image/${fileId}/${area}/thumbnail?${stringifiedParams}`
		: `/preview/image/${fileId}/${area}/thumbnail`;
};

export const getImageThumbnail = async (
	fileId: string,
	area: string,
	params?: GetImageThumbnailParams,
	options?: RequestInit
): Promise<N200PreviewFileResponse> => {
	const res = await fetch(getGetImageThumbnailUrl(fileId, area, params), {
		...options,
		method: 'GET'
	});

	const body = [204, 205, 304].includes(res.status) ? null : await res.text();
	const data: N200PreviewFileResponse = body ? JSON.parse(body) : {};

	return data;
};

/**
 * Creates and returns a preview of the pdf fetched by id,
the pdf file will contain the first and last page given. With default values
it will return a pdf with all the pages.
- **fileId**: UUID of the pdf
- **first_page**: integer value of first page to preview (n>=1)
- **last_page**: integer value of last page to preview (0 = last of the original pdf)

 * @summary Get pdf preview
 */
export const getGetPdfPreviewUrl = (fileId: string, params?: GetPdfPreviewParams) => {
	const normalizedParams = new URLSearchParams();

	Object.entries(params || {}).forEach(([key, value]) => {
		if (value !== undefined) {
			normalizedParams.append(key, value === null ? 'null' : value.toString());
		}
	});

	const stringifiedParams = normalizedParams.toString();

	return stringifiedParams.length > 0
		? `/preview/pdf/${fileId}/?${stringifiedParams}`
		: `/preview/pdf/${fileId}/`;
};

export const getPdfPreview = async (
	fileId: string,
	params?: GetPdfPreviewParams,
	options?: RequestInit
): Promise<N200PreviewFileResponse> => {
	const res = await fetch(getGetPdfPreviewUrl(fileId, params), {
		...options,
		method: 'GET'
	});

	const body = [204, 205, 304].includes(res.status) ? null : await res.text();
	const data: N200PreviewFileResponse = body ? JSON.parse(body) : {};

	return data;
};

/**
 * Creates and returns a preview of the pdf fetched by id
with the given size, quality and format
- **fileId**: UUID of the pdf
- **quality**: quality of the output image
(the higher you go the slower the process)
- **output_format**: format of the output image
- **area**: width of the output image (>=0) x
height of the output image (>=0), width x height => 100x200.
The first is width, the latter height, the order is important!
- **shape**: Rounded and Rectangular are currently supported.

 * @summary Get pdf thumbnail
 */
export const getGetPdfThumbnailUrl = (
	fileId: string,
	area: string,
	params?: GetPdfThumbnailParams
) => {
	const normalizedParams = new URLSearchParams();

	Object.entries(params || {}).forEach(([key, value]) => {
		if (value !== undefined) {
			normalizedParams.append(key, value === null ? 'null' : value.toString());
		}
	});

	const stringifiedParams = normalizedParams.toString();

	return stringifiedParams.length > 0
		? `/preview/pdf/${fileId}/${area}/thumbnail?${stringifiedParams}`
		: `/preview/pdf/${fileId}/${area}/thumbnail`;
};

export const getPdfThumbnail = async (
	fileId: string,
	area: string,
	params?: GetPdfThumbnailParams,
	options?: RequestInit
): Promise<N200PreviewFileResponse> => {
	const res = await fetch(getGetPdfThumbnailUrl(fileId, area, params), {
		...options,
		method: 'GET'
	});

	const body = [204, 205, 304].includes(res.status) ? null : await res.text();
	const data: N200PreviewFileResponse = body ? JSON.parse(body) : {};

	return data;
};
