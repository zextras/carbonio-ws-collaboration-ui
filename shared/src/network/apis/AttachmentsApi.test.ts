/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as api from './AttachmentsApi';
import { mockFetchAPI } from '../../tests/setupTests';
import { RequestType } from '../../types/network/fetch';

const contentType = 'Content-Type';
const applicationJson = 'application/json';

enum AttachmentType {
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

enum ImageQuality {
	LOWEST = 'Lowest',
	LOW = 'Low',
	MEDIUM = 'Medium',
	HIGH = 'High',
	HIGHEST = 'Highest'
}

enum ImageShape {
	ROUNDED = 'Rounded',
	RECTANGULAR = 'Rectangular'
}

const pdfThumbnailCases: Array<[string, Array<string | undefined>, string]> = [
	['shape', [undefined, ImageShape.ROUNDED, undefined], '?shape=Rounded&output_format=jpeg'],
	['quality', [ImageQuality.HIGH, undefined, undefined], '?quality=High&output_format=jpeg'],
	['attachmentType', [undefined, undefined, AttachmentType.PDF], '?output_format=pdf']
];

const imagePreviewCases: Array<[string, Array<string | undefined>, string]> = [
	['normal', [ImageQuality.LOW, AttachmentType.PNG], '?quality=Low&output_format=png'],
	['quality', [ImageQuality.HIGH, undefined], '?quality=High'],
	['attachmentType', [undefined, AttachmentType.PNG], '?output_format=png']
];

const pdfPreviewURLCases: Array<[string, Array<number | undefined>, string]> = [
	['first and last', [1, 10], '?first_page=1&last_page=10'],
	['first only', [2, undefined], '?first_page=2'],
	['last only', [undefined, 5], '?last_page=5']
];

describe('Attachments API', () => {
	test('deleteAttachment is called correctly', async () => {
		// Send deleteAttachment request
		await api.deleteAttachment('fileId');

		// Set appropriate headers
		const headers = new Headers();
		headers.append(contentType, applicationJson);

		expect(mockFetchAPI).toHaveBeenCalledWith('attachments/fileId', RequestType.DELETE);
	});

	test('getAttachmentInfo is called correctly', async () => {
		// Send getAttachmentInfo request
		await api.getAttachmentInfo('fileId');

		expect(mockFetchAPI).toHaveBeenCalledWith('attachments/fileId', RequestType.GET);
	});

	test('getAttachment is called correctly', async () => {
		// Send getAttachment request
		await api.getAttachment('fileId');

		expect(mockFetchAPI).toHaveBeenCalledWith('attachments/fileId/download', RequestType.GET);
	});

	test.each(imagePreviewCases)(
		'getImagePreview with %s only',
		async (type, queryParams, queryRes) => {
			// Send getAttachmentPreview request
			await api.getImagePreview('fileId', '0x0', ...queryParams);

			// Set appropriate headers
			const headers = new Headers();
			headers.append(contentType, applicationJson);

			expect(mockFetchAPI).toHaveBeenCalledWith(
				`preview/image/fileId/0x0/${queryRes}`,
				RequestType.GET
			);
		}
	);

	test('getImageThumbnail is called correctly', async () => {
		// Send getAttachmentPreview request
		await api.getImageThumbnail(
			'fileId',
			'0x0',
			ImageQuality.HIGH,
			AttachmentType.JPEG,
			ImageShape.ROUNDED
		);

		expect(mockFetchAPI).toHaveBeenCalledWith(
			'preview/image/fileId/0x0/thumbnail/?quality=High&output_format=jpeg&shape=Rounded',
			RequestType.GET
		);
	});

	test('getPdfPreview is called correctly', async () => {
		// Send getAttachmentPreview request
		await api.getPdfPreview('fileId', 1, 4);

		// Set appropriate headers
		const headers = new Headers();
		headers.append(contentType, applicationJson);

		expect(mockFetchAPI).toHaveBeenCalledWith(
			'preview/pdf/fileId/?first_page=1&last_page=4',
			RequestType.GET
		);
	});

	test('getPdfThumbnail is called correctly', async () => {
		// Send getAttachmentPreview request
		await api.getPdfThumbnail(
			'fileId',
			'0x0',
			ImageQuality.LOWEST,
			ImageShape.RECTANGULAR,
			AttachmentType.PNG
		);

		expect(mockFetchAPI).toHaveBeenCalledWith(
			'preview/pdf/fileId/0x0/thumbnail/?shape=Rectangular&quality=Lowest&output_format=png',
			RequestType.GET
		);
	});

	test.each(pdfThumbnailCases)(
		'getPdfThumbnail with %s only',
		async (type, queryParams, queryRes) => {
			// Send getAttachmentPreview request
			await api.getPdfThumbnail('fileId', '0x0', ...queryParams);

			expect(mockFetchAPI).toHaveBeenCalledWith(
				`preview/pdf/fileId/0x0/thumbnail/${queryRes}`,
				RequestType.GET
			);
		}
	);
});
